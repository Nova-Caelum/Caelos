import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import "./ResponsiveConversationPreview.css";

import { getConversationWidths } from "./conversation-widths";
export { getConversationWidths, conversationWidthReview } from "./conversation-widths";

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
