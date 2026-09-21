import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import "./ResponsiveConversationPreview.css";

/** Review parameters, pending design signoff; these are not production tokens. */
export const conversationWidthReview = {
  lowerThreshold: 640,
  upperThreshold: 1320,
  lowerOuterMargin: 10,
  upperOuterMargin: 64,
  overhangLowerThreshold: 1024,
  overhangUpperThreshold: 1748,
  maximumOverhang: 200,
  maximumComposerWidth: 1220,
} as const;

/** All measurements use the available conversation pane, excluding other panels. */
export function getConversationWidths(availableWidth: number) {
  const p = conversationWidthReview;
  const paneWidth = Math.max(0, availableWidth);
  const progress = Math.min(1, Math.max(0, (paneWidth - p.lowerThreshold) / (p.upperThreshold - p.lowerThreshold)));
  const minimumOuterMargin = p.lowerOuterMargin + (p.upperOuterMargin - p.lowerOuterMargin) * progress;
  const overhangProgress = Math.min(1, Math.max(0, (paneWidth - p.overhangLowerThreshold) / (p.overhangUpperThreshold - p.overhangLowerThreshold)));
  const overhang = p.maximumOverhang * overhangProgress;
  const chatWidth = Math.max(0, Math.min(paneWidth - minimumOuterMargin * 2, p.maximumComposerWidth + p.maximumOverhang * 2));
  const composerWidth = Math.max(0, chatWidth - overhang * 2);
  return { paneWidth, chatWidth, composerWidth, overhang, outerMargin: (paneWidth - chatWidth) / 2, progress };
}

export interface ResponsiveConversationPreviewProps {
  children: ReactNode;
  chatContent?: ReactNode;
  /** Review tools are host-only and are not part of the Composer API. */
  showControls?: boolean;
}

export function ResponsiveConversationPreview({ children, chatContent, showControls = true }: ResponsiveConversationPreviewProps) {
  const pane = useRef<HTMLDivElement>(null);
  const controlId = useId();
  const [requestedWidth, setRequestedWidth] = useState("auto");
  const [paneWidth, setPaneWidth] = useState(0);

  useLayoutEffect(() => {
    const element = pane.current;
    if (!element) return;
    const update = () => setPaneWidth(element.getBoundingClientRect().width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const measure = getConversationWidths(paneWidth);
  const style = {
    width: requestedWidth === "auto" ? "100%" : `${requestedWidth}px`,
    "--review-chat-width": paneWidth ? `${measure.chatWidth}px` : "calc(100% - 20px)",
    "--review-composer-width": paneWidth ? `${measure.composerWidth}px` : "calc(100% - 20px)",
  } as CSSProperties;

  return <section className="nc-conversation-width-review" aria-label="Conversation width preview">
    {showControls && <div className="nc-conversation-width-review-tools">
      <label htmlFor={controlId}>Available conversation pane</label>
      <select id={controlId} value={requestedWidth} onChange={event => setRequestedWidth(event.target.value)}>
        <option value="auto">Fit available space</option>
        {[390, 640, 800, 1024, 1320, 1512, 1748, 1920, 2560].map(width => <option key={width} value={width}>{width}px</option>)}
      </select>
      <output className="nc-conversation-width-review-measure" aria-live="polite">
        Pane {Math.round(measure.paneWidth)} · Chat {Math.round(measure.chatWidth)} · Composer {Math.round(measure.composerWidth)} · Overhang {Math.round(measure.overhang)} / side
      </output>
      <span className="nc-conversation-width-review-note">Review proportions · sizes are capped by the available space.</span>
    </div>}
    <div ref={pane} style={style} className="nc-conversation-width-review-pane" data-review-pane data-review-requested-width={requestedWidth}>
      <div className="nc-conversation-width-review-chat" data-review-chat>{chatContent}</div>
      <div className="nc-conversation-width-review-composer" data-review-composer>{children}</div>
    </div>
  </section>;
}
