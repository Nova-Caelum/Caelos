import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { IconSlot, type ControlSize } from "./align";

export type RowVariant = "tab" | "sidebar" | "list" | "crumb";
export type RowForcedState = "rest" | "hover" | "active" | "selected";

export interface RowProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  forcedState?: RowForcedState;
  leadingIcon?: ReactNode;
  selected?: boolean;
  size?: ControlSize;
  trailing?: ReactNode;
  variant?: RowVariant;
}

const RowRoot = forwardRef<HTMLButtonElement, RowProps>(function Row({
  children,
  className = "",
  forcedState = "rest",
  leadingIcon,
  selected = false,
  size = "md",
  trailing,
  type = "button",
  variant = "list",
  ...props
}, ref) {
  const isSelected = selected || forcedState === "selected";
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      aria-pressed={isSelected}
      data-force-state={forcedState}
      data-selected={isSelected || undefined}
      data-size={size}
      data-variant={variant}
      className={`nc-row${className ? ` ${className}` : ""}`}
    >
      {leadingIcon ? <IconSlot>{leadingIcon}</IconSlot> : null}
      <span className="nc-row__label nc-primitive__label">{children}</span>
      {trailing ? <span className="nc-row__trailing">{trailing}</span> : null}
    </button>
  );
});

export interface RowGroupProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "bare" | "pill" | "contained";
}

function RowGroup({ children, className = "", variant = "bare", ...props }: RowGroupProps) {
  return (
    <div {...props} data-variant={variant} className={`nc-row-group${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}

export const Row = Object.assign(RowRoot, { Group: RowGroup });
