import type { HTMLAttributes, ReactNode } from "react";
import { RotateCcw, X } from "lucide-react";
import { errorMessage } from "../styled-system/recipes/index.mjs";
import { IconButton } from "./components";
import { themeAttributes, useCaelosTheme } from "./theme";

export interface ErrorMessageProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** What failed, in a few words. */
  title: ReactNode;
  /** Why it failed and, when it is knowable, what to do next. */
  description?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  onOpen?: () => void;
  onDismiss?: () => void;
  dismissLabel?: string;
}

/**
 * Reusable danger surface for message, upload, and future component failures.
 *
 * Ported from the React 19 `caelos-chat-react19` package. It uses no React-19-only
 * API (no `use()`, no ref-as-prop, no boolean `inert`), so the port is unchanged
 * except for the retry control: that package's `RetryButton` composes a
 * `controlSkin` recipe this package does not have, so retry here is this package's
 * own danger `IconButton` — the same danger tint and hover ink, from `button`.
 */
export function ErrorMessage({ title, description, onRetry, retryLabel = "Retry", onOpen, onDismiss, dismissLabel = "Dismiss error", className, ...props }: ErrorMessageProps) {
  const styles = errorMessage();
  const theme = useCaelosTheme();
  const body = <><span className={styles.symbol}><X size={18} aria-hidden="true" /></span>
    <span className={styles.label}><span className={styles.name}>{title}</span>
      {description && <small className={styles.detail}>{description}</small>}</span></>;
  return <div role="alert" {...props} {...themeAttributes(theme)} data-failed="true" data-surface="elevated"
    className={[styles.root, className].filter(Boolean).join(" ")}>
    {onOpen ? <button type="button" className={styles.open} onClick={onOpen}>{body}</button>
      : <div className={styles.open} style={{ cursor: "default" }}>{body}</div>}
    {onRetry && <IconButton label={retryLabel} icon={<RotateCcw size={15} />} variant="tonal" danger onClick={onRetry} style={{ flexShrink: 0 }} />}
    {onDismiss && <IconButton label={dismissLabel} icon={<X size={15} />} variant="text" onClick={onDismiss} style={{ flexShrink: 0 }} />}
  </div>;
}
