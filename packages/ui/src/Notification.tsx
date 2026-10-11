import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Bell, Check, CheckCircle2, ChevronDown, CircleHelp, KeyRound, TriangleAlert, X } from "lucide-react";
import { notification } from "../styled-system/recipes/index.mjs";
import { Alert, type AlertTone } from "./Alert";
import { Button, IconButton, Input } from "./components";

/*
 * Ported from the React 19 `caelos-chat-react19` package. React 18 differences, each
 * changed here rather than by upgrading React:
 *   - `inert={!expanded}`: React 19 treats `inert` as a boolean DOM attribute; React 18
 *     does not know it, warns, and drops a boolean value, so the collapsed detail was
 *     never actually inert. Here it is set as the string attribute React 18 passes
 *     through (`inert=""`) and omitted when expanded.
 *   - `IconButton`: this package's IconButton always carries its
 *     tooltip and has no `tooltip` prop (it would reach the DOM), so the prop is dropped.
 *   - `chatNavigationControl` (the bell's circular navigation skin) does not exist in
 *     this package; the bell is this package's tonal IconButton, made circular inline.
 * No `use()`, no ref-as-prop: every ref here targets this package's forwardRef
 * components (IconButton, Input).
 */
const inertWhen = (collapsed: boolean) => (collapsed ? ({ inert: "" } as Record<string, string>) : {});

export type NotificationKind = "error" | "permission" | "question" | "ready" | "attention";
export interface NotificationAction {
  id: string; label: string; primary?: boolean;
  /** Resolve only after the host operation succeeds. Return false to keep the request open. */
  run: (value?: string) => void | boolean | Promise<void | boolean>;
  resolves?: boolean;
}
export interface NotificationItem {
  /** Stable source/event ID: publishing the same ID updates rather than duplicates it. */
  id: string; kind: NotificationKind; title: string; source?: string;
  detail?: string; command?: string; choices?: string[]; actions?: NotificationAction[];
  /** Host owns the real permission/question response. Omit to show a read-only request. */
  onReply?: (value: string, mode: "answer" | "clarify") => void | boolean | Promise<void | boolean>;
}
const tones: Record<NotificationKind, AlertTone> = { error: "danger", permission: "progress", question: "accent", ready: "sage", attention: "progress" };
const labels: Record<NotificationKind, string> = { error: "Error", permission: "Permission", question: "Question", ready: "Ready", attention: "Attention" };
const icons = { error: TriangleAlert, permission: KeyRound, question: CircleHelp, ready: CheckCircle2, attention: TriangleAlert };

export interface NotificationCardProps {
  item: NotificationItem; onDismiss: () => void; onResolve: () => void;
  draft?: string; onDraftChange?: (value: string) => void;
  onInteractionChange?: (active: boolean) => void;
}
export function NotificationCard({ item, onDismiss, onResolve, draft: controlledDraft, onDraftChange, onInteractionChange }: NotificationCardProps) {
  const s = notification({ kind: item.kind }); const Icon = icons[item.kind]; const id = useId();
  const [localDraft, setLocalDraft] = useState("");
  const draft = controlledDraft ?? localDraft;
  const changeDraft = (value: string) => { setLocalDraft(value); onDraftChange?.(value); };
  const [expanded, setExpanded] = useState(false);
  const [editor, setEditor] = useState<"answer" | "clarify" | null>(null);
  const [choice, setChoice] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [hover, setHover] = useState(false); const [focus, setFocus] = useState(false);
  const input = useRef<HTMLInputElement>(null); const disclosure = useRef<HTMLButtonElement>(null);
  useEffect(() => { onInteractionChange?.(expanded || hover || focus || busy); }, [expanded, hover, focus, busy, onInteractionChange]);
  useEffect(() => { if (editor) input.current?.focus(); }, [editor]);
  const run = async (fn: () => ReturnType<NotificationAction["run"]>, resolves = true) => {
    if (busy) return; setBusy(true); setError("");
    try { const result = await fn(); if (resolves && result !== false) onResolve(); }
    catch (e) { setError(e instanceof Error ? e.message : "That action could not be completed. Please try again."); setExpanded(true); }
    finally { setBusy(false); }
  };
  const openEditor = (mode: "answer" | "clarify") => { setExpanded(true); setEditor(mode); };
  const reply = () => { const value = editor ? draft.trim() : choice; if (value && item.onReply) void run(() => item.onReply!(value, editor ?? "answer"), editor !== "clarify"); };
  const hasDetails = !!(item.detail || item.command || item.choices || item.onReply || error);
  return <Alert className={s.root} data-notification-kind={item.kind} data-expanded={expanded} material={item.kind === "question" ? "glass" : "tonal"} tone={tones[item.kind]} glow
    tabIndex={0} aria-label={`${labels[item.kind]}: ${item.title}`} aria-busy={busy}
    onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocusCapture={() => setFocus(true)}
    onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) setFocus(false); }}
    icon={<Icon size={16} />} title={<><span className={s.source}>{item.source ? `${item.source} · ` : ""}{labels[item.kind]}</span>{item.title}</>}
    pager={<div className={s.controls}>{hasDetails && <IconButton ref={disclosure} label="Notification details" icon={<ChevronDown />} variant="text" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(v => !v)} />}
      <IconButton label="Dismiss popup" icon={<X />} variant="text" onClick={onDismiss} /></div>}>
    <div className={s.detail} data-notification-detail="" id={id} {...inertWhen(!expanded)} aria-hidden={!expanded}><div>
      {item.detail && <p>{item.detail}</p>}{item.command && <code>{item.command}</code>}
      {item.choices && !editor && <div className={s.choices} role="group" aria-label="Answer choices">{item.choices.map(value => <Button key={value} variant="tonal" aria-pressed={choice === value} disabled={busy || !item.onReply} onClick={() => setChoice(value)}>{value}{choice === value && <Check size={14} />}</Button>)}</div>}
      {editor && <div className={s.editor}><Input ref={input} aria-label={editor === "clarify" ? "Clarification" : "Your answer"} placeholder={editor === "clarify" ? "What should be clarified?" : "Write your answer…"} value={draft} onChange={e => changeDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); reply(); } }} /><div className={s.actions}>
        <Button variant="text" onClick={() => { setEditor(null); disclosure.current?.focus(); }}>Cancel</Button><Button disabled={busy || !draft.trim()} onClick={reply}>Send</Button></div></div>}
      {error && <p role="alert">{error}</p>}
    </div></div>
    {!editor && <div className={s.reveal} data-notification-actions=""><div><div className={s.actions}>
      {item.onReply && <Button variant="text" disabled={busy} onClick={() => openEditor("clarify")}>Clarify</Button>}
      {item.kind === "question" && item.onReply && <><Button variant="text" disabled={busy} onClick={() => openEditor("answer")}>Other</Button><Button disabled={busy || !choice} onClick={reply}>Answer</Button></>}
      {item.actions?.map(action => <Button key={action.id} variant={action.primary ? "primary" : "text"} disabled={busy} onClick={() => void run(() => action.run(), action.resolves !== false)}>{action.label}</Button>)}
      {!item.actions?.length && !item.onReply && <Button variant="text" onClick={onResolve}>Mark read</Button>}
    </div></div></div>}
  </Alert>;
}

interface NotificationContextValue {
  items: NotificationItem[]; publish: (item: NotificationItem) => void; resolve: (id: string) => void;
  show: (id: string) => void; inboxOpen: boolean; toggleInbox: () => void;
}
const NotificationContext = createContext<NotificationContextValue | null>(null);
export function useNotifications() { const context = useContext(NotificationContext); if (!context) throw new Error("useNotifications requires NotificationProvider"); return context; }
export function NotificationButton() {
  const { items, inboxOpen, toggleInbox } = useNotifications(); const s = notification();
  return <span className={s.bell} data-notification-center=""><IconButton variant="tonal" style={{ width: 34, height: 34, borderRadius: "50%" }} label={`Notifications${items.length ? ` (${items.length} unaddressed)` : ""}`} icon={<Bell />} aria-expanded={inboxOpen} onClick={toggleInbox} />{items.length > 0 && <span aria-hidden="true" className={s.count}>{items.length > 99 ? "99+" : items.length}</span>}</span>;
}
/** Place once above all product surfaces. Closing a popup never resolves its source request. */
export function NotificationProvider({ children, popupDuration = 6000 }: { children: ReactNode; popupDuration?: number }) {
  const [items, setItems] = useState<NotificationItem[]>([]); const [selected, setSelected] = useState<string | null>(null);
  const [inboxOpen, setInboxOpen] = useState(false); const [interacting, setInteracting] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({}); const s = notification();
  const occupied = useRef(false); occupied.current = (selected !== null && interacting) || inboxOpen;
  const publish = useCallback((item: NotificationItem) => {
    setItems(all => [item, ...all.filter(old => old.id !== item.id)]);
    // New arrivals remain in the inbox while a person is reading or answering.
    if (!occupied.current) { setSelected(item.id); setInteracting(false); }
  }, []);
  const resolve = useCallback((id: string) => { setItems(all => all.filter(item => item.id !== id)); setSelected(value => value === id ? null : value); setDrafts(all => { const next = { ...all }; delete next[id]; return next; }); }, []);
  const show = useCallback((id: string) => { setSelected(id); setInteracting(false); setInboxOpen(false); }, []);
  const toggleInbox = useCallback(() => { setInboxOpen(open => !open); setSelected(null); }, []);
  useEffect(() => { if (!selected || interacting || popupDuration <= 0) return; const timer = setTimeout(() => setSelected(null), popupDuration); return () => clearTimeout(timer); }, [selected, interacting, popupDuration]);
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setSelected(null); setInboxOpen(false); } }; document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey); }, []);
  const context = useMemo(() => ({ items, publish, resolve, show, inboxOpen, toggleInbox }), [items, publish, resolve, show, inboxOpen, toggleInbox]);
  const item = items.find(value => value.id === selected);
  return <NotificationContext.Provider value={context}>{children}
    <div role="status" aria-live="polite" className={s.source} style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>{item ? `${labels[item.kind]}: ${item.title}` : ""}</div>
    {(item || inboxOpen) && <aside className={s.rail} data-notification-center="" aria-label="Notifications">
      {inboxOpen ? <section className={s.inbox}><header><strong>Unaddressed · {items.length}</strong><IconButton label="Close notifications" icon={<X />} variant="text" onClick={() => setInboxOpen(false)} /></header>
        {items.length === 0 ? <p>You’re all caught up.</p> : items.map(value => { const Icon = icons[value.kind]; return <button key={value.id} className={notification({ kind: value.kind }).item} onClick={() => show(value.id)}><Icon size={16} /><span><small>{value.source ? `${value.source} · ` : ""}{labels[value.kind]}</small><strong>{value.title}</strong></span></button>; })}</section>
      : item && <NotificationCard key={item.id} item={item} draft={drafts[item.id] ?? ""} onDraftChange={value => setDrafts(all => ({ ...all, [item.id]: value }))} onDismiss={() => setSelected(null)} onResolve={() => resolve(item.id)} onInteractionChange={setInteracting} />}
    </aside>}
  </NotificationContext.Provider>;
}
