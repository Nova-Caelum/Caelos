import { createElement, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

export type ControlSize = "sm" | "md";

export const CONTROL_HEIGHT: Record<ControlSize, string> = {
  sm: "var(--sys-space-7)",
  md: "var(--sys-space-8)",
};

export const ALIGN_STYLE = {
  icon: {
    alignItems: "center",
    display: "inline-flex",
    flex: "0 0 1em",
    height: "1em",
    justifyContent: "center",
    lineHeight: 1,
    width: "1em",
  },
  opticalText: {
    transform: "translateY(calc(var(--sys-border-width-1) * -1))",
  },
} satisfies Record<string, CSSProperties>;

export interface IconSlotProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}
export function IconSlot({ children, className = "", style, ...props }: IconSlotProps) {
  return createElement(
    "span",
    {
      ...props,
      "aria-hidden": props["aria-hidden"] ?? true,
      className: `nc-icon-slot${className ? ` ${className}` : ""}`,
      style: { ...ALIGN_STYLE.icon, ...style },
    },
    children,
  );
}
