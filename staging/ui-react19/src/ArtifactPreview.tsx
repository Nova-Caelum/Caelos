import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Bot, ChevronDown, FileText, Globe } from "lucide-react";
import { artifactPreview } from "../styled-system/recipes/index.mjs";
import { NovaLoader } from "./NovaLoader";
import { useCaelosTheme } from "./theme";

const cx = (...values: (string | undefined | false)[]) => values.filter(Boolean).join(" ");

export type ArtifactKind = "document" | "web" | "agent-session";
export type ArtifactPhase = "waiting" | "working" | "complete";

const KIND = {
  document: { icon: FileText, label: "Document" },
  web: { icon: Globe, label: "Web preview" },
  "agent-session": { icon: Bot, label: "Agent session" },
} as const;

export interface ArtifactPreviewProps {
  kind: ArtifactKind;
  /** The artifact's own name, on one line, truncated rather than wrapped. */
  title: ReactNode;
  /** Kind and coordinate, e.g. `Markdown · workspace-direction.md`. Put paths in `<code>`. */
  coordinate?: ReactNode;
  /** Label on the disclosure trigger. Defaults to the kind's own word. */
  triggerLabel?: ReactNode;
  /** Controlled disclosure. Omit for internal state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Before `complete`, the same card holds the large loader instead of an excerpt. */
  phase?: ArtifactPhase;
  /** Expand / download / copy, in the strip. */
  actions?: ReactNode;
  /** Transient status text under the body. */
  notice?: ReactNode;
  /**
   * `window` caps the excerpt at the reading window and fades content that really overruns.
   * `content` lets the card grow: an interactive body is never capped or faded.
   */
  fit?: "window" | "content";
  generatingLabel?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * 04 · Inline preview — approved option B, "Strip and paper", with the glass-to-paper blend.
 * One glass card: a strip carrying the type icon, name, kind and coordinate and the actions,
 * then a plain paper plane running the full width that fades in over 30px so the material step
 * leaves no line. No divider, no nested card, no second graph layer.
 *
 * Code and markdown inside this card are plain and one tier above the paper: pass
 * `codeSurface="top"` to any `ActivityChain` rendered in `children`.
 */
export function ArtifactPreview({
  kind,
  title,
  coordinate,
  triggerLabel,
  open,
  onOpenChange,
  phase = "complete",
  actions,
  notice,
  fit = "window",
  generatingLabel = "Generating document",
  children,
  className,
}: ArtifactPreviewProps) {
  const id = useId();
  const { reducedMotion } = useCaelosTheme();
  const [ownOpen, setOwnOpen] = useState(true);
  const isOpen = open ?? ownOpen;
  const setOpen = (next: boolean) => (onOpenChange ? onOpenChange(next) : setOwnOpen(next));
  const styles = artifactPreview();
  const Icon = KIND[kind].icon;

  // The fade belongs only to content that really runs past the window; short content sizes
  // the card instead. Bottom padding is excluded so the state cannot oscillate.
  const excerpt = useRef<HTMLDivElement>(null);
  const [overrun, setOverrun] = useState(false);
  useEffect(() => {
    const element = excerpt.current;
    if (!element) return;
    const measure = () => {
      const style = getComputedStyle(element);
      setOverrun(
        element.scrollHeight - parseFloat(style.paddingBottom) > parseFloat(style.maxHeight) + 1,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [isOpen, phase, kind, fit, children]);

  return (
    <div className={cx(styles.root, className)}>
      <button type="button" className={styles.trigger} aria-expanded={isOpen} aria-controls={id}
        onClick={() => setOpen(!isOpen)}>
        <Icon size={16} aria-hidden="true" />
        <span>{triggerLabel ?? KIND[kind].label}</span>
        <ChevronDown size={14} className={styles.triggerChevron} data-open={isOpen} />
      </button>
      {isOpen && (
        <div className={styles.card} id={id} data-phase={phase} data-inner="paper">
          <div className={styles.strip}>
            <div className={styles.name}>
              <Icon size={16} aria-hidden="true" />
              <div className={styles.nameText}>
                <h4 className={styles.title}>{title}</h4>
                {coordinate != null && <span className={styles.meta}>{coordinate}</span>}
              </div>
            </div>
            {actions != null && <div className={styles.actions}>{actions}</div>}
          </div>
          <div className={styles.body}>
            {phase !== "complete"
              ? <div className={styles.generating} aria-label="Generating preview">
                  <NovaLoader size={132} paused={reducedMotion} label={generatingLabel} />
                </div>
              : <div className={styles.excerpt} ref={excerpt}
                  data-overrun={fit === "window" && overrun}
                  data-fit={fit === "content" ? "content" : undefined}>
                  {children}
                </div>}
          </div>
          {notice != null && <span role="status" className={styles.notice}>{notice}</span>}
        </div>
      )}
    </div>
  );
}
