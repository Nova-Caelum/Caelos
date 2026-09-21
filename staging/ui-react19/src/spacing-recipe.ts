import { defineRecipe } from "@pandacss/dev";

// Approved Atlas 3 relationships (2026-09-19). Control interiors retain their own spacing.
export const spacing = defineRecipe({
  className: 'spacing',
  base: { minWidth: 0, '& > *': { minWidth: 0 } },
  variants: {
    kind: {
      stack: { display: 'flex', flexDirection: 'column', gap: 'var(--sys-space-4)' },
      fields: { display: 'flex', flexDirection: 'column', gap: 'var(--sys-space-7)' },
      sections: { display: 'flex', flexDirection: 'column', gap: 'var(--sys-space-8)' },
      section: { display: 'flex', flexDirection: 'column', gap: 'var(--sys-space-6)' },
      intro: { display: 'flex', flexDirection: 'column', gap: 'var(--sys-space-2)' },
      cluster: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--sys-space-3)' },
      actions: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--sys-space-3)' },
      grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 'var(--sys-space-7)', alignItems: 'start' },
      inset: { padding: 'var(--sys-space-7)' },
    },
    density: { comfortable: {}, default: {}, compact: {} },
  },
  compoundVariants: [
    // Approved midpoint values derive from the existing scale; no global token renumbering.
    { kind: 'fields', density: 'default', css: { gap: 'calc((var(--sys-space-6) + var(--sys-space-7)) / 2)' } },
    { kind: 'sections', density: 'default', css: { gap: 'calc((var(--sys-space-7) + var(--sys-space-8)) / 2)' } },
    { kind: 'section', density: 'default', css: { gap: 'var(--sys-space-5)' } },
    { kind: 'inset', density: 'default', css: { padding: 'calc((var(--sys-space-6) + var(--sys-space-7)) / 2)' } },
    { kind: 'fields', density: 'compact', css: { gap: 'var(--sys-space-6)' } },
    { kind: 'sections', density: 'compact', css: { gap: 'var(--sys-space-7)' } },
    { kind: 'section', density: 'compact', css: { gap: 'var(--sys-space-4)' } },
    { kind: 'inset', density: 'compact', css: { padding: 'var(--sys-space-6)' } },
  ],
  defaultVariants: { kind: 'stack', density: 'default' },
});
