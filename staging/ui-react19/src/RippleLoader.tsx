import type { CSSProperties } from "react";
import { rippleLoader } from "../styled-system/recipes/index.mjs";
import { useCaelosTheme } from "./theme";

export interface RippleLoaderProps {
  /** Edge length in px. 12 sits beside small text; 16 suits a status corner. */
  size?: number;
  /** Gap between cells in px. Defaults to 1 up to 16px, then scales with size. */
  gap?: number;
  /** Accessible status text. */
  label?: string;
  /** Hold the still diagonal instead of animating. */
  paused?: boolean;
  className?: string;
  style?: CSSProperties;
}

const cx = (...values: (string | undefined)[]) => values.filter(Boolean).join(" ");

/** Small inline activity mark. Inherits the surrounding text colour; respects theme reduced motion. */
export function RippleLoader({ size = 12, gap, label = "Working", paused = false, className, style }: RippleLoaderProps) {
  const { reducedMotion } = useCaelosTheme();
  const resolvedGap = gap ?? (size <= 16 ? 1 : Math.max(1, Math.round(size / 16)));
  return <span role="status" aria-label={label} data-still={paused || reducedMotion ? "true" : undefined}
    className={cx(rippleLoader(), className)}
    style={{ "--ripple-size": `${size}px`, "--ripple-gap": `${resolvedGap}px`, ...style } as CSSProperties}>
    <i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" />
    <i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" />
    <i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" />
  </span>;
}
