// Approved study implementation shared with staging; full Panda recipe conversion is deferred.
import "./header-layout.css";
import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { animate, motion, useMotionValue, useReducedMotion, type MotionStyle } from "motion/react";
import { approvedHeaderMotion } from "../../src/header-layout";
import { Link2 } from "lucide-react";
import { conversationHeader, headerControl } from "../../styled-system/recipes/index.mjs";
import { Avatar, IconButton, type AvatarColor } from "@nova-caelum/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@nova-caelum/ui";
import { Card } from "@nova-caelum/ui";
import { useCaelosTheme } from "@nova-caelum/ui";

const cx = (...values: (string | undefined | false)[]) => values.filter(Boolean).join(" ");

export type ConversationHeaderShape = "capsule" | "rounded";

export interface ConversationParticipant {
  /** Stable React key. Falls back to `name`. */
  id?: string;
  /** Rendered as the avatar monogram and as the roster label once pinned. */
  name: string;
  /** Identity colour; fills the participant's avatar. */
  color?: AvatarColor;
  /** 0-100. `null` is honest unavailable telemetry: a dashed ring, never 0%. */
  contextPercent?: number | null;
  /** One short word for the avatar's accessible name and its native title. */
  status?: string;
  /** The quiet roster mark: a count, `!`, `?`. Empty or omitted renders nothing. */
  mark?: string;
  /**
   * Attention tone on the mark. Defaults to "the mark is not a plain count", which is what
   * the approved study renders: a numeric mark is calm, a symbol is warm.
   */
  attention?: boolean;
  src?: string;
}

export interface ConversationHeaderProps {
  /** The conversation's own title. Truncates at rest and completes on hover. */
  title: string;
  /** A capsule with circular avatars, or a rounded card with square ones. */
  shape: ConversationHeaderShape;
  /** 1 to 6. Beyond 6 the approved composites stop and the last one is reused. */
  participants: ConversationParticipant[];
  /** The narrower endpoint pair (320 / 368 instead of 420 / 468). */
  constrained?: boolean;
  /** Linked project / work item, shown in the subtitle row at every state. */
  linkedWork?: ReactNode;
  /** Keeps the card open while a linked-work preview is up. */
  linkedWorkOpen?: boolean;
  /** Quiet identity line that appears with the split. */
  chatId?: ReactNode;
  /** Contents of the link-project popover. The button renders only when this is given. */
  linkPopover?: ReactNode;
  linkLabel?: string;
  linkIcon?: ReactNode;
  linkOpen?: boolean;
  onLinkOpenChange?: (open: boolean) => void;
  /** Agent detail for a roster avatar. Return `null` to leave that avatar inert. */
  renderParticipantDetail?: (participant: ConversationParticipant, index: number) => ReactNode;
  /** Scopes this header's own popovers so an outside-click never closes its own layers. */
  owner: string;
  /** Controlled roster separation. Omit for internal state. */
  pinned?: boolean;
  onPinnedChange?: (pinned: boolean) => void;
  /** Controlled agent detail, by roster index. Omit for internal state. */
  activeParticipant?: number | null;
  onActiveParticipantChange?: (index: number | null) => void;
  /** Fires when the card widens or narrows (hover, focus, pin, linked-work preview). */
  onExpandedChange?: (expanded: boolean) => void;
  className?: string;
  restAvatarHeight?: number;
  expandedAvatarSize?: number;
  layoutKey?: string;
  splitGap?: number;
  splitCushion?: number;
  splitMin?: number;
  splitMax?: number;
  /** A `conversationHeader` material variant. When set, the glass slot is painted by it alone. */
  material?: "chathead";
}

/**
 * Authored composites: asymmetry and size hierarchy preserved, with at least 8px between
 * avatar boxes before the whole cluster is fitted into the fixed 88 x 76 field.
 */
type Placement = [number, number, "sm" | "md" | "lg"];
const composites: Record<number, Placement[]> = {
  1: [[0, 0, "lg"]],
  2: [[0, 0, "lg"], [48, 22, "md"]],
  3: [[0, 8, "lg"], [48, 0, "sm"], [48, 32, "md"]],
  4: [[0, 12, "lg"], [48, 0, "sm"], [48, 32, "md"], [16, 60, "sm"]],
  5: [[0, 20, "lg"], [48, 0, "md"], [48, 40, "sm"], [8, 68, "sm"], [80, 52, "sm"]],
  6: [[0, 20, "lg"], [48, 0, "md"], [48, 40, "sm"], [8, 68, "sm"], [80, 52, "sm"], [88, 8, "sm"]],
};
const avatarPixels = { sm: 24, md: 32, lg: 40 };
const soloRestAvatarPixels = 64;
/** Roster size tokens, derived from the approved resting compositions. */
const expandedAvatarPixels = {
  large: soloRestAvatarPixels * 0.75,
  medium: avatarPixels.lg,
  small: avatarPixels.md,
};

export interface ContextRingProps {
  shape: ConversationHeaderShape;
  /** 0-100, or `null` for unavailable telemetry (a dashed track). */
  percent?: number | null;
  className?: string;
}

/**
 * The per-agent context meter drawn around an avatar. Semantic colours at the approved
 * 80 / 90 thresholds; an unknown reading is dashed and dim rather than an implied zero.
 */
export function ContextRing({ shape, percent = null, className }: ContextRingProps) {
  const styles = conversationHeader();
  const color =
    percent === null
      ? "var(--il-dim)"
      : percent >= 90
        ? "var(--sys-sem-danger)"
        : percent >= 80
          ? "var(--sys-sem-progress-hover)"
          : "var(--il-muted)";
  const radius = shape === "capsule" ? 22 : 14;
  return (
    <svg className={cx(styles.contextRing, className)} viewBox="0 0 48 48" aria-hidden="true" style={{ color }}>
      <rect x="2" y="2" width="44" height="44" rx={radius} className={styles.contextTrack} />
      <rect
        x="2" y="2" width="44" height="44" rx={radius} pathLength="100"
        strokeDasharray={percent === null ? "2 6" : `${percent} 100`}
        transform="rotate(-90 24 24)"
      />
    </svg>
  );
}

/**
 * The approved Atlas 2 conversation header. One identity: a Yrsa title that completes on
 * hover, a varied-size avatar composite that stays calm from one to six participants, and a
 * click that separates the roster. The host supplies proportional widths and approved
 * interior spacing through the shared layout styles.
 *
 * Presentational and controlled: participants, linked work and the agent detail all arrive as
 * props. The component owns only the interaction state the approved behaviour is made of
 * (hover disclosure, the split clock, the hover-preview-then-pin detail), and every piece of
 * that state can be lifted with the matching `on*Change` pair.
 */
export function ConversationHeader({
  title,
  shape,
  participants,
  constrained = false,
  linkedWork,
  linkedWorkOpen = false,
  chatId,
  linkPopover,
  linkLabel = "Link project or work item",
  linkIcon,
  linkOpen,
  onLinkOpenChange,
  renderParticipantDetail,
  owner,
  pinned,
  onPinnedChange,
  activeParticipant,
  onActiveParticipantChange,
  onExpandedChange,
  className,
  restAvatarHeight,
  expandedAvatarSize,
  layoutKey,
  splitGap = 24,
  splitCushion = 24,
  splitMin = 180,
  splitMax = 560,
  material,
}: ConversationHeaderProps) {
  const styles = conversationHeader({ width: constrained ? "constrained" : "full", material });
  const count = Math.min(6, Math.max(1, participants.length));

  const [narrowViewport, setNarrowViewport] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 600px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(max-width: 600px)");
    const update = () => setNarrowViewport(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const [hovered, setExpanded] = useState(false);
  const [ownPinned, setOwnPinned] = useState(false);
  // Controlled when the value prop is supplied; internal otherwise. The callback always
  // fires, so a host can simply observe the state without having to own it.
  const isPinned = pinned ?? ownPinned;
  const setPinnedState = (next: boolean) => {
    if (pinned === undefined) setOwnPinned(next);
    onPinnedChange?.(next);
  };
  const [ownActive, setOwnActive] = useState<number | null>(null);
  const active = activeParticipant !== undefined ? activeParticipant : ownActive;
  const setActive = (next: number | null) => {
    if (activeParticipant === undefined) setOwnActive(next);
    onActiveParticipantChange?.(next);
  };
  const [ownLinkOpen, setOwnLinkOpen] = useState(false);
  const isLinkOpen = linkOpen ?? ownLinkOpen;
  const setLinkOpen = (next: boolean) => {
    if (linkOpen === undefined) setOwnLinkOpen(next);
    onLinkOpenChange?.(next);
  };

  const detailPinned = useRef(false);
  const detailHoverOpened = useRef(false);
  const detailLeaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const holdDetail = () => clearTimeout(detailLeaveTimer.current);
  const closeDetail = () => {
    holdDetail();
    detailPinned.current = false;
    setActive(null);
  };
  const previewDetail = (index: number) => {
    holdDetail();
    if (!isPinned || detailPinned.current) return;
    detailHoverOpened.current = true;
    setActive(index);
  };
  const leaveDetail = () => {
    holdDetail();
    if (!detailPinned.current) detailLeaveTimer.current = setTimeout(closeDetail, 260);
  };
  const pinDetail = () => {
    holdDetail();
    detailPinned.current = true;
  };
  useEffect(() => {
    if (!isPinned || (active !== null && active >= count)) closeDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPinned, count, active]);
  useEffect(() => () => clearTimeout(detailLeaveTimer.current), []);

  const trigger = useRef<HTMLButtonElement>(null);
  const expanded = hovered || isPinned || linkedWorkOpen;
  const theme = useCaelosTheme();
  const [lineGrowth, setLineGrowth] = useState(0);
  const measure = useRef<HTMLHeadingElement>(null);
  const ellipsisMeasure = useRef<HTMLSpanElement>(null);
  const [prefix, setPrefix] = useState({ end: 0, width: 0, truncated: false });
  const canvas = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const [titleWidths, setTitleWidths] = useState({ rest: 258, open: 306, split: 306 });
  const naturalCopy = useRef<HTMLDivElement>(null);
  const [splitWidth, setSplitWidth] = useState(348);
  const [rosterRight, setRosterRight] = useState(21);
  const clickedMeasure = useRef<HTMLHeadingElement>(null);
  const [clickedGrowth, setClickedGrowth] = useState(0);
  const activeTitleWidth = isPinned ? titleWidths.split : titleWidths.open;

  useEffect(() => {
    onExpandedChange?.(expanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  // Measure the two endpoint layouts, never the card's animated width.
  useLayoutEffect(() => {
    if (!canvas.current || !card.current) return;
    const update = () => {
      const style = getComputedStyle(card.current!);
      const available = canvas.current!.getBoundingClientRect().width;
      const reserved =
        parseFloat(getComputedStyle(card.current!.querySelector('[role="group"]')!).width) +
        parseFloat(style.columnGap) +
        parseFloat(style.paddingLeft) +
        parseFloat(style.paddingRight) +
        parseFloat(style.borderLeftWidth) +
        parseFloat(style.borderRightWidth);
      const width = (name: string) =>
        Math.max(0, Math.min(available, parseFloat(style.getPropertyValue(name))) - reserved);
      const rest = width("--card-rest-width"), open = width("--card-open-width");
      const openWidth = Math.min(available, parseFloat(style.getPropertyValue("--card-open-width")));
      const avatar = expandedAvatarSize ?? 48;
      const field = parseFloat(getComputedStyle(card.current!.querySelector('[role="group"]')!).width);
      const padding = parseFloat(style.paddingLeft) + splitCushion + 2;
      const gap = Math.min(splitGap, Math.max(0, openWidth - avatar - padding - 60));
      const maximum = Math.max(1, Math.min(splitMax, openWidth - avatar - gap - padding));
      const minimum = Math.min(splitMin, maximum);
      const natural = Math.max(0, ...Array.from(naturalCopy.current?.children ?? [], child => child.getBoundingClientRect().width));
      const split = Math.min(maximum, Math.max(minimum, Math.ceil(natural)));
      const bubble = split + padding;
      setRosterRight(openWidth - bubble - gap - avatar / 2 - field / 2 - 1);
      setSplitWidth(bubble);
      setTitleWidths(previous =>
        previous.rest === rest && previous.open === open && previous.split === split ? previous : { rest, open, split },
      );
    };
    const observer = new ResizeObserver(update);
    observer.observe(canvas.current);
    update();
    document.fonts.addEventListener("loadingdone", update);
    return () => { observer.disconnect(); document.fonts.removeEventListener("loadingdone", update); };
  }, [constrained, layoutKey, restAvatarHeight, expandedAvatarSize, splitGap, splitCushion, splitMin, splitMax, title, linkedWork, chatId]);

  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pointerInside = useRef(false);
  const focused = useRef(false);
  const reveal = () => {
    clearTimeout(leaveTimer.current);
    setExpanded(true);
  };
  const dismiss = () => {
    clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => {
      if (!pointerInside.current && !focused.current) setExpanded(false);
    }, 260);
  };
  const conversationTitle = title.trim() || "Untitled conversation";
  // The animated preview is bounded; the clicked title retains the complete text.
  const previewTitle = conversationTitle.length > 512 ? conversationTitle.slice(0,512) + "…" : conversationTitle;
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion || theme.reducedMotion;
  const separation = useMotionValue(0);
  const disclosure = useMotionValue(0);
  /**
   * One clock owns the entire split: surface, roster, and reserved space. The longer roster
   * travel needs a soft launch as well as a soft landing, and a non-bouncy spring preserves
   * velocity when the user reverses mid-flight.
   */
  useEffect(() => {
    const animation = animate(separation, isPinned ? 1 : 0, {
      ...(reducedMotion
        ? { duration: 0 }
        : {
            ...approvedHeaderMotion.split,
          }),
    });
    return () => animation.stop();
  }, [isPinned, reducedMotion, separation]);
  useEffect(() => {
    const animation = animate(disclosure, expanded ? 1 : 0, {
      ...approvedHeaderMotion.disclosure, duration: reducedMotion ? 0 : approvedHeaderMotion.disclosure.duration,
    });
    return () => animation.stop();
  }, [expanded, reducedMotion, disclosure]);

  useEffect(() => {
    if (!isPinned) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as Element;
      if (
        !document.querySelector("[data-agent-file-layer], [data-linked-work-layer]") &&
        !(linkedWorkOpen && target.closest('[role="menu"]')) &&
        !target.closest(`[data-model-owner="${owner}"]`) &&
        !target.closest("[data-atlas-layout-control]") &&
        !canvas.current?.contains(target) &&
        !target.closest(`[data-header-owner="${owner}"]`) &&
        !(active !== null && target.closest('[role="menu"][aria-label^="Permissions:"]'))
      ) {
        setPinnedState(false);
        setExpanded(false);
        setActive(null);
        setLinkOpen(false);
      }
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPinned, owner, active, linkedWorkOpen]);

  const close = () => {
    setPinnedState(false);
    setExpanded(false);
    setActive(null);
    setLinkOpen(false);
    clearTimeout(leaveTimer.current);
  };
  const toggle = () => {
    setPinnedState(!isPinned);
    setActive(null);
    setLinkOpen(false);
  };

  /**
   * Keep identical glyph boxes in the measuring and visible copies so revealing the suffix
   * never reflows the already-visible title.
   */
  const words = Array.from(previewTitle.matchAll(/\S+\s*|\s+/gu), word =>
    Array.from(
      new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(word[0]),
      part => ({ text: part.segment, index: word.index! + part.index }),
    ),
  );
  useLayoutEffect(() => {
    const el = measure.current;
    if (!el) return;
    const update = () => {
      const characters = Array.from(el.querySelectorAll<HTMLElement>("[data-title-char]"));
      if (!characters.length || !ellipsisMeasure.current) return;
      const first = characters[0].getBoundingClientRect();
      const rects = characters.map(char => char.getBoundingClientRect());
      setLineGrowth(Math.min(3 * parseFloat(getComputedStyle(el).lineHeight), Math.max(0, ...rects.map(rect => rect.top - first.top))));
      const truncated = rects.some(
        rect => rect.top > first.top + 2 || rect.right - first.left > titleWidths.rest,
      );
      const limit = titleWidths.rest - ellipsisMeasure.current.getBoundingClientRect().width - 1;
      let end = conversationTitle.length,
        width = rects[rects.length - 1].right - first.left;
      if (truncated) {
        end = 0;
        width = 0;
        for (let i = 0; i < characters.length; i++) {
          const rect = rects[i], char = characters[i];
          if (rect.top > first.top + 2 || rect.right - first.left > limit) break;
          if (char.textContent?.trim()) {
            end = Number(char.dataset.titleChar) + char.textContent.length;
            width = rect.right - first.left;
          }
        }
      }
      setPrefix(previous =>
        previous.end === end && previous.width === width && previous.truncated === truncated
          ? previous
          : { end, width, truncated },
      );
    };
    const observer = new ResizeObserver(update);
    observer.observe(el);
    update();
    document.fonts.addEventListener("loadingdone", update);
    return () => {
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", update);
    };
  }, [conversationTitle, titleWidths.rest, activeTitleWidth, layoutKey]);

  useLayoutEffect(() => {
    const el = clickedMeasure.current;
    if (!el) return;
    const update = () => {
      const line = parseFloat(getComputedStyle(el).lineHeight);
      setClickedGrowth(Math.min(line * 3, Math.max(0, el.getBoundingClientRect().height - line)));
    };
    const observer = new ResizeObserver(update);
    observer.observe(el);
    update();
    document.fonts.addEventListener("loadingdone", update);
    return () => { observer.disconnect(); document.fonts.removeEventListener("loadingdone", update); };
  }, [conversationTitle, titleWidths.split, layoutKey]);

  useEffect(() => () => clearTimeout(leaveTimer.current), []);

  const placements = composites[count];
  const fieldWidth = Math.max(...placements.map(([x, , size]) => x + avatarPixels[size]));
  const fieldHeight = Math.max(...placements.map(([, y, size]) => y + avatarPixels[size]));
  // A solo Avatar fills 64px of the shared participant field.
  const scale = restAvatarHeight !== undefined ? restAvatarHeight / fieldHeight :
    count === 1
      ? soloRestAvatarPixels / avatarPixels.lg
      : Math.min(1, 88 / fieldWidth, 76 / fieldHeight);
  const fieldSlotWidth = fieldWidth * scale;
  const expandedPixels = expandedAvatarSize ?? (
    count === 1
      ? expandedAvatarPixels.large
      : count <= 3
        ? expandedAvatarPixels.medium
        : expandedAvatarPixels.small);
  const rosterPitch = (88 * expandedPixels) / expandedAvatarPixels.medium;

  return (
    <motion.div
      className={cx(styles.canvas, className)}
      data-pinned={isPinned}
      ref={canvas}
      onKeyDown={event => {
        if (event.key === "Escape" && active === null && !isLinkOpen && !linkedWorkOpen) {
          event.stopPropagation();
          close();
          trigger.current?.focus();
        }
      }}
      style={{
        "--split": separation,
        "--reveal": disclosure,
        "--line-growth": `${isPinned ? clickedGrowth : lineGrowth}px`,
        "--hp-split-cushion": `${splitCushion}px`,
        "--hp-roster-right": `${rosterRight}px`,
        "--hp-field-width": `${fieldSlotWidth}px`,
        "--roster-height": `${count * rosterPitch + 96}px`,
        "--title-rest-width": `${titleWidths.rest}px`,
        "--title-open-width": `${activeTitleWidth}px`,
        "--hp-split-width": `${splitWidth}px`,
      } as MotionStyle}
    >
      <div ref={naturalCopy} className="hp-split-measure" aria-hidden="true">
        <h3 className={styles.titleMeasure}>{conversationTitle}</h3>
        <div className={styles.subtitleRow}>{linkedWork}</div>
        {chatId != null && <span className={styles.chatId}>{chatId}</span>}
      </div>
      <div className="hp-clicked-probe" aria-hidden="true"><h3 ref={clickedMeasure} className={styles.titleMeasure} style={{width:titleWidths.split}}>{conversationTitle}</h3></div>
      <h3 ref={measure} className={styles.titleMeasure} aria-hidden="true">
        {words.map((word, i) => (
          <span className={styles.titleWord} key={i}>
            {word.map(char => (
              <span className={styles.titleChar} data-title-char={char.index} key={char.index}>
                {char.text.replace(/ /g, " ")}
              </span>
            ))}
          </span>
        ))}
        <span ref={ellipsisMeasure} className={styles.ellipsisMeasure}>…</span>
      </h3>
      <div
        ref={card}
        className={styles.card}
        data-nc-conversation-card=""
        data-shape={shape}
        data-count={count}
        data-expanded={expanded}
        data-pinned={isPinned}
        data-two-lines={expanded && lineGrowth > 0}
        onPointerEnter={() => { pointerInside.current = true; reveal(); }}
        onPointerLeave={() => { pointerInside.current = false; dismiss(); }}
        onFocus={() => { focused.current = true; reveal(); }}
        onBlur={event => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            focused.current = false;
            dismiss();
          }
        }}
      >
        <div className={styles.surface} aria-hidden="true">
          {material ? <div className={styles.glass} /> : <Card variant="glass" className={styles.glass} />}
        </div>
        <button
          ref={trigger}
          type="button"
          className={styles.trigger}
          aria-expanded={isPinned}
          aria-label={`${isPinned ? "Collapse" : "Expand"} ${conversationTitle}`}
          onClick={toggle}
        />
        <div className={styles.copy}>
          {isPinned ? <h3 className={cx(styles.titleFrame, "hp-clicked-title")} tabIndex={0} aria-label="Conversation title">{conversationTitle}</h3> : <h3 className={styles.titleFrame} aria-label={conversationTitle}>
            <span className={styles.titleText} aria-hidden="true">
              {words.map((word, i) => (
                <span className={styles.titleWord} key={i}>
                  {word.map(char => {
                    const existing = char.index < prefix.end;
                    const visible = existing || expanded;
                    return (
                      <motion.span
                        key={char.index}
                        className={styles.titleChar}
                        data-existing={existing}
                        initial={false}
                        animate={{ opacity: visible ? 1 : 0 }}
                        transition={
                          existing || reducedMotion
                            ? { duration: 0 }
                            : expanded
                              ? approvedHeaderMotion.titleReveal
                              : approvedHeaderMotion.titleCollapse
                        }
                      >
                        {char.text.replace(/ /g, " ")}
                      </motion.span>
                    );
                  })}
                </span>
              ))}
            </span>
            {prefix.truncated && (
              <span className={styles.titleEllipsis} style={{ left: prefix.width + 1 }} aria-hidden="true">…</span>
            )}
          </h3>}
          <div className={styles.subtitleRow}>
            {linkedWork}
            {linkPopover !== undefined && (
              <Popover open={isPinned && isLinkOpen} onOpenChange={setLinkOpen}>
                <PopoverTrigger asChild>
                  <IconButton
                    size="sm"
                    variant="tonal"
                    data-nc-header-control=""
                    className={headerControl({ kind: "link" })}
                    style={{
                      width: 28, height: 28, minHeight: 28,
                      borderRadius: shape === "rounded" ? "var(--sys-radius-sm)" : "var(--sys-radius-full)",
                    }}
                    icon={linkIcon ?? <Link2 size={14} />}
                    disabled={!isPinned}
                    tabIndex={isPinned ? 0 : -1}
                    aria-hidden={!isPinned}
                    label={linkLabel}
                    onContextMenu={event => { event.preventDefault(); setLinkOpen(true); }}
                  />
                </PopoverTrigger>
                <PopoverContent
                  data-header-owner={owner}
                  data-nc-header-control=""
                  className={headerControl({ kind: "linkPopover" })}
                  aria-label={linkLabel}
                  align="start"
                >
                  {linkPopover}
                </PopoverContent>
              </Popover>
            )}
          </div>
          {chatId != null && (
            <span className={styles.chatId} aria-hidden={!isPinned}>{chatId}</span>
          )}
        </div>
        <div className={styles.participantField} role="group" aria-label={`${count} participants`}>
          {placements.map(([x, y, size], index) => {
            const participant = participants[index];
            const pixels = avatarPixels[size];
            const startX = (fieldSlotWidth - fieldWidth * scale) / 2 + (x + pixels / 2) * scale;
            const startY = (76 - fieldHeight * scale) / 2 + (y + pixels / 2) * scale;
            const percent =
              participant.contextPercent === null || participant.contextPercent === undefined
                ? "unknown"
                : `${participant.contextPercent}%`;
            const mark = participant.mark ?? "";
            const attention = participant.attention ?? !/^\d+$/.test(mark);
            const detail = renderParticipantDetail?.(participant, index);
            return (
              <div
                key={participant.id ?? participant.name}
                className={styles.agent}
                style={{
                  "--start-x": `${startX}px`,
                  "--start-y": `${startY}px`,
                  "--end-y":
                    count === 1
                      ? "calc(48px + var(--line-growth) * .5 * var(--reveal))"
                      : `${expandedPixels / 2 + 4 + index * rosterPitch}px`,
                  "--start-scale": (pixels * scale) / avatarPixels.lg,
                  "--end-scale": expandedPixels / avatarPixels.lg,
                } as CSSProperties}
              >
                <Popover
                  open={isPinned && active === index && detail != null}
                  onOpenChange={open => {
                    if (!open) closeDetail();
                    else {
                      detailHoverOpened.current = false;
                      pinDetail();
                      setActive(index);
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={styles.avatarButton}
                      disabled={!isPinned}
                      tabIndex={isPinned ? 0 : -1}
                      onPointerEnter={event => { if (event.pointerType !== "touch") previewDetail(index); }}
                      onPointerLeave={leaveDetail}
                      onClick={event => {
                        // Pin a hover preview instead of letting the trigger toggle it shut.
                        event.preventDefault();
                        if (active === index && detailPinned.current) closeDetail();
                        else {
                          if (active !== index) detailHoverOpened.current = false;
                          pinDetail();
                          setActive(index);
                        }
                      }}
                      aria-label={`${participant.name}, context ${percent}, ${participant.status ?? ""}`}
                      title={`${participant.name} · Context ${percent} · ${participant.status ?? ""}`}
                    >
                      <Avatar
                        name={participant.name}
                        src={participant.src}
                        color={participant.color}
                        kind={shape === "rounded" ? "agent" : "person"}
                        size="lg"
                      />
                      <span className={styles.contextDecoration} aria-hidden="true">
                        <ContextRing shape={shape} percent={participant.contextPercent ?? null} />
                      </span>
                      <span className={styles.expandedDecoration} aria-hidden="true">
                        {mark && (
                          <span className={styles.statusBadge} data-attention={attention}>{mark}</span>
                        )}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    data-header-owner={owner}
                    data-nc-header-control=""
                    data-nc-detail-host=""
                    data-layout="profile"
                    className={headerControl({ kind: "detailPopover" })}
                    aria-label={`${participant.name} details`}
                    side={narrowViewport ? "bottom" : "right"}
                    align={narrowViewport ? "end" : "start"}
                    sideOffset={16}
                    collisionPadding={12}
                    onPointerEnter={holdDetail}
                    onPointerLeave={leaveDetail}
                    onPointerDownCapture={pinDetail}
                    onFocusCapture={pinDetail}
                    onOpenAutoFocus={event => { if (detailHoverOpened.current) event.preventDefault(); }}
                    onInteractOutside={event => {
                      if (
                        document.querySelector("[data-agent-file-layer]") ||
                        (event.target as Element)?.closest(
                          `[data-atlas-layout-control], [data-header-owner], [data-model-owner="${owner}"]`,
                        )
                      )
                        event.preventDefault();
                    }}
                    onCloseAutoFocus={event => {
                      if (!isPinned || detailHoverOpened.current) event.preventDefault();
                    }}
                  >
                    {detail}
                  </PopoverContent>
                </Popover>
                <span className={styles.agentName} aria-hidden={!isPinned}>{participant.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
