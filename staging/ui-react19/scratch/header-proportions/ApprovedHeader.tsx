import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { agentAvatarSizes, approvedHeaderLayout as approved } from "../../src/header-layout";
import { ConversationHeader, type ConversationHeaderProps } from "./StudyHeader";
import { conversationHeader, typography } from "../../styled-system/recipes/index.mjs";
import "./approved-header.css";

/**
 * The approved header (geometry and motion locked 2026-09-20, 23:19 screenshot), following the
 * actual Composer in its pane. Ported from the staging adapter so the package owns it.
 *
 * `material` selects the painted layer: "composer" is the approved study's Composer-material
 * proposal; any other value leaves the glass layer to a host-supplied rule scoped by
 * `[data-material=<value>]` — which is how the Foundry's Create tab previews new materials
 * without touching the approved geometry.
 */
export function ApprovedChatHeader({ material = "composer", ...props }: ConversationHeaderProps & { material?: string }) {
  const slot = useRef<HTMLDivElement>(null);
  const titleProbe = useRef<HTMLSpanElement>(null);
  const subtitleProbe = useRef<HTMLSpanElement>(null);
  const spaceProbe = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(780);
  const [metrics, setMetrics] = useState({
    titleLine: 24, subtitleLine: 18,
    space: [0, 3, 6, 9, 12, 15, 18, 24, 30], font: {} as CSSProperties,
  });

  useLayoutEffect(() => {
    const pane = slot.current?.closest<HTMLElement>("[data-conversation-pane]");
    if (!pane) return;
    let composer: Element | null = null;
    const measure = () => {
      const next = pane.querySelector(".nova-chat-composer .nc-composer-shell");
      if (next !== composer) {
        if (composer) observer.unobserve(composer);
        composer = next;
        if (composer) observer.observe(composer);
      }
      // Read-only conversations have no Composer: use its existing 780px cap.
      const available = slot.current?.parentElement?.clientWidth ?? pane.clientWidth;
      setWidth(composer?.getBoundingClientRect().width ?? Math.min(780, Math.max(0, available - 30)));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(pane);
    const mutations = new MutationObserver(measure);
    mutations.observe(pane, { childList: true, subtree: true });
    measure();
    return () => { observer.disconnect(); mutations.disconnect(); };
  }, []);

  useLayoutEffect(() => {
    const measure = () => {
      if (!titleProbe.current || !subtitleProbe.current || !spaceProbe.current) return;
      const title = getComputedStyle(titleProbe.current);
      const font: Record<string, string> = {};
      for (const property of ["font-family", "font-size", "font-weight", "line-height", "letter-spacing", "word-spacing", "text-transform"]) {
        font[`--hp-${property}`] = title.getPropertyValue(property);
      }
      setMetrics({
        titleLine: parseFloat(title.lineHeight),
        subtitleLine: parseFloat(getComputedStyle(subtitleProbe.current).lineHeight),
        space: [0, ...Array.from(spaceProbe.current.children, child => parseFloat(getComputedStyle(child).width))],
        font: font as CSSProperties,
      });
    };
    measure();
    document.fonts.addEventListener("loadingdone", measure);
    return () => document.fonts.removeEventListener("loadingdone", measure);
  }, []);

  const tier = approved.avatarTiers[props.participants.length <= 1 ? 0 : props.participants.length <= 3 ? 1 : 2];
  const restAvatar = agentAvatarSizes[tier.rest];
  const expandedAvatar = typeof tier.expanded === "number" ? tier.expanded : agentAvatarSizes[tier.expanded];
  const copyHeight = metrics.titleLine + metrics.space[2] + metrics.subtitleLine;
  const block = metrics.space[approved.spacing.block];
  const height = Math.max(copyHeight, restAvatar) + 2 * block + 2;
  const radius = height / 2;
  const clearance = (contentHeight: number) => (radius - Math.sqrt(Math.max(0, radius ** 2 - (contentHeight / 2) ** 2))) * approved.curveCompensation / 100;
  const style = {
    width, ...metrics.font,
    "--hp-rest": `${width * approved.restPercent / 100}px`,
    "--hp-open": `${width * approved.expandedPercent / 100}px`,
    "--hp-height": `${height}px`,
    "--object-inset-block": `${block}px`,
    "--object-inset-leading": `${metrics.space[approved.spacing.leading] + clearance(copyHeight)}px`,
    "--object-inset-trailing": `${metrics.space[approved.spacing.trailing] + clearance(restAvatar)}px`,
    "--object-content-gap": `${metrics.space[approved.spacing.gap]}px`,
    "--hp-copy-height": `${copyHeight}px`,
    "--hp-title-line": `${metrics.titleLine}px`,
  } as CSSProperties;

  return <div ref={slot} className="hp-header-slot" data-material={material} data-staging-header="approved" style={style}>
    <div aria-hidden="true" style={{ position: "absolute", visibility: "hidden", pointerEvents: "none", width: 200 }}>
      <span ref={titleProbe} className={conversationHeader().titleFrame}>Typography</span>
      <span ref={subtitleProbe} className={typography({ role: "small" })}>Linked work</span>
      <span ref={spaceProbe}>{[1, 2, 3, 4, 5, 6, 7, 8].map(n => <span key={n} style={{ display: "inline-block", width: `var(--sys-space-${n})` }} />)}</span>
    </div>
    <ConversationHeader {...props} className={`hp-header ${props.className ?? ""}`}
      restAvatarHeight={restAvatar} expandedAvatarSize={expandedAvatar}
      splitGap={approved.split.gap} splitCushion={approved.split.cushion}
      splitMin={approved.split.minText} splitMax={approved.split.maxText}
      layoutKey={`${width}/${height}/${props.participants.length}/${metrics.titleLine}`} />
  </div>;
}
