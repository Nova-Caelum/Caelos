import { defineRecipe } from "@pandacss/dev";

// Approved by the user 2026-09-19 as the small inline activity mark (file rows, background jobs, subagents).
// A 3×3 cell grid rippling corner to corner. Colour is inherited (currentColor), so it is the
// surrounding text colour — dawn cream on Caelos text — and follows the theme. NovaLoader remains
// the large, expressive loader; this one sits beside 12–13px text.
const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

export const rippleLoader = defineRecipe({
  className: "ripple-loader",
  base: {
    "--ripple-size": "12px",
    "--ripple-gap": "1px",
    "--ripple-rest": ".14",
    "--ripple-peak": ".92",
    display: "inline-grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "var(--ripple-gap)",
    width: "var(--ripple-size)",
    height: "var(--ripple-size)",
    flex: "none",
    verticalAlign: "-1px",
    "& > i": {
      display: "block",
      background: "currentColor",
      borderRadius: "calc(var(--ripple-size) / 12)",
      opacity: "var(--ripple-rest)",
      animation: "nc-ripple 1.5s ease infinite",
    },
    // Reference delay sequence, kept as supplied: 0 1 2 / 1 2 2 / 3 3 4 (×100ms).
    "& > i:nth-child(2), & > i:nth-child(4)": delay(100),
    "& > i:nth-child(3), & > i:nth-child(5), & > i:nth-child(6)": delay(200),
    "& > i:nth-child(7), & > i:nth-child(8)": delay(300),
    "& > i:nth-child(9)": delay(400),
    // Paused or reduced motion: no animation; a still diagonal that still reads as "in progress".
    "&[data-still=true] > i": { animation: "none" },
    "&[data-still=true] > i:nth-child(1)": { opacity: 0.9 },
    "&[data-still=true] > i:nth-child(2), &[data-still=true] > i:nth-child(4)": { opacity: 0.62 },
    "&[data-still=true] > i:nth-child(3), &[data-still=true] > i:nth-child(5), &[data-still=true] > i:nth-child(7)": { opacity: 0.38 },
    "@media (prefers-reduced-motion: reduce)": {
      "& > i": { animation: "none" },
      "& > i:nth-child(1)": { opacity: 0.9 },
      "& > i:nth-child(2), & > i:nth-child(4)": { opacity: 0.62 },
      "& > i:nth-child(3), & > i:nth-child(5), & > i:nth-child(7)": { opacity: 0.38 },
    },
  },
});
