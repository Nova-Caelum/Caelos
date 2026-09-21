import type { HTMLAttributes } from "react";
import { agentMessage } from "../styled-system/recipes/index.mjs";
import { Avatar, type AvatarColor, type AvatarProps } from "./components";
import { NovaLoader } from "./NovaLoader";

export interface AgentIdentity {
  id: string;
  name: string;
  avatarSrc?: string;
  /** Identity colour; fills the agent's avatar wherever it appears. */
  color?: AvatarColor;
}

/** One circular identity token for conversation headers, rosters, mentions and messages. */
export function AgentAvatar({ agent, size = "sm", ...props }: Omit<AvatarProps, "name" | "src" | "kind" | "shape"> & { agent: AgentIdentity }) {
  return <Avatar {...props} name={agent.name} src={agent.avatarSrc} color={agent.color} shape="circle" size={size} data-agent-avatar={agent.id} />;
}

export interface AgentMessageProps extends HTMLAttributes<HTMLElement> {
  agent: AgentIdentity;
  continued?: boolean;
  responding?: boolean;
}

/** Open conversation layout. The host supplies identity and activity per message. */
export function AgentMessage({ agent, continued = false, responding = false, children, className, ...props }: AgentMessageProps) {
  const styles = agentMessage();
  const showSignature = !continued || responding;
  return (
    <article {...props} aria-label={`${agent.name} message`} data-agent-id={agent.id}
      data-continued={continued} className={[styles.root, className].filter(Boolean).join(" ")}>
      {showSignature && <>
        <div className={styles.avatar} aria-hidden="true">
          <AgentAvatar agent={agent} />
        </div>
        <div className={styles.byline} data-slot="agent-byline">
          <span className={styles.name}>{agent.name}</span>
          {responding && <NovaLoader size={16} label={`${agent.name} is responding`} />}
        </div>
      </>}
      <div className={styles.content} data-slot="agent-content">{children}</div>
    </article>
  );
}
