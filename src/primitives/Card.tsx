import type { HTMLAttributes, KeyboardEvent } from "react";

export type CardVariant = "flat" | "lifted" | "glass";
export type CardForcedState = "rest" | "hover";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  forcedState?: CardForcedState;
  interactive?: boolean;
  lit?: boolean;
  selected?: boolean;
  variant?: CardVariant;
}
export function Card({
  children,
  className = "",
  forcedState = "rest",
  interactive = false,
  lit = false,
  onClick,
  onKeyDown,
  selected = false,
  tabIndex,
  variant = "flat",
  ...props
}: CardProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (!interactive || event.defaultPrevented) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.currentTarget.click();
    }
  };

  return (
    <div
      {...props}
      role={interactive ? "button" : props.role}
      tabIndex={interactive ? (tabIndex ?? 0) : tabIndex}
      aria-pressed={interactive ? selected : undefined}
      data-force-state={forcedState}
      data-interactive={interactive || undefined}
      data-lit={lit || undefined}
      data-selected={selected || undefined}
      data-variant={variant}
      className={`nc-card${className ? ` ${className}` : ""}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}
