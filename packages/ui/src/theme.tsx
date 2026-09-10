import React, { createContext, useContext, type HTMLAttributes } from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";
export type Theme = "dark" | "light";
export interface ThemeSettings {
  theme: Theme;
  reducedMotion: boolean;
  glass: boolean;
}
const ThemeContext = createContext<ThemeSettings>({
  theme: "dark",
  reducedMotion: false,
  glass: true,
});
export function useCaelosTheme() {
  return useContext(ThemeContext);
}
export function themeAttributes({
  theme,
  reducedMotion,
  glass,
}: ThemeSettings) {
  return {
    "data-caelos-theme": theme,
    "data-caelos-reduced": reducedMotion,
    "data-caelos-glass": glass,
  };
}
export interface CaelosProviderProps extends HTMLAttributes<HTMLDivElement> {
  theme?: Theme;
  reducedMotion?: boolean;
  glass?: boolean;
  tooltipDelay?: number;
}
/** Scope tokens to this subtree. Portaled components retain these settings. */
export function CaelosProvider({
  theme = "dark",
  reducedMotion = false,
  glass = true,
  tooltipDelay = 400,
  children,
  ...props
}: CaelosProviderProps) {
  const settings = { theme, reducedMotion, glass };
  return (
    <ThemeContext.Provider value={settings}>
      <RadixTooltip.Provider delayDuration={tooltipDelay}>
        <div {...props} {...themeAttributes(settings)}>
          {children}
        </div>
      </RadixTooltip.Provider>
    </ThemeContext.Provider>
  );
}
