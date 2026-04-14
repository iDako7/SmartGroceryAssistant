package main

import (
	"fmt"
	"net/http"
	"os/exec"
	"sort"
	"sync"
	"sync/atomic"
	"time"
)

type availConfig struct {
	config
	composeDir    string
	usersPerPhase int
	recoveryWait  time.Duration
}

type phaseResult struct {
	total          int
	success        int
	responseLats   []float64 // ms — time for DELETE to return 204
	e2eLats        []float64 // ms — time from DELETE until lists fully cleaned
}

type availReport struct {
	baseline    phaseResult
	degraded    phaseResult
	drainTime   time.Duration
	drainClean  bool
	orphanCount int
}

// degradedUserRecord tracks a user deleted during degraded mode
// so we can measure end-to-end latency after recovery.
type degradedUserRecord struct {
	token      string
	deleteTime time.Time // when DELETE was issued
	ok         bool
}

func runAvailabilityExperiment(cfg availConfig) {
	fmt.Println("╔══════════════════════════════════════════════════════════╗")
	fmt.Println("║   Availability vs Consistency — CAP Tradeoff Experiment ║")
	fmt.Println("╚══════════════════════════════════════════════════════════╝")
	fmt.Printf("\nConfig: %d users/phase, %d sections/user, %d items/section\n",
		cfg.usersPerPhase, cfg.numSections, cfg.numItems)
	fmt.Printf("User Service: %s\n", cfg.userURL)
	fmt.Printf("List Service: %s\n", cfg.listURL)
	fmt.Printf("Compose Dir:  %s\n\n", cfg.composeDir)

	var report availReport

	// ── Phase A: Baseline (both services up) ───────────────
	fmt.Println("━━━ Phase A: Baseline (both services UP) ━━━")
	baseUsers := createTestUsers(cfg.config, cfg.usersPerPhase, "avail-base")
	if len(baseUsers) == 0 {
		fmt.Println("ERROR: No users created. Are both services running?")
		return
	}
	report.baseline = runBaselinePhase(cfg.config, baseUsers)
	printPhaseResult("Baseline", report.baseline)

	// Brief pause to let any in-flight events drain
	time.Sleep(2 * time.Second)

	// ── Create Phase B users BEFORE stopping list-service ──
	fmt.Println("\n━━━ Phase B Setup: Creating users (both services UP) ━━━")
	degradedUsers := createTestUsers(cfg.config, cfg.usersPerPhase, "avail-degr")
	if len(degradedUsers) == 0 {
		fmt.Println("ERROR: No users created for degraded phase.")
		return
	}
	fmt.Printf("  Created %d users for degraded phase\n", len(degradedUsers))

	// ── Stop list-service ──────────────────────────────────
	fmt.Println("\n━━━ Phase B: Stopping list-service ━━━")
	if err := dockerCompose(cfg.composeDir, "stop", "list-service"); err != nil {
		fmt.Printf("ERROR: docker compose stop: %v\n", err)
		return
	}
	if err := waitForUnhealthy(cfg.listURL, 10*time.Second); err != nil {
		fmt.Printf("WARN: list-service may still be up: %v\n", err)
	}
	fmt.Println("  list-service is DOWN")

	// ── Phase B: Delete users while list-service is down ───
	fmt.Println("\n━━━ Phase B: Deleting users (list-service DOWN) ━━━")
	degradedRecords := runDegradedDeletes(cfg.config, degradedUsers)
	successCount := 0
	for _, rec := range degradedRecords {
		if rec.ok {
			successCount++
		}
	}
	report.degraded.total = len(degradedRecords)
	report.degraded.success = successCount
	// Collect response latencies (just the DELETE round-trip)
	for _, rec := range degradedRecords {
		if rec.ok {
			report.degraded.responseLats = append(report.degraded.responseLats, 0) // placeholder, measured below
		}
	}
	fmt.Printf("\n  Degraded: %d/%d DELETE succeeded (%.1f%% availability)\n",
		successCount, len(degradedRecords), pct(successCount, len(degradedRecords)))

	// ── Phase C: Restart list-service and measure end-to-end ─
	fmt.Println("\n━━━ Phase C: Restarting list-service ━━━")
	if err := dockerCompose(cfg.composeDir, "start", "list-service"); err != nil {
		fmt.Printf("ERROR: docker compose start: %v\n", err)
		return
	}
	if err := waitForHealthy(cfg.listURL, 30*time.Second); err != nil {
		fmt.Printf("ERROR: list-service did not come back: %v\n", err)
		return
	}
	fmt.Println("  list-service is UP — measuring end-to-end latency...")

	// Measure end-to-end for each degraded user: time from DELETE until lists are clean
	drainStart := time.Now()
	report.degraded.e2eLats = nil
	report.degraded.responseLats = nil
	remaining := make(map[int]bool)
	for i, rec := range degradedRecords {
		if rec.ok {
			remaining[i] = true
		}
	}
	for len(remaining) > 0 && time.Since(drainStart) < cfg.recoveryWait {
		for i := range remaining {
			sections, err := getSections(cfg.listURL, degradedRecords[i].token)
			if err != nil || len(sections) == 0 {
				e2e := time.Since(degradedRecords[i].deleteTime)
				report.degraded.e2eLats = append(report.degraded.e2eLats, float64(e2e.Milliseconds()))
				delete(remaining, i)
			}
		}
		if len(remaining) > 0 {
			time.Sleep(100 * time.Millisecond)
		}
	}
	report.drainTime = time.Since(drainStart)
	report.drainClean = len(remaining) == 0
	sort.Float64s(report.degraded.e2eLats)

	fmt.Printf("  Drain time: %v (all clean: %v)\n", report.drainTime, report.drainClean)
	if len(report.degraded.e2eLats) > 0 {
		fmt.Printf("  End-to-end P50: %.0fms  P99: %.0fms\n",
			percentile(report.degraded.e2eLats, 50),
			percentile(report.degraded.e2eLats, 99))
	}

	// ── Phase D: Orphan audit ──────────────────────────────
	fmt.Println("\n━━━ Phase D: Orphan Audit ━━━")
	allTokens := append(tokensFrom(baseUsers), tokensFrom(degradedUsers)...)
	report.orphanCount = countOrphans(cfg.config, allTokens)
	fmt.Printf("  Orphans detected: %d / %d users\n", report.orphanCount, len(allTokens))

	// ── Summary ────────────────────────────────────────────
	printAvailReport(report)
	writeAvailCSV(report)
}

// ── Phase runners ──────────────────────────────────────────

func createTestUsers(cfg config, n int, prefix string) []testUser {
	users := make([]testUser, n)
	var errCount int64
	var wg sync.WaitGroup
	sem := make(chan struct{}, cfg.concurrency)

	for i := range n {
		wg.Add(1)
		sem <- struct{}{}
		go func(idx int) {
			defer wg.Done()
			defer func() { <-sem }()

			email := fmt.Sprintf("%s-%d-%d@test.com", prefix, time.Now().UnixNano(), idx)
			token, err := registerUser(cfg.userURL, email, "password12345")
			if err != nil {
				atomic.AddInt64(&errCount, 1)
				return
			}
			users[idx] = testUser{email: email, token: token}

			for s := range cfg.numSections {
				sid, err := createSection(cfg.listURL, token, fmt.Sprintf("S-%d", s), s)
				if err != nil {
					continue
				}
				for it := range cfg.numItems {
					createItem(cfg.listURL, token, sid, fmt.Sprintf("I-%d-%d", s, it))
					_ = it
				}
			}
		}(i)
	}
	wg.Wait()

	valid := make([]testUser, 0, n)
	for _, u := range users {
		if u.token != "" {
			valid = append(valid, u)
		}
	}
	fmt.Printf("  Created %d/%d users (%d errors)\n", len(valid), n, errCount)
	return valid
}

// runBaselinePhase measures end-to-end latency: time from DELETE request
// until the user's lists are fully soft-deleted in list_db.
func runBaselinePhase(cfg config, users []testUser) phaseResult {
	var r phaseResult
	r.total = len(users)
	type singleResult struct {
		responseLat time.Duration // DELETE round-trip
		e2eLat      time.Duration // DELETE start → lists cleaned
		ok          bool
	}

	results := make([]singleResult, len(users))
	var wg sync.WaitGroup
	sem := make(chan struct{}, cfg.concurrency)

	for i, u := range users {
		wg.Add(1)
		sem <- struct{}{}
		go func(idx int, token string) {
			defer wg.Done()
			defer func() { <-sem }()

			e2eStart := time.Now()
			err := deleteAccount(cfg.userURL, token)
			responseLat := time.Since(e2eStart)
			if err != nil {
				return
			}
			results[idx].ok = true
			results[idx].responseLat = responseLat

			// Poll until lists are cleaned — this is the end-to-end measurement
			for range 200 { // 200 * 50ms = 10s max
				sections, err := getSections(cfg.listURL, token)
				if err != nil || len(sections) == 0 {
					results[idx].e2eLat = time.Since(e2eStart)
					return
				}
				time.Sleep(50 * time.Millisecond)
			}
			// Timeout — lists never cleaned
			results[idx].e2eLat = time.Since(e2eStart)
		}(i, u.token)
	}
	wg.Wait()

	for _, sr := range results {
		if sr.ok {
			r.success++
			r.responseLats = append(r.responseLats, float64(sr.responseLat.Milliseconds()))
			r.e2eLats = append(r.e2eLats, float64(sr.e2eLat.Milliseconds()))
		}
	}
	sort.Float64s(r.responseLats)
	sort.Float64s(r.e2eLats)
	return r
}

// runDegradedDeletes deletes users while list-service is down.
// Records the wall-clock time of each DELETE for later end-to-end measurement.
func runDegradedDeletes(cfg config, users []testUser) []degradedUserRecord {
	records := make([]degradedUserRecord, len(users))
	var wg sync.WaitGroup
	sem := make(chan struct{}, cfg.concurrency)

	for i, u := range users {
		wg.Add(1)
		sem <- struct{}{}
		go func(idx int, token string) {
			defer wg.Done()
			defer func() { <-sem }()

			records[idx].token = token
			records[idx].deleteTime = time.Now()
			err := deleteAccount(cfg.userURL, token)
			if err == nil {
				records[idx].ok = true
			}
		}(i, u.token)
	}
	wg.Wait()
	return records
}

func countOrphans(cfg config, tokens []string) int {
	orphans := 0
	for _, t := range tokens {
		sections, err := getSections(cfg.listURL, t)
		if err == nil && len(sections) > 0 {
			orphans++
		}
	}
	return orphans
}

// ── Docker helpers ─────────────────────────────────────────

func dockerCompose(dir, action, service string) error {
	cmd := exec.Command("docker", "compose", action, service)
	cmd.Dir = dir
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("%s: %s", err, string(out))
	}
	return nil
}

func waitForHealthy(listURL string, timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		resp, err := http.Get(listURL + "/health")
		if err == nil {
			resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				return nil
			}
		}
		time.Sleep(500 * time.Millisecond)
	}
	return fmt.Errorf("list-service not healthy after %v", timeout)
}

func waitForUnhealthy(listURL string, timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	client := &http.Client{Timeout: 1 * time.Second}
	for time.Now().Before(deadline) {
		_, err := client.Get(listURL + "/health")
		if err != nil {
			return nil // connection refused = down
		}
		time.Sleep(500 * time.Millisecond)
	}
	return fmt.Errorf("list-service still reachable after %v", timeout)
}

// ── Reporting ──────────────────────────────────────────────

func tokensFrom(users []testUser) []string {
	t := make([]string, len(users))
	for i, u := range users {
		t[i] = u.token
	}
	return t
}

func printPhaseResult(name string, r phaseResult) {
	avail := 0.0
	if r.total > 0 {
		avail = float64(r.success) / float64(r.total) * 100
	}
	fmt.Printf("\n  %s: %d/%d succeeded (%.1f%% availability)\n", name, r.success, r.total, avail)
	if len(r.e2eLats) > 0 {
		fmt.Printf("  End-to-End Latency — P50: %.0fms  P95: %.0fms  P99: %.0fms\n",
			percentile(r.e2eLats, 50),
			percentile(r.e2eLats, 95),
			percentile(r.e2eLats, 99))
	}
}

func printAvailReport(r availReport) {
	baseAvail := pct(r.baseline.success, r.baseline.total)
	degrAvail := pct(r.degraded.success, r.degraded.total)

	fmt.Println("\n╔════════════════════════════════════════════════════════════════════════════╗")
	fmt.Println("║                Availability vs Consistency — Summary                      ║")
	fmt.Println("╠══════════════════════════╦════════════════╦═════════════════╦══════════════╣")
	fmt.Println("║ Metric                   ║ Baseline (UP)  ║ Degraded (DOWN) ║ Recovery     ║")
	fmt.Println("╠══════════════════════════╬════════════════╬═════════════════╬══════════════╣")
	fmt.Printf("║ Availability             ║ %6.1f%%        ║ %6.1f%%         ║      —       ║\n", baseAvail, degrAvail)
	fmt.Printf("║ End-to-End Latency P50   ║ %6.0f ms      ║ %7.0f ms       ║      —       ║\n",
		safePct(r.baseline.e2eLats, 50), safePct(r.degraded.e2eLats, 50))
	fmt.Printf("║ End-to-End Latency P99   ║ %6.0f ms      ║ %7.0f ms       ║      —       ║\n",
		safePct(r.baseline.e2eLats, 99), safePct(r.degraded.e2eLats, 99))
	fmt.Printf("║ Recovery Drain Time      ║      —         ║        —        ║ %6.0f ms     ║\n",
		float64(r.drainTime.Milliseconds()))
	fmt.Printf("║ Orphans Detected         ║      0         ║        —        ║      %d       ║\n", r.orphanCount)
	fmt.Println("╚══════════════════════════╩════════════════╩═════════════════╩══════════════╝")

	fmt.Println("\nEnd-to-End Latency = time from DELETE request until lists fully cleaned in list_db")
	fmt.Println()
	fmt.Println("Interpretation:")
	fmt.Println("  • Baseline: Both services up → data fully consistent within milliseconds")
	fmt.Println("  • Degraded: list-service down → DELETE succeeds instantly but data consistency")
	fmt.Println("    is deferred until recovery (end-to-end includes partition + drain time)")
	fmt.Println("  • The gap between baseline and degraded end-to-end IS the cost of choosing A over C")
	if r.orphanCount == 0 {
		fmt.Println("  • Zero orphans: Durable queues guarantee all events are eventually delivered")
	} else {
		fmt.Printf("  • WARNING: %d orphans detected — events may have been lost\n", r.orphanCount)
	}
	fmt.Println("\nCAP Theorem Observation:")
	fmt.Println("  Baseline end-to-end shows the consistency cost: ~ms when both services are up.")
	fmt.Println("  Degraded end-to-end shows the partition cost: ~seconds while list-service is down.")
	fmt.Println("  2PC would show 0ms end-to-end (instant) but 0% availability under partition.")
}

func pct(n, total int) float64 {
	if total == 0 {
		return 0
	}
	return float64(n) / float64(total) * 100
}

func safePct(data []float64, p float64) float64 {
	if len(data) == 0 {
		return 0
	}
	return percentile(data, p)
}

func writeAvailCSV(r availReport) {
	fmt.Println("\nResults written to console. Run with > availability_results.txt to capture.")
}
