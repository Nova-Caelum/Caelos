import type { HTMLAttributes, ReactNode, Ref } from "react";
import { userMessage } from "../styled-system/recipes/index.mjs";

const cx = (...values: (string | undefined | false)[]) => values.filter(Boolean).join(" ");

export interface UserMessageProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** The message text. Rendered as prose at rest and in the editor while editing. */
  value: string;
  /** Editing is host state; the component never keeps an unsaved copy of its own. */
  editing?: boolean;
  onValueChange?: (value: string) => void;
  editorLabel?: string;
  /** Edit / save / copy controls, right-aligned under the material. */
  actions?: ReactNode;
  textareaRef?: Ref<HTMLTextAreaElement>;
}

/**
 * 03 · User message — option A, composer-matched fill. The fill and the diffusion are the
 * composer's own `--il-fill` and `--il-focus`, so a sent message and the composer read as one
 * material. One edge: the hairline. The diffusion sits behind the content as a pseudo-element,
 * never as a second border.
 */
export function UserMessage({ value, editing = false, onValueChange, editorLabel = "Edit message", actions, textareaRef, className, ...props }: UserMessageProps) {
  const styles = userMessage();
  return (
    <div {...props} className={cx(styles.root, className)}>
      <div className={styles.bubble} data-surface="elevated">
        {editing
          ? <textarea ref={textareaRef} className={styles.editor} aria-label={editorLabel}
              value={value} onChange={event => onValueChange?.(event.target.value)} />
          : <p className={styles.text}>{value}</p>}
      </div>
      {actions != null && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
