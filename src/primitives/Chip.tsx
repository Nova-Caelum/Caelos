import type { HTMLAttributes } from "react";

export type ChipVariant = "status" | "category" | "count";
export type ChipTone = "danger" | "progress" | "done" | "ready" | "atmospheric" | "structural" | "sage" | "neutral";

export interface ChipProps extends Omit<HTMLAttributes<HTMLElement>, "onClick"> {
  interactive?: boolean;
  onClick?: () => void;
  selected?: boolean;
  tone?: ChipTone;
  variant?: ChipVariant;
}
export function Chip({
  children,
  className = "",
  interactive = false,
  onClick,
  selected = false,
  tone = "neutral",
  variant = "status",
  ...props
}: ChipProps) {
  const shared = {
    ...props,
    "data-selected": selected || undefined,
    "data-tone": tone,
    "data-variant": variant,
    className: `nc-chip${className ? ` ${className}` : ""}`,
  };

  if (interactive || onClick) {
    return (
      <button {...shared} type="button" onClick={onClick} aria-pressed={selected}>
        <span className="nc-primitive__label">{children}</span>
      </button>
    );
  }

  return <span {...shared}><span className="nc-primitive__label">{children}</span></span>;
}
