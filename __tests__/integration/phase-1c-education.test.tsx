/**
 * Phase 1C — Per-Item Education Panels Integration Tests
 *
 * Tests the three expandable education panels per grocery item:
 *  - ℹ️ Item Info  (info-button-{itemId} → item-info-panel)
 *  - 🔄 Alternatives (alternatives-button-{itemId} → alternatives-panel)
 *  - 💡 Inspire    (inspire-button-{itemId} → inspire-panel, flat view only)
 *
 * data-testid contract expected by these tests:
 *   Buttons:  info-button-{id}, alternatives-button-{id}, inspire-button-{id}
 *   Panels:   education-panel-loading, item-info-panel, alternatives-panel, inspire-panel
 *   Fields:   item-info-taste-profile, item-info-common-uses, item-info-how-to-pick,
 *             item-info-storage-tips, item-info-fun-fact
 *   Alts:     alternative-item, match-level-badge (+ data-level), use-this-button
 *   Inspire:  inspire-recipe, recipe-missing-ingredient, add-all-button
 *
 * Timer strategy: no vi.useFakeTimers() — conflicts with React 19 + act().
 * Tests in red state fail fast because the buttons have no testId yet.
 * During implementation, screen.findByTestId() waits for the real delay (≤ 2 s).
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import App from "../../src/App";

// ─── helpers ──────────────────────────────────────────────────────────────────

function setup() {
  const user = userEvent.setup();
  const utils = render(<App />);
  return { user, ...utils };
}

/**
 * Tap Suggest, skip Quick Questions, and wait for Smart View to appear.
 * Required before testing smart/aisles view panel visibility.
 */
async function runSuggest(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId("suggest-button"));
  await user.click(screen.getByTestId("skip-suggest-button"));
  await screen.findByTestId("smart-view", {}, { timeout: 3000 });
}

/** Click the ℹ️ button for an item and wait for the info panel. */
async function openInfoPanel(
  user: ReturnType<typeof userEvent.setup>,
  itemId: string
) {
  await user.click(screen.getByTestId(`info-button-${itemId}`));
  return screen.findByTestId("item-info-panel", {}, { timeout: 2000 });
}

/** Click the 🔄 button for an item and wait for the alternatives panel. */
async function openAlternativesPanel(
  user: ReturnType<typeof userEvent.setup>,
  itemId: string
) {
  await user.click(screen.getByTestId(`alternatives-button-${itemId}`));
  return screen.findByTestId("alternatives-panel", {}, { timeout: 2000 });
}

/** Click the 💡 button for an item and wait for the inspire panel. */
async function openInspirePanel(
  user: ReturnType<typeof userEvent.setup>,
  itemId: string
) {
  await user.click(screen.getByTestId(`inspire-button-${itemId}`));
  return screen.findByTestId("inspire-panel", {}, { timeout: 2000 });
}

// ─── US-1C.1 — Item Info panel ───────────────────────────────────────────────

describe("US-1C.1 — Item Info panel on Pork Belly (i2)", () => {
  it("should show item-info-panel when info button is tapped", async () => {
    const { user } = setup();
    const panel = await openInfoPanel(user, "i2");
    expect(panel).toBeInTheDocument();
  });

  it("should display taste profile text in the info panel", async () => {
    const { user } = setup();
    await openInfoPanel(user, "i2");
    expect(screen.getByTestId("item-info-taste-profile")).toBeInTheDocument();
  });

  it("should display common uses text in the info panel", async () => {
    const { user } = setup();
    await openInfoPanel(user, "i2");
    expect(screen.getByTestId("item-info-common-uses")).toBeInTheDocument();
  });

  it("should display how-to-pick text in the info panel", async () => {
    const { user } = setup();
    await openInfoPanel(user, "i2");
    expect(screen.getByTestId("item-info-how-to-pick")).toBeInTheDocument();
  });

  it("should display storage tips text in the info panel", async () => {
    const { user } = setup();
    await openInfoPanel(user, "i2");
    expect(screen.getByTestId("item-info-storage-tips")).toBeInTheDocument();
  });

  it("should display a fun fact in the info panel", async () => {
    const { user } = setup();
    await openInfoPanel(user, "i2");
    expect(screen.getByTestId("item-info-fun-fact")).toBeInTheDocument();
  });
});

// ─── US-1C.2 — Alternatives panel ────────────────────────────────────────────

describe("US-1C.2 — Alternatives panel on Pork Belly (i2)", () => {
  it("should show alternatives-panel when alternatives button is tapped", async () => {
    const { user } = setup();
    const panel = await openAlternativesPanel(user, "i2");
    expect(panel).toBeInTheDocument();
  });

  it("should render 3 alternative items in the alternatives panel", async () => {
    const { user } = setup();
    await openAlternativesPanel(user, "i2");
    const items = screen.getAllByTestId("alternative-item");
    expect(items).toHaveLength(3);
  });

  it("should render a match-level-badge on each alternative item", async () => {
    const { user } = setup();
    await openAlternativesPanel(user, "i2");
    const badges = screen.getAllByTestId("match-level-badge");
    expect(badges.length).toBeGreaterThanOrEqual(3);
  });

  it("should set data-level attribute correctly on the 'Very close' badge", async () => {
    const { user } = setup();
    await openAlternativesPanel(user, "i2");
    const badges = screen.getAllByTestId("match-level-badge");
    const veryCloseBadge = badges.find(
      (b) => b.getAttribute("data-level") === "Very close"
    );
    expect(veryCloseBadge).toBeInTheDocument();
  });
});

// ─── US-1C.3 — Use This replaces item ────────────────────────────────────────

describe("US-1C.3 — Use This button replaces the original item", () => {
  it("should remove the original item name from the list after Use This is clicked", async () => {
    const { user } = setup();
    await openAlternativesPanel(user, "i2");

    // Get the original item name text before replacing
    const originalName = screen.getByTestId("item-name-en-i2")?.textContent ?? "Pork Belly";

    const useThisButtons = screen.getAllByTestId("use-this-button");
    await user.click(useThisButtons[0]);

    // Original name should no longer appear under the same item node
    expect(screen.queryByTestId("item-name-en-i2")).not.toHaveTextContent(
      originalName
    );
  });

  it("should show the alternative name in the list after Use This is clicked", async () => {
    const { user } = setup();
    await openAlternativesPanel(user, "i2");

    // Capture the first alternative name before clicking
    const firstAlternative = screen.getAllByTestId("alternative-item")[0];
    const alternativeName =
      within(firstAlternative).getByTestId("alternative-name").textContent ?? "";

    const useThisButtons = screen.getAllByTestId("use-this-button");
    await user.click(useThisButtons[0]);

    // Alternative name should now appear in the flat list
    expect(screen.getByText(alternativeName)).toBeInTheDocument();
  });
});

// ─── US-1C.4 — Inspire panel ─────────────────────────────────────────────────

describe("US-1C.4 — Inspire panel on Kimchi (i3)", () => {
  it("should show inspire-panel when inspire button is tapped", async () => {
    const { user } = setup();
    const panel = await openInspirePanel(user, "i3");
    expect(panel).toBeInTheDocument();
  });

  it("should render 3 recipe cards in the inspire panel", async () => {
    const { user } = setup();
    await openInspirePanel(user, "i3");
    const recipes = screen.getAllByTestId("inspire-recipe");
    expect(recipes).toHaveLength(3);
  });

  it("should list missing ingredients inside each recipe card", async () => {
    const { user } = setup();
    await openInspirePanel(user, "i3");
    const missingIngredients = screen.getAllByTestId("recipe-missing-ingredient");
    expect(missingIngredients.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── US-1C.5 — Add All adds missing ingredients ───────────────────────────────

describe("US-1C.5 — Add All adds missing ingredients to the section", () => {
  it("should increase the item count in the section after Add All is clicked", async () => {
    const { user } = setup();
    await openInspirePanel(user, "i3");

    // Count current flat-list items before add
    const before = screen.getAllByRole("checkbox").length;

    await user.click(screen.getByTestId("add-all-button"));

    const after = screen.getAllByRole("checkbox").length;
    expect(after).toBeGreaterThan(before);
  });

  it("should show the newly added missing ingredients as items in flat view", async () => {
    const { user } = setup();
    await openInspirePanel(user, "i3");

    // Capture the first missing ingredient name
    const missingItems = screen.getAllByTestId("recipe-missing-ingredient");
    const firstMissingName = missingItems[0].textContent ?? "";

    await user.click(screen.getByTestId("add-all-button"));

    // At least one of the missing ingredient names should now appear in the list
    expect(screen.getAllByText(firstMissingName).length).toBeGreaterThanOrEqual(1);
  });
});

// ─── US-1C.6 — Loading spinner + caching ─────────────────────────────────────

describe("US-1C.6 — Loading spinner shown on first open, skipped on re-open", () => {
  it("should show education-panel-loading immediately on first tap", async () => {
    const { user } = setup();
    // Click without awaiting the panel so we catch the loading state
    await user.click(screen.getByTestId("info-button-i2"));
    expect(screen.getByTestId("education-panel-loading")).toBeInTheDocument();
  });

  it("should show the info panel after the loading delay resolves", async () => {
    const { user } = setup();
    const panel = await openInfoPanel(user, "i2");
    expect(panel).toBeInTheDocument();
  });

  it("should hide the panel when the same button is tapped again (toggle off)", async () => {
    const { user } = setup();
    // Open panel
    await openInfoPanel(user, "i2");
    expect(screen.getByTestId("item-info-panel")).toBeInTheDocument();

    // Close panel (second tap)
    await user.click(screen.getByTestId("info-button-i2"));
    expect(screen.queryByTestId("item-info-panel")).not.toBeInTheDocument();
  });

  it("should NOT show loading spinner when re-opening a cached panel", async () => {
    const { user } = setup();

    // First open: waits through the real delay
    await openInfoPanel(user, "i2");

    // Close
    await user.click(screen.getByTestId("info-button-i2"));

    // Re-open: loading spinner should not appear (cached)
    await user.click(screen.getByTestId("info-button-i2"));
    expect(screen.queryByTestId("education-panel-loading")).not.toBeInTheDocument();
    expect(screen.getByTestId("item-info-panel")).toBeInTheDocument();
  });
});

// ─── US-1C.7 — Only one panel open per item at a time ────────────────────────

describe("US-1C.7 — Only one panel open per item at a time", () => {
  it("should close Item Info panel when Alternatives button is tapped on the same item", async () => {
    const { user } = setup();

    // Open Info panel first
    await openInfoPanel(user, "i2");
    expect(screen.getByTestId("item-info-panel")).toBeInTheDocument();

    // Open Alternatives panel — Info panel should close
    await openAlternativesPanel(user, "i2");
    expect(screen.queryByTestId("item-info-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("alternatives-panel")).toBeInTheDocument();
  });

  it("should close Alternatives panel when Info button is tapped on the same item", async () => {
    const { user } = setup();

    // Open Alternatives panel first
    await openAlternativesPanel(user, "i2");
    expect(screen.getByTestId("alternatives-panel")).toBeInTheDocument();

    // Open Info panel — Alternatives panel should close
    await openInfoPanel(user, "i2");
    expect(screen.queryByTestId("alternatives-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("item-info-panel")).toBeInTheDocument();
  });
});

// ─── US-1C.8 — Panels work in all views ──────────────────────────────────────

describe("US-1C.8 — Education buttons present in smart and aisles views", () => {
  it("should render info button for items in smart-view", async () => {
    const { user } = setup();
    await runSuggest(user);
    // In smart view, at least one info button should be present
    const infoButtons = screen.getAllByTestId(/^info-button-/);
    expect(infoButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("should render alternatives button for items in smart-view", async () => {
    const { user } = setup();
    await runSuggest(user);
    const altButtons = screen.getAllByTestId(/^alternatives-button-/);
    expect(altButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("should render info button for items in aisles-view", async () => {
    const { user } = setup();
    await runSuggest(user);
    await user.click(screen.getByTestId("view-tab-aisles"));
    const infoButtons = screen.getAllByTestId(/^info-button-/);
    expect(infoButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("should render alternatives button for items in aisles-view", async () => {
    const { user } = setup();
    await runSuggest(user);
    await user.click(screen.getByTestId("view-tab-aisles"));
    const altButtons = screen.getAllByTestId(/^alternatives-button-/);
    expect(altButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("should NOT render inspire button in smart-view (flat view only)", async () => {
    const { user } = setup();
    await runSuggest(user);
    // Inspire buttons should be absent in smart view
    expect(screen.queryAllByTestId(/^inspire-button-/)).toHaveLength(0);
  });

  it("should NOT render inspire button in aisles-view (flat view only)", async () => {
    const { user } = setup();
    await runSuggest(user);
    await user.click(screen.getByTestId("view-tab-aisles"));
    expect(screen.queryAllByTestId(/^inspire-button-/)).toHaveLength(0);
  });
});
