import React, { createContext, forwardRef, useContext, useId, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { spacing } from "../styled-system/recipes/index.mjs";

/** Width and content length never silently change density. */
export type Density = "compact" | "default" | "comfortable";
const DensityContext = createContext<Density>("default");
/** Optional subtree override. Omit this provider to use approved Default spacing. */
export const SpacingDensity = DensityContext.Provider;

export type SpacingLayoutProps = ComponentPropsWithoutRef<"div">;
type Kind = "stack" | "fields" | "sections" | "cluster" | "actions" | "grid" | "inset";
const cx = (...values: (string | undefined)[]) => values.filter(Boolean).join(" ");

function layout(kind: Kind, name: string) {
  const Component = forwardRef<HTMLDivElement, SpacingLayoutProps>(function Layout({ className, ...props }, ref) {
    const density = useContext(DensityContext);
    return <div {...props} ref={ref} data-relation={kind} data-spacing-density={density} className={cx(spacing({ kind, density }), className)} />;
  });
  Component.displayName = name;
  return Component;
}

/** Small generic group. Prefer the named relationship when one applies. */
export const Stack = layout("stack", "Stack");
/** Complete fields including labels/help/errors; layout only, not a fieldset. */
export const FieldGroup = layout("fields", "FieldGroup");
export const SectionStack = layout("sections", "SectionStack");
export const InlineCluster = layout("cluster", "InlineCluster");
export const ActionRow = layout("actions", "ActionRow");
/** Content-driven columns; can shrink below 240px in narrow panes. */
export const ResponsiveGrid = layout("grid", "ResponsiveGrid");
/** Apply once at the surface edge; avoid stacking with existing surface padding. */
export const Inset = layout("inset", "Inset");

export interface SectionProps extends Omit<ComponentPropsWithoutRef<"section">, "title"> {
  title: ReactNode;
  description?: ReactNode;
  level?: 2 | 3 | 4;
}

/** Operational signpost: Plex/inherited UI type, with one owner for intro spacing. */
export const Section = forwardRef<HTMLElement, SectionProps>(function Section({ title, description, children, level = 2, className, ...props }, ref) {
  const id = useId();
  const density = useContext(DensityContext);
  const Tag = `h${level}` as "h2" | "h3" | "h4";
  return <section aria-labelledby={id} {...props} ref={ref} data-relation="section" data-spacing-density={density} className={cx(spacing({ kind: "section", density }), className)}>
    <header className={spacing({ kind: "intro", density })} data-relation="intro">
      <Tag id={id} style={{ margin: 0, font: "inherit", fontWeight: 600 }}>{title}</Tag>
      {description != null && <p style={{ margin: 0, color: "var(--il-muted)" }}>{description}</p>}
    </header>
    {children}
  </section>;
});
