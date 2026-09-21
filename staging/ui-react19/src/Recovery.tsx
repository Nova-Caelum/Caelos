import type { HTMLAttributes, ReactNode } from "react";
import { ArrowDown } from "lucide-react";
import { controlSkin, recovery } from "../styled-system/recipes/index.mjs";
import { Button, Tooltip } from "./components";
import { NovaLoader } from "./NovaLoader";
import { useCaelosTheme } from "./theme";

const cx = (...values: (string | undefined | false)[]) => values.filter(Boolean).join(" ");

export interface UnreadDividerProps extends HTMLAttributes<HTMLDivElement> {
  /** e.g. "New messages" or "2 new messages". */
  children: ReactNode;
  label?: string;
}

/**
 * 10 · Unread divider. A rule made of space and a label, not a drawn line across the column.
 * UNCONFIRMED: direction A was recorded in Iter 2, but the same note asked for changes this
 * specimen does not implement.
 */
export function UnreadDivider({ children, label = "New messages", className, ...props }: UnreadDividerProps) {
  return (
    <div {...props} role="separator" aria-label={label} className={cx(recovery().unread, className)}>
      <span>{children}</span>
    </div>
  );
}

export interface CompactErrorProps extends HTMLAttributes<HTMLDivElement> {
  /** What happened and what is safe, in one line. */
  children: ReactNode;
  /** The retry control. It sits on the same row, never below the text. */
  action?: ReactNode;
}

/**
 * 10 · Compact error and interruption. One object, one edge, the danger token set complete.
 * Daniel called this "actually pretty good" and wants it generalised later.
 * UNCONFIRMED, as above.
 */
export function CompactError({ children, action, className, ...props }: CompactErrorProps) {
  const styles = recovery();
  return (
    <div {...props} role="alert" className={cx(styles.error, className)}>
      <p className={styles.errorText}>{children}</p>
      {action}
    </div>
  );
}

export interface JumpToLatestProps {
  onClick?: () => void;
  /** `working` shows the large loader instead of the arrow. */
  state?: "latest" | "working";
  /** Visible label beside the mark. Omit for the mark alone. */
  children?: ReactNode;
  label?: string;
  /** Orientation line above the control. */
  caption?: ReactNode;
  className?: string;
}

/**
 * 10 · Jump control. A floating control in the conversation's own glass, not a filled button.
 * UNCONFIRMED, as above.
 */
export function JumpToLatest({ onClick, state = "latest", children, label = "Jump to latest", caption, className }: JumpToLatestProps) {
  const styles = recovery();
  const { reducedMotion } = useCaelosTheme();
  return (
    <div className={cx(styles.navigation, className)}>
      {caption != null && <p style={{ margin: 0, color: "var(--il-muted)" }}>{caption}</p>}
      <Tooltip label={label}>
        <Button variant="tonal" data-nc-control-skin="" onClick={onClick} aria-label={label}
          className={cx(controlSkin({ kind: "glass" }), styles.jump)}>
          {state === "working" ? <NovaLoader size={36} paused={reducedMotion} /> : <ArrowDown size={28} />}
          {children}
        </Button>
      </Tooltip>
    </div>
  );
}
