import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { agentAvatarSizes, approvedHeaderLayout as approved } from "../../src/header-layout";
import { ConversationHeader, type ConversationHeaderProps } from "./StudyHeader";
import { conversationHeader, typography } from "../../styled-system/recipes/index.mjs";
import "./approved-header.css";

/**
 * The approved header (geometry and motion locked 2026-09-20, 23:19 screenshot), following the
 * actual Composer in its pane. Ported from the staging adapter so the package owns it.
 *
 * `material` selects the painted layer. "chathead" (nc-chathead, the default) is a
 * `conversationHeader` recipe variant. "composer" is the approved study's Composer-material
 * proposal; any other value leaves the glass layer to a host-supplied rule scoped by
 * `[data-material=<value>]` — which is how the Foundry's Create tab previews new materials
 * without touching the approved geometry.
 *
 * Content behind the header: when the pane holds a `[data-conversation-scroll]` scroller with a
 * `[data-occlusion-sentinel]` spanning the top of its content, the header drives
 * `--nc-occluded` from 0 (nothing behind) to 1 (content behind). Without them it stays
 * undriven, which the material reads as 1.
 */
export function ApprovedChatHeader({ material = "chathead", ...props }: Omit<ConversationHeaderProps, "material"> & { material?: string }) {
  const slot = useRef<HTMLDivElement>(null);
  const recipeMaterial = (conversationHeader.variantMap.material as string[]).includes(material)
    ? (material as ConversationHeaderProps["material"])
    : undefined;

  useLayoutEffect(() => {
    const el = slot.current;
    const pane = el?.closest<HTMLElement>("[data-conversation-pane]");
    const scroller = pane?.querySelector<HTMLElement>("[data-conversation-scroll]");
    const sentinel = pane?.querySelector<HTMLElement>("[data-occlusion-sentinel]");
    if (!el || !scroller || !sentinel) return;
    const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);
    let io: IntersectionObserver | undefined;
    let edge = -1;
    // The observer's root is the scroller with its top cut back to the glass's resting bottom edge,
    // so the sentinel's visible fraction falls from 1 to 0 exactly as content slides behind the glass.
    const connect = () => {
      const card = el.querySelector(".caelos-conversation-header__card");
      const rest = parseFloat(getComputedStyle(el).getPropertyValue("--hp-height"));
      if (!card || !rest) return;
      // Measured from the card's top, so a reveal in progress never moves the edge.
      const next = Math.max(0, Math.round(card.getBoundingClientRect().top + rest - scroller.getBoundingClientRect().top));
      if (next === edge) return;
      edge = next;
      io?.disconnect();
      io = new IntersectionObserver(
        // One batch can carry several readings for the sentinel (e.g. a scroll-to-bottom during mount); the last is current.
        (entries) => el.style.setProperty("--nc-occluded", (1 - entries[entries.length - 1].intersectionRatio).toFixed(3)),
        { root: scroller, rootMargin: `-${edge}px 0px 0px 0px`, threshold: thresholds },
      );
      io.observe(sentinel);
    };
    const resize = new ResizeObserver(connect);
    resize.observe(scroller);
    resize.observe(el);
    connect();
    return () => { io?.disconnect(); resize.disconnect(); el.style.removeProperty("--nc-occluded"); };
  }, []);
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
    <ConversationHeader {...props} material={recipeMaterial} className={`hp-header ${props.className ?? ""}`}
      restAvatarHeight={restAvatar} expandedAvatarSize={expandedAvatar}
      splitGap={approved.split.gap} splitCushion={approved.split.cushion}
      splitMin={approved.split.minText} splitMax={approved.split.maxText}
      layoutKey={`${width}/${height}/${props.participants.length}/${metrics.titleLine}`} />
  </div>;
}
