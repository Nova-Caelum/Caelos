import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { ArrowUp } from "lucide-react";
import "./chatComposer.css";

// Preserve the old composer's geometry, using the locked live input material.
const LINE_HEIGHT = 22.4;
const TEXT_PADDING = 8;
const CHROME = 48.6;
const SINGLE_INSET = 32.89;
const GROWN_INSET = 21.39;
const MAX_LINES = 8;

export function ChatComposer({ value, onChange, onSend, inputRef }: {
  value: string;
  onChange: (value: string) => void;
  onSend: (value: string) => void;
  inputRef: RefObject<HTMLTextAreaElement>;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState({ height: LINE_HEIGHT + TEXT_PADDING, grown: false });

  useLayoutEffect(() => {
    const textarea = inputRef.current;
    const shell = shellRef.current;
    if (!textarea || !shell) return;
    let alive = true;
    const measure = () => {
      if (!alive) return;
      const availableWidth = shell.clientWidth;
      textarea.style.flex = "none";
      // Always decide the shape at the pill's width. Otherwise changing the
      // inset can unwrap the text and cause a pill/rounded-rectangle loop.
      const measureAt = (inset: number) => {
        textarea.style.width = `${Math.max(1, availableWidth - inset * 2 - 44)}px`;
        textarea.style.height = "0px";
        return textarea.scrollHeight;
      };
      const grown = measureAt(SINGLE_INSET) > Math.ceil(LINE_HEIGHT + TEXT_PADDING);
      const contentHeight = grown ? measureAt(GROWN_INSET) : LINE_HEIGHT + TEXT_PADDING;
      const height = Math.min(MAX_LINES * LINE_HEIGHT + TEXT_PADDING,
        Math.max(contentHeight, (grown ? 2 : 1) * LINE_HEIGHT + TEXT_PADDING));
      textarea.style.width = "";
      textarea.style.flex = "";
      textarea.style.height = `${height}px`;
      textarea.style.overflowY = contentHeight > Math.ceil(height) ? "auto" : "hidden";
      setGeometry(previous => previous.height === height && previous.grown === grown
        ? previous : { height, grown });
    };
    measure();
    let lastWidth = shell.clientWidth;
    const observer = new ResizeObserver(() => {
      if (shell.clientWidth !== lastWidth) {
        lastWidth = shell.clientWidth;
        measure();
      }
    });
    observer.observe(shell);
    document.fonts.ready.then(measure);
    document.fonts.addEventListener("loadingdone", measure);
    return () => {
      alive = false;
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", measure);
    };
  }, [value, inputRef]);

  const submit = () => {
    if (!value.trim()) return;
    onSend(value.trim());
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div ref={shellRef} className="nc-input nc-chat-composer" data-grown={geometry.grown}
      style={{ height: geometry.height + CHROME, borderRadius: geometry.grown ? 28 : 39.5,
        paddingInline: geometry.grown ? GROWN_INSET : SINGLE_INSET }}>
      <div className="nc-chat-composer__content">
        <textarea ref={inputRef} className="nc-chat-composer__text" rows={1}
          aria-label="Message your agent" placeholder="What would you like to work on?"
          value={value} onChange={event => onChange(event.target.value)}
          onKeyDown={event => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && event.nativeEvent.keyCode !== 229) {
              event.preventDefault();
              submit();
            }
          }} />
        <button type="button" className="nc-chat-composer__send" aria-label="Send preview message"
          title="Send message" disabled={!value.trim()} onClick={submit}>
          <ArrowUp size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

const SAMPLE_LINES = [
  "Help me plan the next Caelos release.",
  "Start with the work already in progress.",
  "Find the decisions that need my attention.",
  "Group related tasks into a clear sequence.",
  "Keep the scope realistic for this week.",
  "Call out anything that is blocked.",
  "Suggest the first useful step for each project.",
  "Then give me a concise plan to review.",
  "Include the open questions at the end.",
  "Leave room for us to adjust the priorities.",
];

export default function ChatComposerPreview() {
  const [value, setValue] = useState("");
  const [sent, setSent] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  return (
    <div className="nc-chat-preview">
      <div className="nc-chat-preview__controls" aria-label="Chatbar preview controls">
        <span>Try the expansion</span>
        {([1, 2, 4, 8, 10] as const).map(lines => (
          <button type="button" key={lines} onClick={() => {
            setValue(SAMPLE_LINES.slice(0, lines).join("\n"));
            setSent(false);
            inputRef.current?.focus();
          }}>{lines === 10 ? "Overflow" : `${lines} ${lines === 1 ? "line" : "lines"}`}</button>
        ))}
        <button type="button" onClick={() => { setValue(""); setSent(false); inputRef.current?.focus(); }}>Clear</button>
        <button type="button" aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>Narrow width</button>
      </div>
      <div className="nc-chat-preview__stage" style={{ maxWidth: narrow ? 360 : 760 }}>
        <ChatComposer value={value} onChange={setValue} onSend={() => setSent(true)} inputRef={inputRef} />
      </div>
      <div className="nc-chat-preview__footnote">
        <span>Enter to send · Shift + Enter for a new line</span>
        <span role="status">{sent ? "Preview sent. Nothing leaves this page." : "Interactive preview · grows to eight lines"}</span>
      </div>
    </div>
  );
}
