import { defineSlotRecipe } from "@pandacss/dev";
import { conversationType, proseType } from "./chat-parts";

/**
 * 02 · Agent messages — inline names, unboxed indented text. Daniel: "Perfect!!! you got it!"
 * Translated from the approved specimen `studio/iter2/Elements.tsx` -> `Messages` (variant "a")
 * and `.i2-conversation` / `.i2-agent-name` / `.i2-prose` / `.i2-actions` in `iter2.css`.
 *
 * This is NOT the same layout as the package's existing `AgentMessage`, which keeps a circular
 * avatar and a 12px byline. The approved Atlas 3 form has no avatar and floats an 18px/27px name
 * beside the first line. Both are kept; `AgentMessage` is untouched. See the report's
 * "Blocked / unsure" for the written-record-versus-specimen conflict.
 */
export const conversationMessage = defineSlotRecipe({
  className: "conversation-message",
  slots: ["root", "turn", "name", "prose", "phrase", "actions"],
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
      paddingRight: "var(--sys-space-5)",
      fontSize: "18px",
      lineHeight: "27px",
      fontWeight: 500,
      color: "var(--nc-sage)",
    },
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
