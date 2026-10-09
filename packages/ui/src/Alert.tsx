import type { HTMLAttributes, ReactNode } from "react";
import { alert, card } from "../styled-system/recipes/index.mjs";

const cx = (...values: (string | undefined | false)[]) => values.filter(Boolean).join(" ");

export type AlertTone = "progress" | "accent" | "ready" | "danger" | "sage" | "none";
export type AlertMaterial = "tonal" | "glass";
export type AlertEdge = "system" | "tone";

export interface AlertStageProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * The shared measure for a request and its composer: same width, 10px apart. It also
 * establishes the size container the alert queries, so the hanging indent releases in a
 * narrow column rather than at a viewport width.
 */
export function AlertStage({ className, ...props }: AlertStageProps) {
  return <div {...props} className={cx(alert().stage, className)} />;
}

export interface AlertProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** One line, beside the tone icon. */
  title: ReactNode;
  /** 16px, in the alert's tone. */
  icon?: ReactNode;
  /** A small tag at the right of the head, e.g. "Permission". */
  kicker?: ReactNode;
  /** Previous / next controls at the right of the head. Replaces `kicker`'s position. */
  pager?: ReactNode;
  /**
   * `tonal` is the tonal-button wash at card scale over an opaque base, so graph lines never
   * run behind the words. `glass` is the package's own glass card, unmodified.
   */
  material?: AlertMaterial;
  /** One tone = one existing token set. It supplies fill, glow and ink — never the edge. */
  tone?: AlertTone;
  /** The system's neutral hairline is the default. A tone edge reads as two edges. */
  edge?: AlertEdge;
  glow?: boolean;
  /** One-line reason, under the title's text axis. */
  lede?: ReactNode;
  /** The command or coordinate, in a Mono chip. */
  command?: ReactNode;
  /**
   * The action row, left to right on the title's axis. The last child is right-aligned, so
   * `<Deny /><Clarify /><Allow />` reads exactly as the approved permission alert does.
   */
  actions?: ReactNode;
  /** Stacked answer rows. Their boxes span the card; their labels keep the title's axis. */
  choices?: ReactNode;
  children?: ReactNode;
}

/**
 * 06 / 07 · Alert. One anatomy, one material, one tone. Temporary, not an info card: it sits
 * directly above the composer at the composer's width.
 *
 * Approved members, locked 2026-09-20:
 * - permission — `material="tonal" tone="progress" edge="system" glow`
 * - question   — `material="glass" tone="none"`
 * Every other combination is available and unapproved.
 */
export function Alert({
  title, icon, kicker, pager,
  material = "tonal", tone = "none", edge = "system", glow = true,
  lede, command, actions, choices, children,
  className, ...props
}: AlertProps) {
  const styles = alert({ material, tone, edge, glow });
  const hasBody = lede != null || command != null || actions != null || choices != null || children != null;
  return (
    <section {...props} data-alert-material={material} data-alert-tone={tone}
      className={cx(material === "glass" && card({ variant: "glass" }), styles.root, className)}>
      <header className={styles.head}>
        {icon != null && <span className={styles.icon} aria-hidden="true">{icon}</span>}
        <h4 className={styles.title}>{title}</h4>
        {pager != null
          ? <div className={styles.pager}>{kicker != null && <span className={styles.kicker}>{kicker}</span>}{pager}</div>
          : kicker != null && <span className={styles.kicker}>{kicker}</span>}
      </header>
      {hasBody && (
        <div className={styles.body}>
          {lede != null && <p className={styles.lede}>{lede}</p>}
          {command != null && <code className={styles.command}>{command}</code>}
          {children}
          {choices != null && <div className={styles.choices} role="group">{choices}</div>}
          {actions != null && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
    </section>
  );
}
