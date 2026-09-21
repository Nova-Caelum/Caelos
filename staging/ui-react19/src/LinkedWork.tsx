import React, { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Anchor } from "@radix-ui/react-popover";
import { headerControl, linkedWork } from "../styled-system/recipes/index.mjs";
import { Button } from "./components";
import { Popover, PopoverContent, PopoverTrigger, ResizeHandle } from "./foundation";
import { Drawer } from "./overlays";

const cx = (...values: (string | undefined | false)[]) => values.filter(Boolean).join(" ");

export interface LinkedWorkLinksProps extends React.HTMLAttributes<HTMLSpanElement> {}

/**
 * The quiet row of linked-work words in the conversation header's subtitle. The header's copy
 * column is pointer-inert so the title never eats a click; this wrapper opts its links back in.
 */
export function LinkedWorkLinks({ className, ...props }: LinkedWorkLinksProps) {
  const styles = linkedWork();
  return <span {...props} className={cx(styles.links, className)} />;
}

/** The middot between a project and its work item. */
export function LinkedWorkDivider() {
  const styles = linkedWork();
  return <span className={styles.divider} aria-hidden="true">·</span>;
}

export interface LinkedWorkTriggerProps {
  /** The word itself — a project name, a module, a task. */
  label: ReactNode;
  /** Spoken name, e.g. `Preview project: Caelos Console`. */
  ariaLabel: string;
  /** The preview body. Everything inside the popover belongs to the host. */
  children: ReactNode;
  /** Scopes the preview so an outside-click on it never closes the header. */
  owner: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Use the shared Task Graph drawer for application detail views. */
  presentation?: "popover" | "drawer";
  drawerTitle?: string;
  /** Preview width in px. Omit to let the resize grip own it from 500. */
  width?: number;
  onWidthChange?: (width: number) => void;
  /** Turns the resize grip off. */
  resizable?: boolean;
  /** Keeps the preview open through a host dialog or menu of its own. */
  onInteractOutside?: (event: Event) => void;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  className?: string;
}

/**
 * The approved Atlas 2 linked-work trigger and preview.
 *
 * The preview does not hang off the word — it hangs off the CONVERSATION CARD. A virtual
 * Radix anchor is pointed at the nearest `[data-nc-conversation-card]` ancestor and tracked
 * every frame while the preview is open, so the surface stays attached to the card's bottom
 * edge through the split, the hover widening and a window resize alike. Collision avoidance
 * is off and the horizontal offset is measured instead, which is what keeps the join at
 * roughly half a pixel rather than letting Radix flip the surface somewhere else.
 *
 * Presentational: the body is `children`. The Atlas's own Task Graph body stays in the Atlas.
 */
export function LinkedWorkTrigger({
  label,
  ariaLabel,
  children,
  owner,
  open,
  onOpenChange,
  presentation = "popover",
  drawerTitle = ariaLabel,
  width,
  onWidthChange,
  resizable = true,
  onInteractOutside,
  onEscapeKeyDown,
  className,
}: LinkedWorkTriggerProps) {
  const styles = linkedWork();
  const [ownOpen, setOwnOpen] = useState(false);
  // Controlled when `open` is supplied; internal otherwise. The callback always fires: the
  // approved study passes it as a NOTIFICATION (the header widens while a preview is up) and
  // keeps the open state inside the preview. Treating the callback alone as "controlled"
  // would leave the preview permanently shut.
  const isOpen = open ?? ownOpen;
  const setOpen = (next: boolean) => { if (open === undefined) setOwnOpen(next); onOpenChange?.(next); };
  const [ownWidth, setOwnWidth] = useState(500);
  const previewWidth = width ?? ownWidth;
  const setWidth = (next: number) => { if (width === undefined) setOwnWidth(next); onWidthChange?.(next); };
  const cardAnchor = useRef<HTMLElement | null>(null);
  const [placement, setPlacement] = useState({ offset: 0, height: 720 });

  useLayoutEffect(() => {
    if (!isOpen || presentation === "drawer") return;
    let frame = 0;
    const track = () => {
      const rect = cardAnchor.current?.getBoundingClientRect();
      if (rect) {
        const visibleWidth = Math.min(previewWidth, window.innerWidth - 24);
        const offset =
          Math.max(12, Math.min(rect.left, window.innerWidth - visibleWidth - 12)) - rect.left;
        const height = Math.max(0, Math.min(720, window.innerHeight - rect.bottom - 12));
        setPlacement(previous =>
          previous.offset === offset && previous.height === height
            ? previous
            : { offset, height },
        );
      }
      frame = requestAnimationFrame(track);
    };
    track();
    return () => cancelAnimationFrame(frame);
  }, [isOpen, previewWidth, presentation]);

  if (presentation === "drawer") {
    return <>
      <Button
        variant="text"
        size="sm"
        data-nc-header-control=""
        className={cx(headerControl({ kind: "linkedWorkTrigger" }), className)}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setOpen(true)}
      >
        <span className={styles.triggerLabel}>{label}</span>
      </Button>
      <Drawer
        open={isOpen}
        onOpenChange={setOpen}
        onEscapeKeyDown={event => {
          // Dismiss this layer without sending the same Escape to the header beneath it.
          event.stopPropagation();
          onEscapeKeyDown?.(event);
        }}
        title={drawerTitle}
        closeLabel={`Close ${drawerTitle.toLowerCase()} drawer`}
        bodyLabel={`${drawerTitle} details`}
      >
        <div data-header-owner={owner} data-linked-work-layer="">
          {children}
        </div>
      </Drawer>
    </>;
  }

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="text"
          size="sm"
          data-nc-header-control=""
          className={cx(headerControl({ kind: "linkedWorkTrigger" }), className)}
          aria-label={ariaLabel}
          onClick={event => {
            cardAnchor.current = event.currentTarget.closest(
              "[data-nc-conversation-card]",
            ) as HTMLElement;
          }}
        >
          <span className={styles.triggerLabel}>{label}</span>
        </Button>
      </PopoverTrigger>
      {/*
        Radix types `virtualRef` as never-null; the approved behaviour is a ref that is null
        until the trigger is first clicked, and Radix only reads it while the preview is open.
        The cast preserves that behaviour rather than inventing a placeholder anchor.
      */}
      <Anchor virtualRef={cardAnchor as React.RefObject<{ getBoundingClientRect(): DOMRect }>} />
      <PopoverContent
        data-header-owner={owner}
        data-linked-work-preview
        data-nc-header-control=""
        className={headerControl({ kind: "linkedWorkPopover" })}
        aria-label={ariaLabel}
        side="bottom"
        align="start"
        sideOffset={0}
        updatePositionStrategy="always"
        avoidCollisions={false}
        alignOffset={placement.offset}
        style={{ width: previewWidth, maxWidth: "calc(100vw - 24px)", maxHeight: placement.height }}
        onInteractOutside={onInteractOutside}
        onEscapeKeyDown={onEscapeKeyDown}
      >
        {children}
        {resizable && (
          <ResizeHandle
            data-nc-header-control=""
            className={headerControl({ kind: "linkedWorkResize" })}
            label="Resize linked work preview"
            value={previewWidth}
            min={340}
            max={Math.max(340, Math.min(760, window.innerWidth - 32))}
            onValueChange={setWidth}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
