import type { HTMLAttributes, ReactNode } from "react";
import { conversationMessage } from "../styled-system/recipes/index.mjs";

const cx = (...values: (string | undefined | false)[]) => values.filter(Boolean).join(" ");

export type MessageSpeaker = "sage" | "ready";
export type MessageArrival = "phrase" | "paragraph" | "none";

export interface ConversationColumnProps extends HTMLAttributes<HTMLDivElement> {}

/** The conversation's own column: one owner for the 24px between turns. */
export function ConversationColumn({ className, ...props }: ConversationColumnProps) {
  return <div {...props} className={cx(conversationMessage().root, className)} />;
}

export interface ConversationMessageProps extends HTMLAttributes<HTMLElement> {
  /** Quiet inline name. Omitted on a continuation, exactly as the approved specimen does. */
  agentName?: ReactNode;
  /** One accent per speaker so two agents in a turn stay distinguishable. */
  speaker?: MessageSpeaker;
}

/**
 * 02 · Agent message — inline name, unboxed indented text. Daniel: "Perfect!!! you got it!"
 * The name floats beside the first line rather than sitting in its own column, and the body
 * is never boxed. This is the approved Atlas 3 form; the package's `AgentMessage` (circular
 * avatar, 12px byline) is a different, older layout and is unchanged.
 */
export function ConversationMessage({ agentName, speaker = "sage", className, children, ...props }: ConversationMessageProps) {
  const styles = conversationMessage({ speaker });
  return (
    <article {...props} className={cx(styles.turn, className)} data-speaker={speaker}>
      {agentName != null && <span className={styles.name}>{agentName}</span>}
      {children}
    </article>
  );
}

export interface MessageProseProps extends HTMLAttributes<HTMLDivElement> {}

/** Reading type for a message body: 15px / 1.75, 18px between paragraphs. */
export function MessageProse({ className, ...props }: MessageProseProps) {
  return <div {...props} className={cx(conversationMessage().prose, className)} />;
}

export interface MessageActionsProps extends HTMLAttributes<HTMLDivElement> {}

/** Copy, vote and the quiet status line under a completed message. */
export function MessageActions({ className, ...props }: MessageActionsProps) {
  return <div {...props} className={cx(conversationMessage().actions, className)} />;
}

export interface ArrivingTextProps {
  text: string;
  /** `phrase` staggers clause by clause, `paragraph` fades the whole block, `none` is static. */
  arrival?: MessageArrival;
  /** Delay between phrases, in ms. */
  stagger?: number;
}

/**
 * Text that arrives rather than appearing. Split on clause boundaries so a long sentence
 * resolves left to right. Reduced motion is handled by the provider, which removes the
 * animation outright.
 */
export function ArrivingText({ text, arrival = "phrase", stagger = 85 }: ArrivingTextProps) {
  const styles = conversationMessage({ arrival });
  if (arrival !== "phrase") return <span className={styles.phrase}>{text}</span>;
  const phrases = text.match(/[^,;.]+[,;.]?\s*/g) ?? [text];
  return <>{phrases.map((phrase, index) => (
    <span key={index} className={styles.phrase} style={{ animationDelay: `${index * stagger}ms` }}>{phrase}</span>
  ))}</>;
}
