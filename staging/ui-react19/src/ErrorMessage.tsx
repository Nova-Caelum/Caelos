import type { HTMLAttributes, ReactNode } from "react";
import { X } from "lucide-react";
import { errorMessage } from "../styled-system/recipes/index.mjs";
import { IconButton } from "./components";
import { RetryButton } from "./RetryButton";
import { themeAttributes, useCaelosTheme } from "./theme";

export interface ErrorMessageProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  onOpen?: () => void;
  onDismiss?: () => void;
  dismissLabel?: string;
}
/** Reusable danger surface for message, upload, and future component failures. */
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
    {onRetry && <RetryButton label={retryLabel} onClick={onRetry} />}
    {onDismiss && <IconButton label={dismissLabel} icon={<X size={15} />} variant="text" onClick={onDismiss} style={{ flexShrink: 0 }} />}
  </div>;
}
