import type { ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { controlSkin } from "../styled-system/recipes/index.mjs";
import { IconButton, type IconButtonProps } from "./components";

const cx = (...values: (string | undefined | false)[]) => values.filter(Boolean).join(" ");

export interface RetryButtonProps extends Omit<IconButtonProps, "icon" | "label"> {
  label?: string;
  icon?: ReactNode;
}

/**
 * The retry beside a failed file card or a compact error. One control, one behaviour: the danger
 * tint's glow at rest, the danger set's hover ink, line and 18px glow on hover — the package's
 * button tokens, not a local colour.
 */
export function RetryButton({ label = "Retry", icon, className, ...props }: RetryButtonProps) {
  return (
    <IconButton {...props} danger variant="tonal" data-nc-control-skin=""
      className={cx(controlSkin({ kind: "danger" }), className)}
      label={label} icon={icon ?? <RotateCcw size={15} />} />
  );
}
