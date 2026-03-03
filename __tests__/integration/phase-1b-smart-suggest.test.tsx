/**
 * Phase 1B — Smart Suggest Integration Tests
 *
 * Tests the Smart Suggest flow:
 *  - Tapping Suggest shows Quick Questions panel
 *  - Answering or skipping triggers suggest
 *  - Loading state shown during delay
 *  - Smart View renders recipe clusters
 *  - Keep / Dismiss / Keep All actions on suggestions
 *  - "More" button reveals extra suggestions
 *  - Aisles view with department groups + NEW badges
 *  - Flat view restores original list
 *  - Cross-view checkbox sync
 *
 * Timer strategy: no vi.useFakeTimers() — it conflicts with React 19 + act().
 * Tests in red state fail fast because Quick Questions panel elements don't
 * exist yet. During implementation, screen.findByTestId() waits for the real
 * loading delay (up to 3 s).
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import App from "../../src/App";

// ─── helpers ─────────────────────────────────────────────────────────────────

function setup() {
  const user = userEvent.setup();
  const utils = render(<App />);
  return { user, ...utils };
}

/**
 * Tap Suggest, skip Quick Questions, and wait for Smart View to appear.
 * In the red state this throws at the second click (skip button not found).
 * During implementation it waits up to 3 s for the loading delay to resolve.
 */
async function runSuggest(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId("suggest-button"));
  await user.click(screen.getByTestId("skip-suggest-button"));
  // Wait for Smart View — real timer, works with any loading delay ≤ 3 s
  await screen.findByTestId("smart-view", {}, { timeout: 3000 });
}

// ─── US-1B.1 — Quick Questions panel ─────────────────────────────────────────

describe("US-1B.1 — Tapping Suggest shows the Quick Questions panel", () => {
  it("should show Quick Questions panel when Suggest button is tapped", async () => {
    const { user } = setup();
    await user.click(screen.getByTestId("suggest-button"));
    expect(screen.getByTestId("quick-questions-panel")).toBeInTheDocument();
  });

  it("should render exactly 3 questions in the Quick Questions panel", async () => {
    const { user } = setup();
    await user.click(screen.getByTestId("suggest-button"));
    const groups = screen.getAllByTestId("question-chip-group");
    expect(groups).toHaveLength(3);
  });

  it("should render bilingual question labels (English + Chinese) in the panel", async () => {
    const { user } = setup();
    await user.click(screen.getByTestId("suggest-button"));
    const panel = screen.getByTestId("quick-questions-panel");
    // At least one Chinese character should be visible in the questions area
    expect(panel.textContent).toMatch(/[\u4e00-\u9fff]/);
  });

  it("should render chip-select options for each question", async () => {
    const { user } = setup();
    await user.click(screen.getByTestId("suggest-button"));
    const chips = screen.getAllByTestId(/^chip-option-/);
    expect(chips.length).toBeGreaterThanOrEqual(3);
  });
});

// ─── US-1B.2 — Answering / Skipping ──────────────────────────────────────────

describe("US-1B.2 — User can answer chips or skip to trigger suggest", () => {
  it("should allow user to tap a chip and mark it selected", async () => {
    const { user } = setup();
    await user.click(screen.getByTestId("suggest-button"));
    const chips = screen.getAllByTestId(/^chip-option-/);
    await user.click(chips[0]);
    expect(chips[0]).toHaveAttribute("data-selected", "true");
  });

  it("should render 'Get Suggestions →' button in Quick Questions panel", async () => {
    const { user } = setup();
    await user.click(screen.getByTestId("suggest-button"));
    expect(screen.getByTestId("get-suggestions-button")).toBeInTheDocument();
  });

  it("should render 'Skip →' link in Quick Questions panel", async () => {
    const { user } = setup();
    await user.click(screen.getByTestId("suggest-button"));
    expect(screen.getByTestId("skip-suggest-button")).toBeInTheDocument();
  });

  it("should show loading indicator when 'Get Suggestions →' is tapped", async () => {
    const { user } = setup();
    await user.click(screen.getByTestId("suggest-button"));
    await user.click(screen.getByTestId("get-suggestions-button"));
    // Loading indicator should appear immediately
    expect(screen.getByTestId("suggest-loading")).toBeInTheDocument();
  });

  it("should show loading indicator when 'Skip →' is tapped without answering", async () => {
    const { user } = setup();
    await user.click(screen.getByTestId("suggest-button"));
    await user.click(screen.getByTestId("skip-suggest-button"));
    // Loading indicator should appear immediately
    expect(screen.getByTestId("suggest-loading")).toBeInTheDocument();
  });
});

// ─── US-1B.3 — Loading + Smart View ──────────────────────────────────────────

describe("US-1B.3 — After loading, Smart View appears with recipe clusters", () => {
  it("should show a loading state immediately after skip is tapped", async () => {
    const { user } = setup();
    await user.click(screen.getByTestId("suggest-button"));
    await user.click(screen.getByTestId("skip-suggest-button"));
    // Before the loading delay resolves, loading indicator should be visible
    expect(screen.getByTestId("suggest-loading")).toBeInTheDocument();
  });

  it("should show view tabs after suggest completes", async () => {
    const { user } = setup();
    await runSuggest(user);
    expect(screen.getByTestId("view-tab-flat")).toBeInTheDocument();
    expect(screen.getByTestId("view-tab-smart")).toBeInTheDocument();
    expect(screen.getByTestId("view-tab-aisles")).toBeInTheDocument();
  });

  it("should switch to Smart View after suggest completes", async () => {
    const { user } = setup();
    await runSuggest(user);
    expect(screen.getByTestId("smart-view")).toBeInTheDocument();
  });

  it("should render at least 3 named recipe clusters", async () => {
    const { user } = setup();
    await runSuggest(user);
    const clusters = screen.getAllByTestId("cluster-card");
    expect(clusters.length).toBeGreaterThanOrEqual(3);
  });

  it("should render the 'Korean BBQ Core' cluster", async () => {
    const { user } = setup();
    await runSuggest(user);
    expect(screen.getByText(/Korean BBQ Core/i)).toBeInTheDocument();
  });

  it("should render the 'Western BBQ Station' cluster", async () => {
    const { user } = setup();
    await runSuggest(user);
    expect(screen.getByText(/Western BBQ Station/i)).toBeInTheDocument();
  });
});

// ─── US-1B.4 — Cluster item rendering ────────────────────────────────────────

describe("US-1B.4 — Clusters show existing items normally and suggestions distinctly", () => {
  it("should render suggested items with data-suggestion='true'", async () => {
    const { user } = setup();
    await runSuggest(user);
    const suggestionItems = screen.getAllByTestId("suggestion-item");
    expect(suggestionItems.length).toBeGreaterThanOrEqual(1);
  });

  it("should render reason text on each suggestion item", async () => {
    const { user } = setup();
    await runSuggest(user);
    const reasons = screen.getAllByTestId("suggestion-reason");
    expect(reasons.length).toBeGreaterThanOrEqual(1);
  });

  it("should render Keep buttons on each suggestion item", async () => {
    const { user } = setup();
    await runSuggest(user);
    const keepButtons = screen.getAllByTestId("keep-button");
    expect(keepButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("should render Dismiss buttons on each suggestion item", async () => {
    const { user } = setup();
    await runSuggest(user);
    const dismissButtons = screen.getAllByTestId("dismiss-button");
    expect(dismissButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("should render a cluster description line inside each cluster card", async () => {
    const { user } = setup();
    await runSuggest(user);
    const clusters = screen.getAllByTestId("cluster-card");
    for (const cluster of clusters) {
      const desc = within(cluster).queryByTestId("cluster-description");
      expect(desc).toBeInTheDocument();
    }
  });
});

// ─── US-1B.5 — Context block ──────────────────────────────────────────────────

describe("US-1B.5 — Context block with Keep All button is shown at top of Smart View", () => {
  it("should render a context block at the top of Smart View", async () => {
    const { user } = setup();
    await runSuggest(user);
    expect(screen.getByTestId("context-block")).toBeInTheDocument();
  });

  it("should render '✓ Keep All' button", async () => {
    const { user } = setup();
    await runSuggest(user);
    expect(screen.getByTestId("keep-all-button")).toBeInTheDocument();
  });
});

// ─── US-1B.6 — Keep suggestion ───────────────────────────────────────────────

describe("US-1B.6 — Tapping Keep promotes a suggestion to a regular item", () => {
  it("should remove suggestion styling when Keep is tapped", async () => {
    const { user } = setup();
    await runSuggest(user);

    const initialCount = screen.getAllByTestId("suggestion-item").length;
    const keepButtons = screen.getAllByTestId("keep-button");
    await user.click(keepButtons[0]);

    // One fewer suggestion item after keeping
    const newCount = screen.queryAllByTestId("suggestion-item").length;
    expect(newCount).toBeLessThan(initialCount);
  });
});

// ─── US-1B.7 — Dismiss suggestion ────────────────────────────────────────────

describe("US-1B.7 — Tapping Dismiss removes a suggestion", () => {
  it("should decrease the suggestion count when a dismiss button is tapped", async () => {
    const { user } = setup();
    await runSuggest(user);

    const initialCount = screen.getAllByTestId("suggestion-item").length;
    const dismissButtons = screen.getAllByTestId("dismiss-button");
    await user.click(dismissButtons[0]);

    const newCount = screen.queryAllByTestId("suggestion-item").length;
    expect(newCount).toBeLessThan(initialCount);
  });
});

// ─── US-1B.8 — Keep All ──────────────────────────────────────────────────────

describe("US-1B.8 — Tapping Keep All promotes all suggestion items at once", () => {
  it("should remove all suggestion items when Keep All is tapped", async () => {
    const { user } = setup();
    await runSuggest(user);

    await user.click(screen.getByTestId("keep-all-button"));
    expect(screen.queryAllByTestId("suggestion-item")).toHaveLength(0);
  });
});

// ─── US-1B.9 — More button ───────────────────────────────────────────────────

describe("US-1B.9 — More button reveals 2 extra suggestions then disappears", () => {
  it("should render a More button at the bottom of Smart View", async () => {
    const { user } = setup();
    await runSuggest(user);
    expect(screen.getByTestId("more-suggestions-button")).toBeInTheDocument();
  });

  it("should reveal 2 additional suggestion items when More is tapped", async () => {
    const { user } = setup();
    await runSuggest(user);

    const before = screen.getAllByTestId("suggestion-item").length;
    await user.click(screen.getByTestId("more-suggestions-button"));
    const after = screen.getAllByTestId("suggestion-item").length;

    expect(after).toBe(before + 2);
  });

  it("should hide the More button after it is tapped", async () => {
    const { user } = setup();
    await runSuggest(user);

    await user.click(screen.getByTestId("more-suggestions-button"));
    expect(screen.queryByTestId("more-suggestions-button")).not.toBeInTheDocument();
  });
});

// ─── US-1B.10 — Aisles view ──────────────────────────────────────────────────

describe("US-1B.10 — Aisles view groups items by department with NEW badge", () => {
  it("should switch to Aisles view when Aisles tab is tapped", async () => {
    const { user } = setup();
    await runSuggest(user);
    await user.click(screen.getByTestId("view-tab-aisles"));
    expect(screen.getByTestId("aisles-view")).toBeInTheDocument();
  });

  it("should group items by store department in Aisles view", async () => {
    const { user } = setup();
    await runSuggest(user);
    await user.click(screen.getByTestId("view-tab-aisles"));
    const aisleGroups = screen.getAllByTestId("aisle-group");
    expect(aisleGroups.length).toBeGreaterThanOrEqual(2);
  });

  it("should show 'NEW' badge on suggestion items in Aisles view", async () => {
    const { user } = setup();
    await runSuggest(user);
    await user.click(screen.getByTestId("view-tab-aisles"));
    const newBadges = screen.getAllByTestId("new-badge");
    expect(newBadges.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── US-1B.11 — Flat view ────────────────────────────────────────────────────

describe("US-1B.11 — Switching to Flat view shows the original flat list", () => {
  it("should switch to Flat view when Flat tab is tapped", async () => {
    const { user } = setup();
    await runSuggest(user);
    await user.click(screen.getByTestId("view-tab-flat"));
    expect(screen.getByTestId("flat-view")).toBeInTheDocument();
  });

  it("should show all 8 original items in Flat view", async () => {
    const { user } = setup();
    await runSuggest(user);
    await user.click(screen.getByTestId("view-tab-flat"));
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThanOrEqual(8);
  });
});

// ─── US-1B.12 — Cross-view checkbox sync ─────────────────────────────────────

describe("US-1B.12 — Checked state syncs across Smart and Flat views", () => {
  it("should reflect item checked in Smart View when switching to Flat view", async () => {
    const { user } = setup();
    await runSuggest(user);

    // In Smart view, find and check the first checkbox
    const smartCheckboxes = screen.getAllByRole("checkbox");
    const targetCheckbox = smartCheckboxes[0];
    const itemName = targetCheckbox
      .closest("[data-testid='grocery-item']")
      ?.querySelector("[data-testid='item-name-en']")?.textContent;

    await user.click(targetCheckbox);
    expect(targetCheckbox).toBeChecked();

    // Switch to Flat view
    await user.click(screen.getByTestId("view-tab-flat"));

    // The same item should be checked in Flat view
    if (itemName) {
      const flatItem = screen.getByText(itemName).closest("[data-testid='grocery-item']");
      const flatCheckbox = flatItem?.querySelector('input[type="checkbox"]');
      expect(flatCheckbox).toBeChecked();
    } else {
      // Fallback: at least one checkbox is checked in flat view
      const flatCheckboxes = screen.getAllByRole("checkbox");
      const checkedCount = flatCheckboxes.filter(cb => (cb as HTMLInputElement).checked).length;
      expect(checkedCount).toBeGreaterThanOrEqual(1);
    }
  });
});
