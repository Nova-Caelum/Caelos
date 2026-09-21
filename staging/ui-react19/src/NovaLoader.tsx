import { useEffect, useRef, type CSSProperties } from "react";
import { mount } from "./loader-v6/renderer";
import { useCaelosTheme } from "./theme";

export interface NovaLoaderProps {
  size?: number;
  label?: string;
  paused?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** The approved v6 geometry, with React lifecycle cleanup and theme motion settings. */
export function NovaLoader({ size = 32, label = "Loading", paused = false, className, style }: NovaLoaderProps) {
  const host = useRef<HTMLSpanElement>(null);
  const { reducedMotion } = useCaelosTheme();
  useEffect(() => {
    if (!host.current) return;
    const controller = mount(host.current, { autoplay: !paused && !reducedMotion });
    return () => controller.destroy();
  }, [paused, reducedMotion]);
  return <span role="status" aria-label={label} className={className}
    style={{ display: "inline-flex", width: size, height: size, flexShrink: 0, ...style }}>
    <span ref={host} aria-hidden="true" style={{ display: "block", width: "100%", height: "100%" }} />
  </span>;
}
