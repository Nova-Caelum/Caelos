import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { conversationMessage } from "../styled-system/recipes/index.mjs";
import { AgentAvatar, type AgentIdentity } from "./AgentMessage";

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
  /** Avatar identity; keep it on continuations to preserve the text column. */
  agent?: AgentIdentity;
  /** Hide the repeated avatar while keeping subsequent prose aligned. */
  continued?: boolean;
  /** Group renderers show the avatar only beside the final visible prose block. */
  avatarVisible?: boolean;
  /** One accent per speaker so two agents in a turn stay distinguishable. */
  speaker?: MessageSpeaker;
}

/** Unboxed prose with a consistent avatar gutter; legacy inline names remain supported. */
export function ConversationMessage({ agentName, agent, continued = false, avatarVisible = !continued, speaker = "sage", className, children, ...props }: ConversationMessageProps) {
  const styles = conversationMessage({ speaker });
  return (
    <article {...props} className={cx(styles.turn, agent && styles.avatarTurn, className)} data-speaker={speaker}>
      {agent ? (
        <>
          <span className={styles.avatar} data-message-identity={avatarVisible ? "avatar" : "continuation"}>
            {avatarVisible && <AgentAvatar agent={agent} size="md" style={{ "--nc-avatar-ink": `var(--nc-${speaker})` } as CSSProperties} />}
          </span>
          <div className={styles.body}>{children}</div>
        </>
      ) : <>
        {agentName != null && <span className={styles.name}>{agentName}</span>}
        {children}
      </>}
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
