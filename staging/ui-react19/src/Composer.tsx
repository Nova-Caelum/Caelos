import type { ReactNode, ReactElement, Ref } from "react";
import {
  ComposerInternal,
  ComposerChoiceInternal,
  PermissionControlInternal,
} from "./composer-internal";
import type { ComposerCommand, ComposerAgent } from "./composer-commands";
export type { ComposerCommand, ComposerAgent } from "./composer-commands";
export type ReplyFormat = "text" | "voice" | "both";
export type ComposerAddition =
  | "File or folder"
  | "Agent"
  | "Goal"
  | "Session instruction";
export interface ComposerMessage {
  text: string;
  replyFormat: ReplyFormat;
  model: string;
  reasoning: string;
  goal?: string;
  instruction?: string;
}
export interface ComposerProps {
  /** Gallery-only proposal. Omit to preserve the approved production behavior. */
  experimentalAgentSettings?: {
    permissions: string[];
    values: Record<string, { model: string; reasoning: string; permission: string; replyFormat: ReplyFormat }>;
    onChange: (agentId: string, field: "model" | "reasoning" | "permission" | "replyFormat", value: string) => void;
  };
  /** Host integrations can stop a response and submit attachments without text. */
  sending?: boolean;
  onStop?: () => void;
  allowEmptySubmit?: boolean;
  sendDisabled?: boolean;
  showReplyFormat?: boolean;
  additions?: ComposerAddition[];
  additionLabels?: Partial<Record<ComposerAddition, string>>;
  textareaRef?: Ref<HTMLTextAreaElement>;
  textareaTestId?: string;
  value: string;
  onValueChange: (value: string) => void;
  onSend: (message: ComposerMessage) => void;
  model: string;
  models: string[];
  onModelChange: (model: string) => void;
  reasoning: string;
  reasoningLevels: string[];
  onReasoningChange: (reasoning: string) => void;
  replyFormat: ReplyFormat;
  onReplyFormatChange: (format: ReplyFormat) => void;
  live?: boolean;
  onLiveChange?: (live: boolean) => void;
  onDictate?: () => void;
  onAdd?: (kind: ComposerAddition) => void;
  /** Installed commands and skills. Omit to disable suggestions; [] shows an empty registry. */
  commands?: ComposerCommand[];
  /** Only the agents participating in this chat. Omit to disable @ suggestions. */
  agents?: ComposerAgent[];
  /** Agent whose model/reasoning the controlled props currently describe. */
  activeAgentId?: string;
  onActiveAgentChange?: (agentId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  /** Saved conversation context. Supply a change handler to enable its editor. */
  goal?: string;
  onGoalChange?: (goal: string) => void;
  instruction?: string;
  onInstructionChange?: (instruction: string) => void;
  /** Used consistently in the add menu and saved goal pill. Defaults to Lucide Goal. */
  goalIcon?: ReactElement;
  context?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
}
/** Controlled composer. The application owns sending, draft clearing, audio, and context. */
export function Composer(props: ComposerProps) {
  return (
    <ComposerInternal
      experimentalAgentSettings={undefined}
      onStop={undefined}
      additions={undefined}
      additionLabels={undefined}
      textareaRef={undefined}
      textareaTestId={undefined}
      commands={undefined}
      agents={undefined}
      activeAgentId={undefined}
      onActiveAgentChange={undefined}
      context={undefined}
      header={undefined}
      footer={undefined}
      live={false}
      onGoalChange={undefined}
      onInstructionChange={undefined}
      onAdd={undefined}
      onDictate={undefined}
      onLiveChange={undefined}
      {...props}
    />
  );
}
export interface PermissionControlProps {
  /** Dock beside a containing data-composer-menu-surface when set to right. */
  menuSide?: "top" | "right";
  showLabel?: boolean;
  menuOwner?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
}
/** Use in the conversation header, or a launch composer's header slot. */
export function PermissionControl(props: PermissionControlProps) {
  return <PermissionControlInternal menuOwner={undefined} {...props} />;
}

/** Reuses the maintained composer selector for per-agent model/reasoning settings. */
export interface ComposerChoiceProps {
  label: string;
  value: string;
  options: string[];
  onValueChange: (value: string) => void;
  menuOwner?: string;
}
export function ComposerChoice(props: ComposerChoiceProps) {
  return <ComposerChoiceInternal menuOwner={undefined} {...props} />;
}
