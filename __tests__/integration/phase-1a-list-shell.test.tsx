/**
 * Phase 1A — List Shell Integration Tests
 *
 * Tests the core grocery list UI:
 *  - Initial render with BBQ with Mark demo data
 *  - Check/uncheck items
 *  - Quantity editing
 *  - Add item inline
 *  - Add / rename / delete sections
 *  - Delete items
 *  - Collapse / expand sections
 *  - View tabs absent before Suggest
 *  - Mobile touch targets
 */

import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import App from "../../src/App";
import { skipOnboarding } from "./helpers";

// ─── helpers ────────────────────────────────────────────────────────────────

async function setup() {
  const user = userEvent.setup();
  const utils = render(<App />);
  await skipOnboarding(user);
  return { user, ...utils };
}

// ─── US-1A.1 — Initial render ────────────────────────────────────────────────

describe("US-1A.1 — Initial render with BBQ with Mark demo data", () => {
  it("should render the app title 'Smart Grocery'", async () => {
    await setup();
    expect(screen.getByText(/Smart Grocery/i)).toBeInTheDocument();
  });

  it("should render a section named 'BBQ with Mark'", async () => {
    await setup();
    expect(screen.getByText("BBQ with Mark")).toBeInTheDocument();
  });

  it("should render exactly 8 items in the BBQ with Mark section", async () => {
    await setup();
    // Each item row should have a checkbox role
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(8);
  });

  it("should render 'Pork Belly' with Chinese secondary name '五花肉'", async () => {
    await setup();
    expect(screen.getByText("Pork Belly")).toBeInTheDocument();
    expect(screen.getByText("五花肉")).toBeInTheDocument();
  });

  it("should render all 8 bilingual items with English and Chinese names", async () => {
    await setup();

    const expectedItems = [
      { en: "Tofu", zh: "豆腐" },
      { en: "Pork Belly", zh: "五花肉" },
      { en: "Kimchi", zh: "泡菜" },
      { en: "Seaweed", zh: "海苔" },
      { en: "Burger Patties", zh: "汉堡肉饼" },
      { en: "Hot Dog Buns", zh: "热狗面包" },
      { en: "Hot Dogs", zh: "热狗" },
      { en: "Mustard", zh: "芥末酱" },
    ];

    for (const { en, zh } of expectedItems) {
      expect(screen.getByText(en)).toBeInTheDocument();
      expect(screen.getByText(zh)).toBeInTheDocument();
    }
  });

  it("should render Chinese names in smaller/lighter text (secondary style)", async () => {
    await setup();
    // Secondary names should have a distinct class or element (e.g. <span> with 'secondary' in class)
    const secondaryNames = document.querySelectorAll("[data-testid='item-name-secondary']");
    expect(secondaryNames.length).toBeGreaterThanOrEqual(8);
  });
});

// ─── US-1A.2 — Check / uncheck items ────────────────────────────────────────

describe("US-1A.2 — Checkbox toggles strikethrough + muted styling", () => {
  it("should check an item when its checkbox is clicked", async () => {
    const { user } = await setup();
    const checkboxes = screen.getAllByRole("checkbox");
    const firstCheckbox = checkboxes[0];

    expect(firstCheckbox).not.toBeChecked();
    await user.click(firstCheckbox);
    expect(firstCheckbox).toBeChecked();
  });

  it("should apply strikethrough styling to a checked item", async () => {
    const { user } = await setup();
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);

    const itemRow = checkboxes[0].closest("[data-testid='grocery-item']");
    expect(itemRow).toHaveAttribute("data-checked", "true");
  });

  it("should uncheck a previously checked item when checkbox is clicked again", async () => {
    const { user } = await setup();
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();

    await user.click(checkboxes[0]);
    expect(checkboxes[0]).not.toBeChecked();
  });
});

// ─── US-1A.3 — Quantity editing ──────────────────────────────────────────────

describe("US-1A.3 — Quantity badge allows changing quantity (1–9)", () => {
  it("should render a quantity badge showing '1' by default for each item", async () => {
    await setup();
    const qtyBadges = screen.getAllByTestId("item-quantity");
    expect(qtyBadges.length).toBeGreaterThanOrEqual(8);
    for (const badge of qtyBadges) {
      expect(badge).toHaveTextContent("1");
    }
  });

  it("should open a quantity picker when the quantity badge is tapped", async () => {
    const { user } = await setup();
    const firstQty = screen.getAllByTestId("item-quantity")[0];
    await user.click(firstQty);

    // A picker or set of quantity options should appear
    expect(screen.getByTestId("quantity-picker")).toBeInTheDocument();
  });

  it("should update the quantity when a new value is selected", async () => {
    const { user } = await setup();
    const firstQty = screen.getAllByTestId("item-quantity")[0];
    await user.click(firstQty);

    const option3 = screen.getByTestId("qty-option-3");
    await user.click(option3);

    expect(screen.getAllByTestId("item-quantity")[0]).toHaveTextContent("3");
  });

  it("should offer quantity options 1 through 9", async () => {
    const { user } = await setup();
    await user.click(screen.getAllByTestId("item-quantity")[0]);

    for (let i = 1; i <= 9; i++) {
      expect(screen.getByTestId(`qty-option-${i}`)).toBeInTheDocument();
    }
  });
});

// ─── US-1A.4 — Add item inline ───────────────────────────────────────────────

describe("US-1A.4 — '+ Add Item' shows inline input; Enter adds item", () => {
  it("should render a '+ Add Item' button at the bottom of each section", async () => {
    await setup();
    expect(screen.getByTestId("add-item-button")).toBeInTheDocument();
  });

  it("should show an inline text input when '+ Add Item' is tapped", async () => {
    const { user } = await setup();
    await user.click(screen.getByTestId("add-item-button"));
    expect(screen.getByTestId("add-item-input")).toBeInTheDocument();
  });

  it("should add a new item to the section when Enter is pressed", async () => {
    const { user } = await setup();
    await user.click(screen.getByTestId("add-item-button"));

    const input = screen.getByTestId("add-item-input");
    await user.type(input, "Lettuce");
    await user.keyboard("{Enter}");

    expect(screen.getByText("Lettuce")).toBeInTheDocument();
    // 9 items now
    expect(screen.getAllByRole("checkbox")).toHaveLength(9);
  });

  it("should not add an empty item when Enter is pressed with blank input", async () => {
    const { user } = await setup();
    await user.click(screen.getByTestId("add-item-button"));

    const input = screen.getByTestId("add-item-input");
    await user.keyboard("{Enter}");

    // Still 8 items
    expect(screen.getAllByRole("checkbox")).toHaveLength(8);
  });

  it("should dismiss the input when Escape is pressed", async () => {
    const { user } = await setup();
    await user.click(screen.getByTestId("add-item-button"));
    expect(screen.getByTestId("add-item-input")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("add-item-input")).not.toBeInTheDocument();
  });
});

// ─── US-1A.5 — Create new section ───────────────────────────────────────────

describe("US-1A.5 — '+' header button creates a new section with editable name", () => {
  it("should render a '+' button in the app header", async () => {
    await setup();
    expect(screen.getByTestId("add-section-button")).toBeInTheDocument();
  });

  it("should add a new section when the '+' header button is tapped", async () => {
    const { user } = await setup();
    // Initially 1 section
    expect(screen.getAllByTestId("section-card")).toHaveLength(1);

    await user.click(screen.getByTestId("add-section-button"));
    expect(screen.getAllByTestId("section-card")).toHaveLength(2);
  });

  it("should render the new section with an editable name input", async () => {
    const { user } = await setup();
    await user.click(screen.getByTestId("add-section-button"));

    expect(screen.getByTestId("section-name-input")).toBeInTheDocument();
  });

  it("should commit the section name when Enter is pressed", async () => {
    const { user } = await setup();
    await user.click(screen.getByTestId("add-section-button"));

    const nameInput = screen.getByTestId("section-name-input");
    await user.clear(nameInput);
    await user.type(nameInput, "Costco Run");
    await user.keyboard("{Enter}");

    expect(screen.getByText("Costco Run")).toBeInTheDocument();
    expect(screen.queryByTestId("section-name-input")).not.toBeInTheDocument();
  });
});

// ─── US-1A.6 — Rename and delete section ────────────────────────────────────

describe("US-1A.6 — Rename and delete section", () => {
  it("should enter edit mode when section name is tapped", async () => {
    const { user } = await setup();
    const sectionName = screen.getByText("BBQ with Mark");
    await user.click(sectionName);

    expect(screen.getByTestId("section-name-input")).toBeInTheDocument();
  });

  it("should save the renamed section when Enter is pressed", async () => {
    const { user } = await setup();
    await user.click(screen.getByText("BBQ with Mark"));

    const input = screen.getByTestId("section-name-input");
    await user.clear(input);
    await user.type(input, "Fusion BBQ");
    await user.keyboard("{Enter}");

    expect(screen.getByText("Fusion BBQ")).toBeInTheDocument();
    expect(screen.queryByText("BBQ with Mark")).not.toBeInTheDocument();
  });

  it("should render a delete button for a section", async () => {
    await setup();
    expect(screen.getByTestId("delete-section-button")).toBeInTheDocument();
  });

  it("should remove the section when delete is confirmed", async () => {
    const { user } = await setup();
    await user.click(screen.getByTestId("delete-section-button"));

    // Section and all its items gone
    expect(screen.queryByText("BBQ with Mark")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });
});

// ─── US-1A.7 — Delete individual items ──────────────────────────────────────

describe("US-1A.7 — Delete individual grocery items", () => {
  it("should render a delete button for each item", async () => {
    await setup();
    const deleteButtons = screen.getAllByTestId("delete-item-button");
    expect(deleteButtons).toHaveLength(8);
  });

  it("should remove an item when its delete button is tapped", async () => {
    const { user } = await setup();
    expect(screen.getByText("Tofu")).toBeInTheDocument();

    // Delete first item
    const deleteButtons = screen.getAllByTestId("delete-item-button");
    await user.click(deleteButtons[0]);

    expect(screen.queryByText("Tofu")).not.toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(7);
  });
});

// ─── US-1A.8 — Collapse / expand section ────────────────────────────────────

describe("US-1A.8 — Tapping section chevron collapses/expands the section", () => {
  it("should render a chevron toggle in each section header", async () => {
    await setup();
    expect(screen.getByTestId("section-collapse-toggle")).toBeInTheDocument();
  });

  it("should hide items when the section is collapsed", async () => {
    const { user } = await setup();
    expect(screen.getAllByRole("checkbox")).toHaveLength(8);

    await user.click(screen.getByTestId("section-collapse-toggle"));
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("should show items again when the section is expanded", async () => {
    const { user } = await setup();
    const toggle = screen.getByTestId("section-collapse-toggle");

    await user.click(toggle); // collapse
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);

    await user.click(toggle); // expand
    expect(screen.getAllByRole("checkbox")).toHaveLength(8);
  });

  it("should rotate the chevron icon when collapsed", async () => {
    const { user } = await setup();
    const toggle = screen.getByTestId("section-collapse-toggle");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("data-collapsed", "true");
  });
});

// ─── US-1A.9 — No view tabs before Suggest ──────────────────────────────────

describe("US-1A.9 — View tabs (Flat/Smart/Aisles) not visible before Suggest", () => {
  it("should not render a 'Flat' tab", async () => {
    await setup();
    expect(screen.queryByTestId("view-tab-flat")).not.toBeInTheDocument();
  });

  it("should not render a 'Smart' tab", async () => {
    await setup();
    expect(screen.queryByTestId("view-tab-smart")).not.toBeInTheDocument();
  });

  it("should not render an 'Aisles' tab", async () => {
    await setup();
    expect(screen.queryByTestId("view-tab-aisles")).not.toBeInTheDocument();
  });
});

// ─── US-1A.10 — Mobile layout / touch targets ───────────────────────────────

describe("US-1A.10 — 390px mobile layout with 44px minimum touch targets", () => {
  it("should render all checkbox touch targets at least 44px tall", async () => {
    await setup();
    const checkboxWrappers = screen.getAllByTestId("checkbox-touch-target");
    for (const el of checkboxWrappers) {
      const { height } = el.getBoundingClientRect();
      // jsdom returns 0 for unrendered layout; test the min-height style instead
      const minHeight = getComputedStyle(el).minHeight;
      expect(
        parseInt(minHeight) >= 44 || el.getAttribute("data-min-height") === "44"
      ).toBe(true);
    }
  });

  it("should render the '+ Add Item' touch target at least 44px tall", async () => {
    await setup();
    const addBtn = screen.getByTestId("add-item-button");
    const minHeight = getComputedStyle(addBtn).minHeight;
    expect(
      parseInt(minHeight) >= 44 || addBtn.getAttribute("data-min-height") === "44"
    ).toBe(true);
  });

  it("should render the Suggest button if visible (pre-suggest state check)", async () => {
    await setup();
    // Suggest button should exist in the section header area
    expect(screen.getByTestId("suggest-button")).toBeInTheDocument();
  });
});
