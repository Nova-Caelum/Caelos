import React from "react";
import { ArrowLeft, ArrowRight, PanelRight } from "lucide-react";
import { IconButton, type IconButtonProps } from "./components";
import { InlineCluster } from "./spacing";
import { chatNavigationControl } from "../styled-system/recipes/index.mjs";

export interface ChatHistoryNavigationProps {
  onBack: () => void;
  onForward: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

/** Host supplies history; the shared component owns the paired tonal controls and spacing. */
export function ChatHistoryNavigation({ onBack, onForward, canGoBack = true, canGoForward = true }: ChatHistoryNavigationProps) {
  return <InlineCluster role="group" aria-label="Conversation navigation" data-chat-navigation="">
    <IconButton variant="tonal" className={chatNavigationControl()} label="Go back" icon={<ArrowLeft />} onClick={onBack} disabled={!canGoBack} />
    <IconButton variant="tonal" className={chatNavigationControl()} label="Go forward" icon={<ArrowRight />} onClick={onForward} disabled={!canGoForward} />
  </InlineCluster>;
}

export interface RightPanelToggleProps extends Omit<IconButtonProps, "label" | "icon" | "variant" | "onClick"> {
  open: boolean;
  onToggle: () => void;
}

export function RightPanelToggle({ open, onToggle, className, ...props }: RightPanelToggleProps) {
  return <IconButton {...props} variant="tonal" className={[chatNavigationControl(), className].filter(Boolean).join(" ")}
    label={open ? "Close right side panel" : "Open right side panel"} icon={<PanelRight />} aria-expanded={open} onClick={onToggle} />;
}
