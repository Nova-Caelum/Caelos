import type { HTMLAttributes, ReactNode } from "react";
import { FileText, X } from "lucide-react";
import { fileCard } from "../styled-system/recipes/index.mjs";
import { IconButton } from "./components";
import { Surface } from "./foundation";
import { ErrorMessage } from "./ErrorMessage";
import { RippleLoader } from "./RippleLoader";
import { useCaelosTheme } from "./theme";

const cx = (...values: (string | undefined | false)[]) => values.filter(Boolean).join(" ");

export type FileCardStatus = "ready" | "uploading" | "failed";

export interface FileCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** The file name, on the first line. */
  name: ReactNode;
  /** Type and size, or the status line, on the second. */
  detail: ReactNode;
  status?: FileCardStatus;
  /** Opens the file. The whole card body is the control; nothing nests inside it. */
  onOpen?: () => void;
  /** Shown only in the failed state. */
  onRetry?: () => void;
  retryLabel?: string;
  /** Removes a pending file; rendered inside the card beside the open control. */
  onRemove?: () => void;
  removeLabel?: string;
  uploadingLabel?: string;
  /** Overrides the ready-state symbol. */
  icon?: ReactNode;
}

/**
 * 08 · File card — approved option A, the two-line card: name first, type and size below.
 * The failed state takes the danger token set complete (on-tint ink, line, tint and an 18px
 * glow), and the retry behaves like the package's button tokens on hover, both per Daniel's
 * standing Iter 2 asks.
 */
export function FileCard({
  name, detail, status = "ready", onOpen, onRetry, onRemove,
  removeLabel = "Remove attachment",
  retryLabel = "Retry upload", uploadingLabel = "Uploading file", icon,
  className, ...props
}: FileCardProps) {
  const styles = fileCard();
  const { reducedMotion } = useCaelosTheme();
  const failed = status === "failed";
  if (failed) return <ErrorMessage {...props} className={className} title={name} description={detail}
    onOpen={onOpen} onRetry={onRetry} retryLabel={retryLabel} onDismiss={onRemove} dismissLabel={removeLabel} />;
  const symbol = status === "uploading"
      ? <RippleLoader size={16} paused={reducedMotion} label={uploadingLabel} />
      : icon ?? <FileText size={21} />;
  const body = <>
    <button type="button" className={styles.open} onClick={onOpen}>
      <span className={styles.symbol}>{symbol}</span>
      <span className={styles.label}>
        <span className={styles.name}>{name}</span>
        <small className={styles.detail}>{detail}</small>
      </span>
    </button>
    {onRemove && <IconButton label={removeLabel} icon={<X size={15} />} variant="text" onClick={onRemove} style={{ flexShrink: 0 }} />}
  </>;
  return <Surface {...props} layer="elevated" className={cx(styles.root, className)} data-failed="false">{body}</Surface>;
}
