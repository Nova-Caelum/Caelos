import { defineSlotRecipe } from "@pandacss/dev";
import { conversationType, proseType } from "./chat-parts";

/**
 * 02 · Agent messages — inline names, unboxed indented text. Daniel: "Perfect!!! you got it!"
 * Translated from the approved specimen `studio/iter2/Elements.tsx` -> `Messages` (variant "a")
 * and `.i2-conversation` / `.i2-agent-name` / `.i2-prose` / `.i2-actions` in `iter2.css`.
 *
 * Avatar messages use one fixed gutter for every agent and continuation.
 * The separate `AgentMessage` layout remains unchanged.
 */
export const conversationMessage = defineSlotRecipe({
  className: "conversation-message",
  slots: ["root", "turn", "name", "avatarTurn", "avatar", "body", "prose", "phrase", "actions"],
  base: {
    // One conversation column. The host owns viewport placement and the composer offset.
    root: {
      ...conversationType,
      display: "flex",
      flexDirection: "column",
      gap: "var(--sys-space-7)",
      minWidth: 0,
    },
    turn: { minWidth: 0 },
    // The name floats so the first line of prose wraps around it.
    name: {
      float: "left",
      position: "relative",
      paddingRight: "var(--sys-space-5)",
      fontSize: "18px",
      lineHeight: "27px",
      fontWeight: 500,
      color: "var(--nc-sage)",
    },
    avatarTurn: {
      display: "grid",
      gridTemplateColumns: "32px minmax(0, 1fr)",
      columnGap: "var(--sys-space-4)",
      alignItems: "end",
      minHeight: "32px",
    },
    avatar: { display: "flex", alignItems: "center" },
    body: { minWidth: 0 },
    prose: {
      ...proseType,
      minWidth: 0,
      "& p": { margin: 0 },
      "& p + p": { marginTop: "var(--sys-space-6)" },
    },
    // Text arrives rather than appearing. Reduced motion is handled by the provider.
    phrase: { animation: "nc-arrival 400ms ease both" },
    actions: {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "var(--sys-space-1)",
      "& button[aria-pressed=true]": {
        color: "var(--nc-ready)",
        background: "var(--nc-elevated-2)",
      },
    },
  },
  variants: {
    // One accent per speaker so two agents in a turn stay distinguishable.
    speaker: {
      sage: { name: { color: "var(--nc-sage)" } },
      ready: { name: { color: "var(--nc-ready)" } },
    },
    // Whole paragraphs arrive together instead of phrase by phrase.
    arrival: {
      phrase: {},
      paragraph: { phrase: { animation: "nc-arrival 650ms ease both" } },
      none: { phrase: { animation: "none" } },
    },
  },
  defaultVariants: { speaker: "sage", arrival: "phrase" },
});
