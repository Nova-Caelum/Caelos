/** Approved geometry and motion, 2026-09-20. Material/color remain open for review.
 * The Atlas study implementation is also used by staging; full Panda conversion is pending.
 */
export const agentAvatarSizes = { xl: 48, xxl: 52 } as const;

export const approvedHeaderLayout = {
  restPercent: 45,
  expandedPercent: 56,
  density: 'compact',
  matchComposerHeight: false,
  split: { gap: 30, cushion: 60, minText: 280, maxText: 460 },
  // Indices into the existing --sys-space-N scale, not a replacement scale.
  spacing: { block: 4, leading: 7, trailing: 4, gap: 7 },
  curveCompensation: 10,
  avatarTiers: [
    { rest: 'xxl', expanded: 'xl' },
    { rest: 'xxl', expanded: 40 },
    { rest: 'xxl', expanded: 32 },
  ],
} as const;

export const approvedHeaderMotion = {
  split: { type: 'spring', stiffness: 280, damping: 34, mass: 1, restDelta: 0.001, restSpeed: 0.01 },
  disclosure: { duration: 0.26, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  titleReveal: { duration: 0.34, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  titleCollapse: { duration: 0.13, delay: 0 },
} as const;
