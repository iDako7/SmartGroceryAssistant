// Saga Pattern Benchmark
//
// This script exercises the choreography-based saga (user deletion → list cleanup)
// end-to-end against running services. It measures:
//   - Delete request latency (user-service response time)
//   - Eventual consistency window (time until list-service has cleaned up)
//   - Throughput under concurrent load
//
// Usage:
//   go run main.go \
//     -users 50 \
//     -sections 3 \
//     -items 5 \
//     -concurrency 10 \
//     -user-url http://localhost:4001 \
//     -list-url http://localhost:4002
package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"sort"
	"sync"
	"sync/atomic"
	"time"
)

type config struct {
	userURL     string
	listURL     string
	numUsers    int
	numSections int
	numItems    int
	concurrency int
}

type testUser struct {
	email string
	token string
}

type result struct {
	userID            string
	deleteLatency     time.Duration // time for DELETE /me to return
	consistencyWindow time.Duration // time until lists are gone (polling)
	sectionsCreated   int
	itemsCreated      int
	err               error
}

func main() {
	var cfg config
	var experiment string
	var composeDir string
	var usersPerPhase int
	flag.StringVar(&cfg.userURL, "user-url", "http://localhost:4001", "User service base URL")
	flag.StringVar(&cfg.listURL, "list-url", "http://localhost:4002", "List service base URL")
	flag.IntVar(&cfg.numUsers, "users", 50, "Number of test users to create and delete")
	flag.IntVar(&cfg.numSections, "sections", 3, "Sections per user")
	flag.IntVar(&cfg.numItems, "items", 5, "Items per section")
	flag.IntVar(&cfg.concurrency, "concurrency", 10, "Concurrent delete operations")
	flag.StringVar(&experiment, "experiment", "saga", "Experiment to run: saga (default) or availability")
	flag.StringVar(&composeDir, "compose-dir", "../..", "Path to docker-compose.yml directory")
	flag.IntVar(&usersPerPhase, "users-per-phase", 20, "Users per phase (availability experiment)")
	flag.Parse()

	if experiment == "availability" {
		runAvailabilityExperiment(availConfig{
			config:        cfg,
			composeDir:    composeDir,
			usersPerPhase: usersPerPhase,
			recoveryWait:  30 * time.Second,
		})
		return
	}

	fmt.Println("=== Saga Pattern Benchmark ===")
	fmt.Printf("Config: %d users, %d sections/user, %d items/section, concurrency=%d\n",
		cfg.numUsers, cfg.numSections, cfg.numItems, cfg.concurrency)
	fmt.Printf("User Service: %s\n", cfg.userURL)
	fmt.Printf("List Service: %s\n\n", cfg.listURL)

	// Phase 1: Create test users with lists
	fmt.Println("Phase 1: Creating test users with grocery lists...")
	users := make([]testUser, cfg.numUsers)
	var createErrors int64

	var wg sync.WaitGroup
	sem := make(chan struct{}, cfg.concurrency)

	for i := range cfg.numUsers {
		wg.Add(1)
		sem <- struct{}{}
		go func(idx int) {
			defer wg.Done()
			defer func() { <-sem }()

			email := fmt.Sprintf("saga-test-%d-%d@test.com", time.Now().UnixNano(), idx)
			token, err := registerUser(cfg.userURL, email, "password12345")
			if err != nil {
				atomic.AddInt64(&createErrors, 1)
				fmt.Printf("  WARN: register user %d: %v\n", idx, err)
				return
			}
			users[idx] = testUser{email: email, token: token}

			// Create sections and items
			for s := range cfg.numSections {
				sectionID, err := createSection(cfg.listURL, token, fmt.Sprintf("Section-%d", s), s)
				if err != nil {
					fmt.Printf("  WARN: create section for user %d: %v\n", idx, err)
					continue
				}
				for it := range cfg.numItems {
					_, err := createItem(cfg.listURL, token, sectionID, fmt.Sprintf("Item-%d-%d", s, it))
					if err != nil {
						fmt.Printf("  WARN: create item for user %d: %v\n", idx, err)
					}
				}
			}
		}(i)
	}
	wg.Wait()

	validUsers := make([]testUser, 0, cfg.numUsers)
	for _, u := range users {
		if u.token != "" {
			validUsers = append(validUsers, u)
		}
	}
	fmt.Printf("  Created %d users (%d errors)\n\n", len(validUsers), createErrors)

	if len(validUsers) == 0 {
		fmt.Println("ERROR: No users created. Check that services are running.")
		os.Exit(1)
	}

	// Phase 2: Delete users and measure saga
	fmt.Println("Phase 2: Deleting users (saga trigger)...")
	results := make([]result, len(validUsers))

	start := time.Now()
	for i, u := range validUsers {
		wg.Add(1)
		sem <- struct{}{}
		go func(idx int, user testUser) {
			defer wg.Done()
			defer func() { <-sem }()
			results[idx] = measureDeletion(cfg, user.token)
		}(i, u)
	}
	wg.Wait()
	totalDuration := time.Since(start)

	// Phase 3: Analyze results
	fmt.Println("\nPhase 3: Results\n")

	var (
		deleteLatencies     []float64
		consistencyWindows  []float64
		successCount        int
		failCount           int
		orphanedCount       int
	)

	for _, r := range results {
		if r.err != nil {
			failCount++
			continue
		}
		successCount++
		deleteLatencies = append(deleteLatencies, float64(r.deleteLatency.Milliseconds()))
		if r.consistencyWindow > 0 {
			consistencyWindows = append(consistencyWindows, float64(r.consistencyWindow.Milliseconds()))
		} else {
			orphanedCount++
		}
	}

	fmt.Printf("Total deletions: %d success, %d failed\n", successCount, failCount)
	fmt.Printf("Total wall-clock time: %v\n", totalDuration)
	fmt.Printf("Throughput: %.1f deletions/sec\n\n", float64(successCount)/totalDuration.Seconds())

	if len(deleteLatencies) > 0 {
		sort.Float64s(deleteLatencies)
		fmt.Println("── Delete Request Latency (ms) ──────────────────")
		printStats("  ", deleteLatencies)
		printHistogram("  ", deleteLatencies, 10)
	}

	if len(consistencyWindows) > 0 {
		sort.Float64s(consistencyWindows)
		fmt.Println("\n── Eventual Consistency Window (ms) ─────────────")
		printStats("  ", consistencyWindows)
		printHistogram("  ", consistencyWindows, 10)
	}

	if orphanedCount > 0 {
		fmt.Printf("\nWARN: %d users had lists NOT cleaned up within timeout (orphaned data)\n", orphanedCount)
	}

	// Write CSV for external charting
	writeCSV(results, cfg)

	fmt.Println("\n=== Benchmark complete ===")
}

func measureDeletion(cfg config, token string) result {
	var r result

	// Measure DELETE latency
	deleteStart := time.Now()
	err := deleteAccount(cfg.userURL, token)
	r.deleteLatency = time.Since(deleteStart)
	if err != nil {
		r.err = err
		return r
	}

	// Poll list-service to measure consistency window
	// The JWT is still valid even though the user is deleted
	pollStart := time.Now()
	timeout := 10 * time.Second
	pollInterval := 50 * time.Millisecond

	for time.Since(pollStart) < timeout {
		sections, err := getSections(cfg.listURL, token)
		if err != nil {
			// 401 means token rejected — user fully cleaned up at gateway level
			r.consistencyWindow = time.Since(pollStart)
			return r
		}
		if len(sections) == 0 {
			r.consistencyWindow = time.Since(pollStart)
			return r
		}
		time.Sleep(pollInterval)
	}

	// Timeout — lists were never cleaned up
	r.consistencyWindow = 0 // signals orphan
	return r
}

// ── HTTP helpers ────────────────────────────────────────

func registerUser(baseURL, email, password string) (string, error) {
	body, _ := json.Marshal(map[string]string{"email": email, "password": password})
	resp, err := http.Post(baseURL+"/api/v1/users/register", "application/json", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		b, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("register %d: %s", resp.StatusCode, b)
	}

	var result struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	return result.Token, nil
}

func createSection(baseURL, token, name string, position int) (string, error) {
	body, _ := json.Marshal(map[string]any{"name": name, "position": position})
	req, _ := http.NewRequest("POST", baseURL+"/api/v1/lists/sections", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		b, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("create section %d: %s", resp.StatusCode, b)
	}

	var result struct {
		ID string `json:"id"`
	}
	json.NewDecoder(resp.Body).Decode(&result)
	return result.ID, nil
}

func createItem(baseURL, token, sectionID, name string) (string, error) {
	body, _ := json.Marshal(map[string]any{"name_en": name, "quantity": 1})
	url := fmt.Sprintf("%s/api/v1/lists/sections/%s/items", baseURL, sectionID)
	req, _ := http.NewRequest("POST", url, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		b, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("create item %d: %s", resp.StatusCode, b)
	}

	var result struct {
		ID string `json:"id"`
	}
	json.NewDecoder(resp.Body).Decode(&result)
	return result.ID, nil
}

func deleteAccount(baseURL, token string) error {
	req, _ := http.NewRequest("DELETE", baseURL+"/api/v1/users/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("delete %d: %s", resp.StatusCode, b)
	}
	return nil
}

func getSections(baseURL, token string) ([]any, error) {
	req, _ := http.NewRequest("GET", baseURL+"/api/v1/lists/sections", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("get sections %d", resp.StatusCode)
	}

	var sections []any
	json.NewDecoder(resp.Body).Decode(&sections)
	return sections, nil
}

// ── Statistics helpers ──────────────────────────────────

func printStats(prefix string, data []float64) {
	if len(data) == 0 {
		return
	}
	fmt.Printf("%sMin:    %8.1f ms\n", prefix, data[0])
	fmt.Printf("%sP25:    %8.1f ms\n", prefix, percentile(data, 25))
	fmt.Printf("%sP50:    %8.1f ms\n", prefix, percentile(data, 50))
	fmt.Printf("%sP75:    %8.1f ms\n", prefix, percentile(data, 75))
	fmt.Printf("%sP95:    %8.1f ms\n", prefix, percentile(data, 95))
	fmt.Printf("%sP99:    %8.1f ms\n", prefix, percentile(data, 99))
	fmt.Printf("%sMax:    %8.1f ms\n", prefix, data[len(data)-1])
	fmt.Printf("%sMean:   %8.1f ms\n", prefix, mean(data))
	fmt.Printf("%sStdDev: %8.1f ms\n", prefix, stddev(data))
}

func printHistogram(prefix string, data []float64, buckets int) {
	if len(data) == 0 {
		return
	}
	min, max := data[0], data[len(data)-1]
	if min == max {
		max = min + 1
	}
	step := (max - min) / float64(buckets)

	fmt.Println()
	counts := make([]int, buckets)
	maxCount := 0
	for _, v := range data {
		idx := int((v - min) / step)
		if idx >= buckets {
			idx = buckets - 1
		}
		counts[idx]++
		if counts[idx] > maxCount {
			maxCount = counts[idx]
		}
	}

	barWidth := 40
	for i, c := range counts {
		lo := min + float64(i)*step
		hi := lo + step
		bar := ""
		if maxCount > 0 {
			width := int(float64(c) / float64(maxCount) * float64(barWidth))
			for j := 0; j < width; j++ {
				bar += "█"
			}
		}
		fmt.Printf("%s%6.0f-%6.0f │ %-*s %d\n", prefix, lo, hi, barWidth, bar, c)
	}
}

func percentile(sorted []float64, p float64) float64 {
	if len(sorted) == 0 {
		return 0
	}
	idx := (p / 100) * float64(len(sorted)-1)
	lower := int(idx)
	upper := lower + 1
	if upper >= len(sorted) {
		return sorted[len(sorted)-1]
	}
	frac := idx - float64(lower)
	return sorted[lower]*(1-frac) + sorted[upper]*frac
}

func mean(data []float64) float64 {
	sum := 0.0
	for _, v := range data {
		sum += v
	}
	return sum / float64(len(data))
}

func stddev(data []float64) float64 {
	m := mean(data)
	sum := 0.0
	for _, v := range data {
		sum += (v - m) * (v - m)
	}
	return math.Sqrt(sum / float64(len(data)))
}

func writeCSV(results []result, cfg config) {
	f, err := os.Create("saga_results.csv")
	if err != nil {
		fmt.Printf("WARN: could not write CSV: %v\n", err)
		return
	}
	defer f.Close()

	fmt.Fprintln(f, "user_index,delete_latency_ms,consistency_window_ms,error")
	for i, r := range results {
		errStr := ""
		if r.err != nil {
			errStr = r.err.Error()
		}
		fmt.Fprintf(f, "%d,%.1f,%.1f,%s\n",
			i,
			float64(r.deleteLatency.Milliseconds()),
			float64(r.consistencyWindow.Milliseconds()),
			errStr,
		)
	}
	fmt.Println("\nCSV written to saga_results.csv")
}
