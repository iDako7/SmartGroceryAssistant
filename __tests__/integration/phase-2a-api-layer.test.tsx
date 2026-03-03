/**
 * Phase 2A — API Layer Integration Tests
 *
 * Tests the OpenRouter service layer:
 *  - Suggest triggers a fetch call to the OpenRouter API
 *  - API response is parsed and rendered as typed data
 *  - Education panels trigger API calls
 *  - Network errors / bad API keys show friendly toast messages
 *  - App remains functional after API errors
 *
 * Strategy: mock globalThis.fetch to intercept and verify API calls.
 * Environment variable VITE_OPENROUTER_API_KEY is stubbed for tests.
 *
 * data-testid contract (from Phase 1A–1C):
 *   Suggest:     suggest-button, skip-suggest-button, smart-view
 *   Education:   info-button-{itemId}, alternatives-button-{itemId}, inspire-button-{itemId}
 *   Grocery:     grocery-item (with data-checked attr), checkbox via role="checkbox"
 *   New (2A):    error-toast, toast-dismiss
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import App from "../../src/App";
import { skipOnboarding } from "./helpers";

// ─── helpers ─────────────────────────────────────────────────────────────────

async function setup() {
  const user = userEvent.setup();
  const utils = render(<App />);
  await skipOnboarding(user);
  return { user, ...utils };
}

/**
 * Tap Suggest, skip Quick Questions, and wait for the API call to resolve.
 */
async function triggerSuggest(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId("suggest-button"));
  await user.click(screen.getByTestId("skip-suggest-button"));
}

/**
 * Build a valid OpenRouter-shaped response wrapping a JSON body string.
 */
function mockOpenRouterResponse(content: object) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      choices: [
        {
          message: {
            content: JSON.stringify(content),
          },
        },
      ],
    }),
  };
}

/**
 * A minimal valid SuggestResponse matching the app's typed contract.
 */
const MOCK_API_SUGGEST_RESPONSE = {
  contextSummary: "AI-generated BBQ fusion recommendations",
  clusters: [
    {
      id: "api-cluster-1",
      emoji: "🔥",
      name: "Grilled Mains",
      description: "Essential proteins for the grill",
      items: [
        { nameEn: "Pork Belly", nameSecondary: "五花肉", existing: true },
        {
          nameEn: "Corn on the Cob",
          nameSecondary: "玉米",
          existing: false,
          reason: "Classic BBQ side",
          quantity: 4,
        },
      ],
    },
  ],
  ungrouped: { items: [] },
  aisleLayout: [
    {
      emoji: "🥩",
      aisleName: "Meat & Seafood",
      items: [
        {
          nameEn: "Pork Belly",
          nameSecondary: "五花肉",
          quantity: 1,
          checked: false,
          isSuggestion: false,
        },
      ],
    },
  ],
  moreSuggestions: [],
};

// ─── fetch mock management ───────────────────────────────────────────────────

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  // Stub the API key so the service layer uses the real (API) path
  vi.stubEnv("VITE_OPENROUTER_API_KEY", "test-api-key-12345");

  fetchSpy = vi.fn();
  globalThis.fetch = fetchSpy;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

// ─── US-2A.1 — API client calls OpenRouter and returns parsed response ──────

describe("US-2A.1 — API client calls OpenRouter successfully", () => {
  it("should call fetch with OpenRouter endpoint when Suggest is triggered", async () => {
    fetchSpy.mockResolvedValue(
      mockOpenRouterResponse(MOCK_API_SUGGEST_RESPONSE)
    );

    const { user } = await setup();
    await triggerSuggest(user);

    // Wait for the API call to have been made
    await screen.findByTestId("smart-view", {}, { timeout: 5000 });

    // Verify fetch was called with the OpenRouter API URL
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("openrouter.ai"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: expect.stringContaining("Bearer"),
        }),
      })
    );
  });

  it("should include the API key in the Authorization header", async () => {
    fetchSpy.mockResolvedValue(
      mockOpenRouterResponse(MOCK_API_SUGGEST_RESPONSE)
    );

    const { user } = await setup();
    await triggerSuggest(user);

    await screen.findByTestId("smart-view", {}, { timeout: 5000 });

    const callArgs = fetchSpy.mock.calls[0];
    const headers = callArgs[1]?.headers;
    expect(headers?.Authorization).toBe("Bearer test-api-key-12345");
  });

  it("should include the model name in the request body", async () => {
    fetchSpy.mockResolvedValue(
      mockOpenRouterResponse(MOCK_API_SUGGEST_RESPONSE)
    );

    const { user } = await setup();
    await triggerSuggest(user);

    await screen.findByTestId("smart-view", {}, { timeout: 5000 });

    const callArgs = fetchSpy.mock.calls[0];
    const body = JSON.parse(callArgs[1]?.body);
    expect(body.model).toContain("claude");
  });

  it("should render the AI-generated context summary from the API response", async () => {
    fetchSpy.mockResolvedValue(
      mockOpenRouterResponse(MOCK_API_SUGGEST_RESPONSE)
    );

    const { user } = await setup();
    await triggerSuggest(user);

    const smartView = await screen.findByTestId(
      "smart-view",
      {},
      { timeout: 5000 }
    );
    expect(smartView).toHaveTextContent("AI-generated BBQ fusion");
  });

  it("should render recipe clusters from the parsed API response", async () => {
    fetchSpy.mockResolvedValue(
      mockOpenRouterResponse(MOCK_API_SUGGEST_RESPONSE)
    );

    const { user } = await setup();
    await triggerSuggest(user);

    await screen.findByTestId("smart-view", {}, { timeout: 5000 });

    // The cluster name from our mock API response should be visible
    expect(screen.getByText(/Grilled Mains/)).toBeInTheDocument();
  });

  it("should render suggested items from the API response with reason text", async () => {
    fetchSpy.mockResolvedValue(
      mockOpenRouterResponse(MOCK_API_SUGGEST_RESPONSE)
    );

    const { user } = await setup();
    await triggerSuggest(user);

    await screen.findByTestId("smart-view", {}, { timeout: 5000 });

    // "Corn on the Cob" is a suggested item from the API response
    expect(screen.getByText(/Corn on the Cob/)).toBeInTheDocument();
    expect(screen.getByText(/Classic BBQ side/)).toBeInTheDocument();
  });

  it("should call the API when info button is tapped", async () => {
    const mockInfoResponse = {
      tasteProfile: "Rich and savory with umami depth",
      commonUses: "Grilling, braising, stir-fry",
      howToPick: "Look for even fat distribution",
      storageTips: "Refrigerate up to 3 days",
      funFact: "Popular in Korean BBQ traditions",
    };
    fetchSpy.mockResolvedValue(mockOpenRouterResponse(mockInfoResponse));

    const { user } = await setup();

    // Tap the info icon on Pork Belly (item id: i2)
    await user.click(screen.getByTestId("info-button-i2"));

    // Wait for the panel to appear with API content
    await screen.findByText(/Rich and savory/, {}, { timeout: 5000 });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("openrouter.ai"),
      expect.any(Object)
    );
  });

  it("should call the API when alternatives button is tapped", async () => {
    const mockAltResponse = {
      alternatives: [
        {
          nameEn: "Pork Shoulder",
          nameSecondary: "猪肩肉",
          matchLevel: "Very close",
          comparison: "Similar fat content, slightly tougher",
          aisleHint: "Meat section",
        },
      ],
    };
    fetchSpy.mockResolvedValue(mockOpenRouterResponse(mockAltResponse));

    const { user } = await setup();

    // Tap alternatives on Pork Belly (item id: i2)
    await user.click(screen.getByTestId("alternatives-button-i2"));

    await screen.findByText(/Pork Shoulder/, {}, { timeout: 5000 });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("openrouter.ai"),
      expect.any(Object)
    );
  });

  it("should call the API when inspire button is tapped", async () => {
    const mockInspireResponse = {
      recipes: [
        {
          name: "Kimchi Fried Rice",
          nameSecondary: "泡菜炒饭",
          description: "Spicy fried rice with fermented kimchi",
          missingIngredients: [
            { nameEn: "Day-old Rice", nameSecondary: "隔夜饭" },
          ],
        },
      ],
    };
    fetchSpy.mockResolvedValue(mockOpenRouterResponse(mockInspireResponse));

    const { user } = await setup();

    // Tap inspire on Kimchi (item id: i3, flat view only)
    await user.click(screen.getByTestId("inspire-button-i3"));

    await screen.findByText(/Kimchi Fried Rice/, {}, { timeout: 5000 });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("openrouter.ai"),
      expect.any(Object)
    );
  });
});

// ─── US-2A.2 — Error handling: toast on failure, no crash ────────────────────

describe("US-2A.2 — API errors show friendly toast and do not crash", () => {
  it("should show an error toast when Suggest API call fails with network error", async () => {
    fetchSpy.mockRejectedValue(new TypeError("Failed to fetch"));

    const { user } = await setup();
    await triggerSuggest(user);

    // A toast/notification with an error message should appear
    const toast = await screen.findByTestId(
      "error-toast",
      {},
      { timeout: 5000 }
    );
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveTextContent(/error|failed|try again/i);
  });

  it("should show an error toast when API returns 401 (bad API key)", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ error: { message: "Invalid API key" } }),
    });

    const { user } = await setup();
    await triggerSuggest(user);

    const toast = await screen.findByTestId(
      "error-toast",
      {},
      { timeout: 5000 }
    );
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveTextContent(/error|key|unauthorized|try again/i);
  });

  it("should show an error toast when API returns 500 (server error)", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({ error: { message: "Server error" } }),
    });

    const { user } = await setup();
    await triggerSuggest(user);

    const toast = await screen.findByTestId(
      "error-toast",
      {},
      { timeout: 5000 }
    );
    expect(toast).toBeInTheDocument();
  });

  it("should show an error toast when API returns malformed JSON", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: "not valid json {{{" } }],
      }),
    });

    const { user } = await setup();
    await triggerSuggest(user);

    const toast = await screen.findByTestId(
      "error-toast",
      {},
      { timeout: 5000 }
    );
    expect(toast).toBeInTheDocument();
  });

  it("should not crash the app after a Suggest API error — list remains interactive", async () => {
    fetchSpy.mockRejectedValue(new TypeError("Failed to fetch"));

    const { user } = await setup();
    await triggerSuggest(user);

    // Wait for error toast to confirm error was handled
    await screen.findByTestId("error-toast", {}, { timeout: 5000 });

    // App should still be functional — items should still be visible
    expect(screen.getByText(/Pork Belly/)).toBeInTheDocument();

    // User can still interact — toggle a checkbox
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);

    // The grocery-item wrapper should now have data-checked="true"
    const groceryItem = checkboxes[0].closest('[data-testid="grocery-item"]');
    expect(groceryItem).toHaveAttribute("data-checked", "true");
  });

  it("should show an error toast when education panel API call fails", async () => {
    fetchSpy.mockRejectedValue(new TypeError("Failed to fetch"));

    const { user } = await setup();

    // Tap info icon on Pork Belly (i2) to trigger an education API call
    await user.click(screen.getByTestId("info-button-i2"));

    const toast = await screen.findByTestId(
      "error-toast",
      {},
      { timeout: 5000 }
    );
    expect(toast).toBeInTheDocument();
  });

  it("should allow dismissing the error toast", async () => {
    fetchSpy.mockRejectedValue(new TypeError("Failed to fetch"));

    const { user } = await setup();
    await triggerSuggest(user);

    const toast = await screen.findByTestId(
      "error-toast",
      {},
      { timeout: 5000 }
    );
    expect(toast).toBeInTheDocument();

    // Tap dismiss on the toast
    const dismissBtn = within(toast).getByTestId("toast-dismiss");
    await user.click(dismissBtn);

    // Toast should be removed
    expect(screen.queryByTestId("error-toast")).not.toBeInTheDocument();
  });

  it("should allow retrying Suggest after an error", async () => {
    // First call fails
    fetchSpy.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    // Second call succeeds
    fetchSpy.mockResolvedValueOnce(
      mockOpenRouterResponse(MOCK_API_SUGGEST_RESPONSE)
    );

    const { user } = await setup();

    // First attempt — fails
    await triggerSuggest(user);
    await screen.findByTestId("error-toast", {}, { timeout: 5000 });

    // The suggest button should still be available for retry
    const suggestBtn = screen.getByTestId("suggest-button");
    expect(suggestBtn).toBeInTheDocument();

    // Second attempt — succeeds
    await user.click(suggestBtn);
    await user.click(screen.getByTestId("skip-suggest-button"));

    const smartView = await screen.findByTestId(
      "smart-view",
      {},
      { timeout: 5000 }
    );
    expect(smartView).toBeInTheDocument();
  });
});
