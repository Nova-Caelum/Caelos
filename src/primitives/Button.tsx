import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { IconSlot, type ControlSize } from "./align";

export type ButtonVariant = "primary" | "secondary" | "text";
export type ForcedControlState = "rest" | "hover" | "active" | "focus";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  danger?: boolean;
  forcedState?: ForcedControlState;
  loading?: boolean;
  size?: ControlSize;
  variant?: ButtonVariant;
  leadingIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  children,
  className = "",
  danger = false,
  disabled,
  forcedState = "rest",
  leadingIcon,
  loading = false,
  size = "md",
  type = "button",
  variant = "secondary",
  ...props
}, ref) {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-danger={danger || undefined}
      data-force-state={forcedState}
      data-size={size}
      data-variant={variant}
      className={`nc-button${className ? ` ${className}` : ""}`}
    >
      {loading ? (
        <IconSlot><LoaderCircle className="nc-button__spinner" /></IconSlot>
      ) : leadingIcon ? (
        <IconSlot>{leadingIcon}</IconSlot>
      ) : null}
      <span className="nc-primitive__label">{children}</span>
    </button>
  );
});
