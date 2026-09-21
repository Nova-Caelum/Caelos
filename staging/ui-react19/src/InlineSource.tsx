import type { AnchorHTMLAttributes, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { inlineSource } from "../styled-system/recipes/index.mjs";
import { Tooltip } from "./components";

const cx = (...values: (string | undefined | false)[]) => values.filter(Boolean).join(" ");

export interface InlineSourceProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Visible label — the source's name, not its URL. */
  children: ReactNode;
  href: string;
  /** Second line in the hint. Defaults to the href, which is what the specimen shows. */
  detail?: ReactNode;
  /** Suppress the hint when the surrounding text already names the source. */
  hint?: boolean;
}

/**
 * 09 · Inline source — the quiet chip. It reads as part of the sentence, reveals its name and
 * URL on hover or focus, and never grows into a card. Direction A, reviewed in Iter 2.
 */
export function InlineSource({ children, href, detail, hint = true, className, target = "_blank", rel = "noreferrer", ...props }: InlineSourceProps) {
  const link = (
    <a {...props} href={href} target={target} rel={rel} className={cx(inlineSource(), className)}>
      {children}
      <ArrowUpRight size={11} aria-hidden="true" />
    </a>
  );
  return hint ? <Tooltip label={children} detail={detail ?? href}>{link}</Tooltip> : link;
}
