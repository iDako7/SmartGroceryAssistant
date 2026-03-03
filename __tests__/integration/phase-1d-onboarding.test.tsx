/**
 * Phase 1D — Onboarding Integration Tests
 *
 * Tests the first-run onboarding screen that gates access to the grocery list:
 *  - US-1D.1: Full-screen onboarding shown on first load
 *  - US-1D.2: Create saves profile and shows main list
 *  - US-1D.3: Skip proceeds to list with no profile saved
 *  - US-1D.4: English-only profile hides secondary language text
 *  - US-1D.5: Gear icon opens editable profile screen
 *
 * IMPORTANT: This file does NOT call skipOnboarding — tests must see the
 * onboarding screen to verify it renders correctly.
 *
 * data-testid contract:
 *   onboarding-screen       — root of full-screen onboarding; absent after Skip/Create
 *   onboarding-title        — "Welcome to Smart Grocery" heading
 *   language-option-en      — English only; data-selected="true" when active
 *   language-option-en_zh   — English + 简体中文; data-selected="true" when active
 *   language-option-en_fr   — English + Français; data-selected="true" when active
 *   dietary-chip-{slug}     — each dietary chip; data-selected="true/false"
 *   household-size-{1|2|3|4} — household size option; data-selected="true" when active
 *   taste-prefs-input       — free-text taste preferences input
 *   onboarding-create-button — shared between onboarding and profile editor
 *   onboarding-skip-button  — first-load only; absent in profile editor
 *   onboarding-nudge        — must be ABSENT after Skip
 *   profile-gear-button     — only rendered when profile exists (after Create)
 *   profile-editor-screen   — distinct from onboarding-screen; shown when gear tapped
 *   item-name-secondary     — already established in 1A; hidden when language="en"
 *   section-card            — already established in 1A; confirms main list visible
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import App from "../../src/App";

// ─── helpers ──────────────────────────────────────────────────────────────────

function setup() {
  const user = userEvent.setup();
  const utils = render(<App />);
  // NOTE: No skipOnboarding here — 1D tests must see the onboarding screen
  return { user, ...utils };
}

/**
 * Complete the onboarding form and tap Create.
 * Defaults to en_zh language, no dietary restrictions, household size 2.
 */
async function completeOnboarding(
  user: ReturnType<typeof userEvent.setup>,
  opts: {
    language?: string;
    dietary?: string[];
    householdSize?: number;
    tastePrefs?: string;
  } = {}
) {
  const {
    language = "en_zh",
    dietary = [],
    householdSize = 2,
    tastePrefs = "",
  } = opts;

  await user.click(screen.getByTestId(`language-option-${language}`));

  for (const slug of dietary) {
    await user.click(screen.getByTestId(`dietary-chip-${slug}`));
  }

  await user.click(screen.getByTestId(`household-size-${householdSize}`));

  if (tastePrefs) {
    await user.type(screen.getByTestId("taste-prefs-input"), tastePrefs);
  }

  await user.click(screen.getByTestId("onboarding-create-button"));
}

// ─── US-1D.1 — Full-screen onboarding on first load ──────────────────────────

describe("US-1D.1 — Full-screen onboarding shown on first load", () => {
  it("should render the onboarding screen on first load", () => {
    setup();
    expect(screen.getByTestId("onboarding-screen")).toBeInTheDocument();
  });

  it("should NOT render the grocery list before onboarding is completed", () => {
    setup();
    expect(screen.queryByTestId("section-card")).not.toBeInTheDocument();
  });

  it("should render the onboarding title 'Welcome to Smart Grocery'", () => {
    setup();
    expect(screen.getByTestId("onboarding-title")).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-title").textContent).toMatch(
      /Welcome to Smart Grocery/i
    );
  });

  it("should render all 3 language options", () => {
    setup();
    expect(screen.getByTestId("language-option-en")).toBeInTheDocument();
    expect(screen.getByTestId("language-option-en_zh")).toBeInTheDocument();
    expect(screen.getByTestId("language-option-en_fr")).toBeInTheDocument();
  });

  it("should label the en_zh option with Chinese characters (简体中文)", () => {
    setup();
    const enZhOption = screen.getByTestId("language-option-en_zh");
    expect(enZhOption.textContent).toMatch(/简体中文/);
  });

  it("should label the en_fr option with 'Français'", () => {
    setup();
    const enFrOption = screen.getByTestId("language-option-en_fr");
    expect(enFrOption.textContent).toMatch(/Français/i);
  });

  it("should render at least one dietary chip with a data-selected attribute", () => {
    setup();
    const chips = document.querySelectorAll("[data-testid^='dietary-chip-']");
    expect(chips.length).toBeGreaterThanOrEqual(1);
    // Each chip must expose data-selected
    for (const chip of chips) {
      expect(chip).toHaveAttribute("data-selected");
    }
  });

  it("should allow multiple dietary chips to be selected independently", async () => {
    const { user } = setup();
    const chips = document.querySelectorAll("[data-testid^='dietary-chip-']");
    expect(chips.length).toBeGreaterThanOrEqual(2);

    const [chipA, chipB] = chips as unknown as HTMLElement[];
    await user.click(chipA);
    await user.click(chipB);

    expect(chipA).toHaveAttribute("data-selected", "true");
    expect(chipB).toHaveAttribute("data-selected", "true");
  });

  it("should toggle a dietary chip off when tapped a second time", async () => {
    const { user } = setup();
    const chip = document.querySelector("[data-testid^='dietary-chip-']") as HTMLElement;
    expect(chip).not.toBeNull();

    await user.click(chip);
    expect(chip).toHaveAttribute("data-selected", "true");

    await user.click(chip);
    expect(chip).toHaveAttribute("data-selected", "false");
  });

  it("should render household size options 1, 2, 3, and 4+", () => {
    setup();
    expect(screen.getByTestId("household-size-1")).toBeInTheDocument();
    expect(screen.getByTestId("household-size-2")).toBeInTheDocument();
    expect(screen.getByTestId("household-size-3")).toBeInTheDocument();
    expect(screen.getByTestId("household-size-4")).toBeInTheDocument();
  });

  it("should render the taste preferences input", () => {
    setup();
    expect(screen.getByTestId("taste-prefs-input")).toBeInTheDocument();
  });

  it("should render both Create and Skip buttons", () => {
    setup();
    expect(screen.getByTestId("onboarding-create-button")).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-skip-button")).toBeInTheDocument();
  });
});

// ─── US-1D.2 — Create saves profile and shows list ───────────────────────────

describe("US-1D.2 — Create saves profile and shows the grocery list", () => {
  it("should remove the onboarding screen after Create is tapped", async () => {
    const { user } = setup();
    await completeOnboarding(user);
    expect(screen.queryByTestId("onboarding-screen")).not.toBeInTheDocument();
  });

  it("should show the section-card (grocery list) after Create is tapped", async () => {
    const { user } = setup();
    await completeOnboarding(user);
    expect(screen.getByTestId("section-card")).toBeInTheDocument();
  });

  it("should show the app title after Create is tapped", async () => {
    const { user } = setup();
    await completeOnboarding(user);
    expect(screen.getByText(/Smart Grocery/i)).toBeInTheDocument();
  });

  it("should show the profile gear button in the header after Create is tapped", async () => {
    const { user } = setup();
    await completeOnboarding(user);
    expect(screen.getByTestId("profile-gear-button")).toBeInTheDocument();
  });
});

// ─── US-1D.3 — Skip proceeds to list with no profile ─────────────────────────

describe("US-1D.3 — Skip proceeds to the grocery list with no profile saved", () => {
  it("should remove the onboarding screen after Skip is tapped", async () => {
    const { user } = setup();
    await user.click(screen.getByTestId("onboarding-skip-button"));
    expect(screen.queryByTestId("onboarding-screen")).not.toBeInTheDocument();
  });

  it("should show the section-card (grocery list) after Skip is tapped", async () => {
    const { user } = setup();
    await user.click(screen.getByTestId("onboarding-skip-button"));
    expect(screen.getByTestId("section-card")).toBeInTheDocument();
  });

  it("should NOT render the profile gear button after Skip (no profile saved)", async () => {
    const { user } = setup();
    await user.click(screen.getByTestId("onboarding-skip-button"));
    expect(screen.queryByTestId("profile-gear-button")).not.toBeInTheDocument();
  });

  it("should NOT render an onboarding nudge element after Skip", async () => {
    const { user } = setup();
    await user.click(screen.getByTestId("onboarding-skip-button"));
    expect(screen.queryByTestId("onboarding-nudge")).not.toBeInTheDocument();
  });
});

// ─── US-1D.4 — English-only profile hides secondary language text ─────────────

describe("US-1D.4 — English-only profile hides secondary language item names", () => {
  it("should show secondary name spans when language is en_zh", async () => {
    const { user } = setup();
    await completeOnboarding(user, { language: "en_zh" });
    const secondaryNames = document.querySelectorAll(
      "[data-testid='item-name-secondary']"
    );
    expect(secondaryNames.length).toBeGreaterThanOrEqual(8);
  });

  it("should show zero secondary name spans when language is en (English only)", async () => {
    const { user } = setup();
    await completeOnboarding(user, { language: "en" });
    const secondaryNames = document.querySelectorAll(
      "[data-testid='item-name-secondary']"
    );
    expect(secondaryNames.length).toBe(0);
  });

  it("should not show '五花肉' when language is en", async () => {
    const { user } = setup();
    await completeOnboarding(user, { language: "en" });
    expect(screen.queryByText("五花肉")).not.toBeInTheDocument();
  });

  it("should still show English names like 'Pork Belly' and 'Tofu' when language is en", async () => {
    const { user } = setup();
    await completeOnboarding(user, { language: "en" });
    expect(screen.getByText("Pork Belly")).toBeInTheDocument();
    expect(screen.getByText("Tofu")).toBeInTheDocument();
  });

  it("should show no CJK characters in the Quick Questions panel when language is en", async () => {
    const { user } = setup();
    await completeOnboarding(user, { language: "en" });
    await user.click(screen.getByTestId("suggest-button"));
    const panel = screen.getByTestId("quick-questions-panel");
    expect(panel.textContent).not.toMatch(/[\u4e00-\u9fff]/);
  });
});

// ─── US-1D.5 — Gear icon opens editable profile ───────────────────────────────

describe("US-1D.5 — Gear icon opens an editable profile screen", () => {
  it("should render the profile gear button after Create", async () => {
    const { user } = setup();
    await completeOnboarding(user);
    expect(screen.getByTestId("profile-gear-button")).toBeInTheDocument();
  });

  it("should show the profile editor screen when gear button is tapped", async () => {
    const { user } = setup();
    await completeOnboarding(user);
    await user.click(screen.getByTestId("profile-gear-button"));
    expect(screen.getByTestId("profile-editor-screen")).toBeInTheDocument();
  });

  it("should pre-populate the saved language in the profile editor", async () => {
    const { user } = setup();
    await completeOnboarding(user, { language: "en_zh" });
    await user.click(screen.getByTestId("profile-gear-button"));
    expect(screen.getByTestId("language-option-en_zh")).toHaveAttribute(
      "data-selected",
      "true"
    );
  });

  it("should pre-populate the saved household size in the profile editor", async () => {
    const { user } = setup();
    await completeOnboarding(user, { householdSize: 3 });
    await user.click(screen.getByTestId("profile-gear-button"));
    expect(screen.getByTestId("household-size-3")).toHaveAttribute(
      "data-selected",
      "true"
    );
  });

  it("should hide secondary names immediately when language is changed to 'en' in the editor", async () => {
    const { user } = setup();
    // Start with bilingual
    await completeOnboarding(user, { language: "en_zh" });
    expect(
      document.querySelectorAll("[data-testid='item-name-secondary']").length
    ).toBeGreaterThanOrEqual(8);

    // Open editor and switch to English-only
    await user.click(screen.getByTestId("profile-gear-button"));
    await user.click(screen.getByTestId("language-option-en"));
    await user.click(screen.getByTestId("onboarding-create-button"));

    // Secondary names should now be hidden
    expect(
      document.querySelectorAll("[data-testid='item-name-secondary']").length
    ).toBe(0);
  });

  it("should return to the grocery list after saving the profile editor", async () => {
    const { user } = setup();
    await completeOnboarding(user);
    await user.click(screen.getByTestId("profile-gear-button"));
    await user.click(screen.getByTestId("onboarding-create-button"));
    expect(screen.queryByTestId("profile-editor-screen")).not.toBeInTheDocument();
    expect(screen.getByTestId("section-card")).toBeInTheDocument();
  });
});
