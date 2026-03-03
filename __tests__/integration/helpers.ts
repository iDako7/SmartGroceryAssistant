// __tests__/integration/helpers.ts
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Clicks the onboarding skip button if it exists.
 * Before Phase 1D is implemented this is a no-op, so existing tests stay green.
 */
export async function skipOnboarding(
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  const skipBtn = screen.queryByTestId("onboarding-skip-button");
  if (skipBtn) {
    await user.click(skipBtn);
  }
}
