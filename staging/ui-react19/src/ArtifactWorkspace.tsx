import { useRef, type ReactNode, type Ref } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { artifactWorkspace } from "../styled-system/recipes/index.mjs";
import { Button, type ButtonProps, Tooltip } from "./components";
import { Surface } from "./foundation";
import { themeAttributes, useCaelosTheme } from "./theme";

const cx = (...values: (string | undefined | false)[]) => values.filter(Boolean).join(" ");

export type WorkspacePlacement = "inline" | "panel";

export interface WorkspaceToolButtonProps extends Omit<ButtonProps, "children"> {
  label: string;
  icon: ReactNode;
  /** The pill sits at the left edge of the reading plane, so its hints open to the left. */
  side?: "top" | "bottom" | "left" | "right";
}

/**
 * One control in the tool pill. No fill on hover: the accent lands on the glyph alone, so a
 * column of seven controls stays quiet beside the document.
 */
export function WorkspaceToolButton({ label, icon, side = "left", className, style, ...props }: WorkspaceToolButtonProps) {
  const styles = artifactWorkspace();
  return (
    <Tooltip label={label} side={side}>
      {/* Width and padding are inline for the same reason `IconButton` sets them inline: the
          shared button recipe's own `paddingInline` is same-specificity, so order would decide. */}
      <Button {...props} variant="text" aria-label={label} className={cx(styles.toolButton, className)}
        style={{ width: 34, padding: 0, ...style }}>
        {icon}
      </Button>
    </Tooltip>
  );
}

export interface WorkspaceToolPillProps {
  /**
   * Elevation of the pill. The written approval (`reviews/2026-09-20-iter3-5-followup.md`
   * and the run's approved table) records "tool pill on the `top` tier", which is this
   * default. The live option-B specimen renders it at `elevated-2`; that discrepancy is
   * reported rather than silently resolved.
   */
  tier?: "top" | "elevated-2";
  children: ReactNode;
  className?: string;
}

/** The tool column beside the reading plane. It never overlaps the document. */
export function WorkspaceToolPill({ tier = "top", children, className }: WorkspaceToolPillProps) {
  const styles = artifactWorkspace();
  return (
    <div className={styles.tools}>
      <Surface layer={tier} className={cx(styles.toolbar, className)}>{children}</Surface>
    </div>
  );
}

export interface ArtifactWorkspaceProps {
  /** The file coordinate, in Mono. */
  name: ReactNode;
  /** Updated time, session owner, or the kind. */
  meta?: ReactNode;
  /** Full-screen and panel toggles, in the strip. */
  actions?: ReactNode;
  /** A `WorkspaceToolPill`, or nothing when the tools are collapsed. */
  tools?: ReactNode;
  /** Inline in the conversation, or filling the side panel. */
  placement?: WorkspacePlacement;
  /** A transient suggestion under the document. */
  suggestion?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * 05 · Expanded workspace — approved option B, "Strip and paper". The workspace paints no
 * ground of its own, so the only graph paper is the host's. One glass card: a strip carrying
 * the coordinate and the strip actions, then the paper document plane.
 *
 * Code and markdown inside the card are plain and one tier above the paper: pass
 * `codeSurface="top"` to any `ActivityChain` rendered in `children`.
 */
export function ArtifactWorkspace({ name, meta, actions, tools, placement = "inline", suggestion, children, className }: ArtifactWorkspaceProps) {
  const styles = artifactWorkspace({ placement });
  return (
    <div className={cx(styles.root, className)} data-placement={placement}>
      <div className={styles.layout} data-tools={tools != null}>
        {tools}
        <div className={styles.card}>
          <div className={styles.strip}>
            <div className={styles.coordinate}>
              <code className={styles.coordinateName} data-workspace-coordinate="">{name}</code>
              {meta != null && <span className={styles.meta}>{meta}</span>}
            </div>
            {actions != null && <div className={styles.actions}>{actions}</div>}
          </div>
          <div className={styles.body}>
            <div className={styles.document}>
              {children}
              {suggestion != null && <p className={styles.suggestion} role="status">{suggestion}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface WorkspaceEditorProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  textareaRef?: Ref<HTMLTextAreaElement>;
  className?: string;
}

/**
 * Editing text sits exactly where reading text sits, and focus tints the card's single edge
 * instead of drawing a second rectangle inside the glass.
 */
export function WorkspaceEditor({ value, onValueChange, label = "Document text", textareaRef, className }: WorkspaceEditorProps) {
  const styles = artifactWorkspace();
  return (
    <textarea ref={textareaRef} data-workspace-editor="" aria-label={label}
      className={cx(styles.editor, className)} value={value}
      onChange={event => onValueChange(event.target.value)} />
  );
}

export type WorkspaceFrame = "overlay" | "slot";

export interface WorkspacePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accessible name for the panel. Visually hidden. */
  title: string;
  /**
   * Where the panel is positioned.
   *
   * `overlay` (the default) is the approved Atlas specimen: a fixed, right-anchored 850px
   * column over the viewport, portalled to the body.
   *
   * `slot` is layout-agnostic: the panel positions nothing and fills the box its host gives
   * it, rendering in place rather than in a portal. Use this in a real application, where
   * the host lays the conversation column and the panel out side by side so the panel never
   * covers the control that opened it and the conversation stays live beside it.
   */
  frame?: WorkspaceFrame;
  /** Edge to edge instead of the 850px column. `overlay` only; in a slot the host owns width. */
  full?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * The non-modal side panel. It joins the conversation's world: nothing dims, blurs or
 * disables the chat, pointer events outside it do not dismiss it, it casts no shadow and
 * draws no border, and its ground dissolves over 36px at the leading edge. It closes from its
 * own toggle or with Escape, and focus returns to the trigger.
 *
 * Built directly on the Radix dialog primitive rather than the package `Drawer`, because
 * `Drawer` is modal by contract and owns a scrim, a header and a close control.
 *
 * The material — ground, graph, dissolve, no edge — is the same in both frames; only the
 * positioning differs, because where a panel sits is the host's decision and not this
 * component's.
 */
export function WorkspacePanel({ open, onOpenChange, title, frame = "overlay", full = false, children, className }: WorkspacePanelProps) {
  const settings = useCaelosTheme();
  const styles = artifactWorkspace({ frame });
  const returnFocus = useRef<HTMLElement | null>(null);
  const content = (
    <DialogPrimitive.Content {...themeAttributes(settings)}
      className={cx(styles.panel, className)} data-frame={frame} data-full={full}
      aria-describedby={undefined}
      onInteractOutside={event => event.preventDefault()}
      onOpenAutoFocus={event => {
        returnFocus.current = document.activeElement as HTMLElement | null;
        event.preventDefault();
        (event.target as HTMLElement).focus();
      }}
      onCloseAutoFocus={event => {
        if (returnFocus.current?.isConnected) {
          event.preventDefault();
          returnFocus.current.focus();
        }
      }}>
      <DialogPrimitive.Title style={{
        position: "absolute", width: 1, height: 1, padding: 0, margin: -1,
        overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap", border: 0,
      }}>{title}</DialogPrimitive.Title>
      {children}
    </DialogPrimitive.Content>
  );
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false}>
      {/* A slot panel renders where the host put it; only the overlay travels to the body. */}
      {frame === "overlay" ? <DialogPrimitive.Portal>{content}</DialogPrimitive.Portal> : content}
    </DialogPrimitive.Root>
  );
}
