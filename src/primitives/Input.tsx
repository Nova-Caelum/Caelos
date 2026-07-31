import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { Search } from "lucide-react";
import { IconSlot } from "./align";

export type InputVariant = "text" | "search";
export type InputForcedState = "rest" | "focus";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  forcedState?: InputForcedState;
  leadingIcon?: ReactNode;
  variant?: InputVariant;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({
  className = "",
  forcedState = "rest",
  leadingIcon,
  variant = "text",
  ...props
}, ref) {
  const icon = leadingIcon ?? (variant === "search" ? <Search /> : null);
  return (
    <label
      data-disabled={props.disabled || undefined}
      data-force-state={forcedState}
      data-variant={variant}
      className={`nc-input-primitive${className ? ` ${className}` : ""}`}
    >
      {icon ? <IconSlot>{icon}</IconSlot> : null}
      <input {...props} ref={ref} className="nc-input-primitive__control" />
    </label>
  );
});
