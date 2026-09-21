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

