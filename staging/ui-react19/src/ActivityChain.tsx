import { useId, useState, type ReactNode } from "react";
import { Bot, Check, ChevronDown, ChevronRight, Dot, Flame, Wrench, Zap } from "lucide-react";
import { activity } from "../styled-system/recipes/index.mjs";
import { Surface } from "./foundation";
import { RippleLoader } from "./RippleLoader";
import { useCaelosTheme } from "./theme";
import type { MessageSpeaker } from "./ConversationMessage";

const cx = (...values: (string | undefined | false)[]) => values.filter(Boolean).join(" ");

/** The approved icon glossary, enforced rather than restated at each call site. */
export type ActivityStepKind = "thinking" | "action" | "tool" | "agent";
const STEP_ICON = { thinking: Zap, action: Flame, tool: Wrench, agent: Bot } as const;

export interface ActivityStep {
  /** Stable key and detail-disclosure identity. */
  id: string;
  kind: ActivityStepKind;
  /** One operational summary line. Not a transcript of private reasoning. */
  title: ReactNode;
  /** Revealed under the row when it is open. */
  detail?: ReactNode;
  /** `text` is a quiet paragraph, `code` a plain plane one tier up, `embed` any element. */
  detailKind?: "text" | "code" | "embed";
}

export interface ActivityChainProps {
  steps: ActivityStep[];
  /** Index of the live step. `-1` (default) means every step has completed. */
  activeIndex?: number;
  /** The agent's name above its own chain in a multi-agent turn. */
  agentName?: ReactNode;
  /** Neutral while working; the speaker's accent once response text starts. */
  speaker?: MessageSpeaker | "neutral";
  /** Count summary and collapsed history appear at this many steps. */
  summaryThreshold?: number;
  /** Controlled summary expansion. Omit for internal state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Controlled detail disclosure, by step id. Omit for internal state. */
  openStepId?: string | null;
  onOpenStepChange?: (id: string | null) => void;
  /** Accessible status text on the live step's loader. */
  statusLabel?: string;
  /** Tier for a `code` detail plane: one above whatever holds this chain. */
  codeSurface?: "elevated" | "elevated-2" | "top";
  className?: string;
}

/**
 * 01 · Activity rows and the step chain. The status mark and the chevron sit beside the label;
 * the count summary appears only at three or more steps; a completed step is a check and the
 * live step is the small inline loader. Presentational: the host supplies steps and callbacks.
 */
export function ActivityChain({
  steps,
  activeIndex = -1,
  agentName,
  speaker = "neutral",
  summaryThreshold = 3,
  open,
  onOpenChange,
  openStepId,
  onOpenStepChange,
  statusLabel = "Working",
  codeSurface = "elevated",
  className,
}: ActivityChainProps) {
  const id = useId();
  const { reducedMotion } = useCaelosTheme();
  const [ownOpen, setOwnOpen] = useState(false);
  const [ownStep, setOwnStep] = useState<string | null>(null);
  const isOpen = open ?? ownOpen;
  const activeStep = openStepId !== undefined ? openStepId : ownStep;
  const setOpen = (next: boolean) => (onOpenChange ? onOpenChange(next) : setOwnOpen(next));
  const setStep = (next: string | null) =>
    onOpenStepChange ? onOpenStepChange(next) : setOwnStep(next);

  const hasSummary = steps.length >= summaryThreshold;
  const complete = activeIndex < 0;
  // Collapsed, only the newest row stands in for the history behind it.
  const visible = isOpen || !hasSummary ? steps : steps.slice(-1);
  // A single row with no count summary carries a leading dot instead.
  const anchored = !hasSummary;
  const styles = activity({ summary: hasSummary, anchored, speaker });

  return (
    <div className={cx(styles.root, className)} data-activity="">
      {agentName != null && <div className={styles.agentName} data-activity-agent="" data-speaker={speaker}>{agentName}</div>}
      {hasSummary && (
        <button type="button" className={styles.summary} aria-expanded={isOpen} aria-controls={id}
          onClick={() => setOpen(!isOpen)}>
          <Dot size={18} aria-hidden="true" />
          <span>
            {steps.length} {steps.length === 1 ? "step" : "steps"}
            {complete ? " completed" : ""}
          </span>
          <ChevronDown size={14} className={styles.summaryChevron} data-open={isOpen} />
        </button>
      )}
      <div id={id} className={styles.chain} data-summary={hasSummary}>
        {visible.map(step => {
          const index = steps.indexOf(step);
          const live = index === activeIndex;
          const detailOpen = activeStep === step.id;
          const Icon = STEP_ICON[step.kind];
          return (
            <div className={styles.step} data-activity-step="" data-active={live} key={step.id}>
              <div className={styles.stepBody}>
                <button type="button" className={styles.stepTrigger} aria-expanded={detailOpen}
                  onClick={() => setStep(detailOpen ? null : step.id)}>
                  {anchored && (
                    <span className={styles.stepAnchor} aria-hidden="true">
                      {index === 0 && <Dot size={18} />}
                    </span>
                  )}
                  <span className={styles.stepLabel}>
                    <Icon size={18} aria-hidden="true" />
                    <span>{step.title}</span>
                  </span>
                  <span className={styles.stepStatus}>
                    {live
                      ? <RippleLoader paused={reducedMotion} label={statusLabel} />
                      : <Check size={12} aria-label="Completed" />}
                  </span>
                  <ChevronRight size={12} className={styles.stepChevron} data-open={detailOpen} />
                </button>
                {detailOpen && step.detail != null && (
                  step.detailKind === "code"
                    ? <Surface layer={codeSurface} texture="plain" className={styles.detailCode}>
                        <code>{step.detail}</code>
                      </Surface>
                    : step.detailKind === "embed"
                      ? <div className={styles.detailEmbed}>{step.detail}</div>
                      : <p className={styles.detailText}>{step.detail}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
