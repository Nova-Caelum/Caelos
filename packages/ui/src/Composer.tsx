import type { ReactNode } from "react";
import {
  ComposerInternal,
  PermissionControlInternal,
} from "./composer-internal";
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
}
export interface ComposerProps {
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
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  context?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
}
/** Controlled composer. The application owns sending, draft clearing, audio, and context. */
export function Composer(props: ComposerProps) {
  return (
    <ComposerInternal
      context={undefined}
      header={undefined}
      footer={undefined}
      live={false}
      onAdd={undefined}
      onDictate={undefined}
      onLiveChange={undefined}
      {...props}
    />
  );
}
export interface PermissionControlProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
}
/** Use in the conversation header, or a launch composer's header slot. */
export function PermissionControl(props: PermissionControlProps) {
  return <PermissionControlInternal {...props} />;
}
