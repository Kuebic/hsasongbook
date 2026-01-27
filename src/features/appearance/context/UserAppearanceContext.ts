/**
 * User Appearance Context
 *
 * Context for managing user appearance preferences.
 */

import { createContext, useContext } from "react";
import type { AppearanceContextValue } from "../types/appearance.types";

export const UserAppearanceContext = createContext<AppearanceContextValue | null>(null);

/**
 * Hook to access appearance preferences and actions
 * @throws Error if used outside of UserAppearanceProvider
 */
export function useAppearance(): AppearanceContextValue {
  const context = useContext(UserAppearanceContext);
  if (!context) {
    throw new Error("useAppearance must be used within a UserAppearanceProvider");
  }
  return context;
}

/**
 * Hook to access appearance preferences (safe version that returns null if not in provider)
 */
export function useAppearanceSafe(): AppearanceContextValue | null {
  return useContext(UserAppearanceContext);
}
