import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowDown, ArrowUpRight, Check, ChevronDown, ChevronRight, ChevronsRight, Copy, Download, FileText, Globe, Dot, Zap, Flame, Maximize2, Minimize2, PanelRight, Pencil, Redo2, RotateCcw, ThumbsDown, ThumbsUp, Undo2, Bot, Wrench, X } from 'lucide-react';
import { Button, CaelosProvider, IconButton, NovaLoader, Surface, Tooltip } from '../../../../dist/index.js';
import { RippleLoader } from '../../../../src/RippleLoader';
import type { Phase, Variant } from './catalog';

export type SpecimenProps = { variant: Variant; state: string; phase: Phase; reduced: boolean; progress?: number };
export const docTitle = 'A quieter, more legible workspace';
const paragraphs = [
  'The conversation can stay open while the work gains a clear place of its own.',
  'Use the graph-paper ground for continuity. A raised reading plane supports the document; a quiet activity chain keeps its history close at hand.',
  'Every new surface should explain a relationship. Open the detail when it helps, then let it return to a simple line in the conversation.',
];
export const docText = `${docTitle}\n\n${paragraphs.join('\n\n')}`;
export function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function copyText(text: string, notify: (s: string) => void) {
  try { await navigator.clipboard.writeText(text); notify('Copied.'); } catch { notify('Clipboard unavailable in this browser.'); }
}
export function Actions() {
  const [vote, setVote] = useState(''); const [notice, setNotice] = useState('');
  return <div className="i2-actions"><IconButton variant="text" label="Copy response" icon={<Copy size={15} />} onClick={() => void copyText(paragraphs[0], setNotice)} /><IconButton variant="text" label="Good response" aria-pressed={vote === 'up'} icon={<ThumbsUp size={15} />} onClick={() => setVote(vote === 'up' ? '' : 'up')} /><IconButton variant="text" label="Poor response" aria-pressed={vote === 'down'} icon={<ThumbsDown size={15} />} onClick={() => setVote(vote === 'down' ? '' : 'down')} /><span className="i2-meta" role="status">{notice}</span></div>;
}

// Operational summaries, not an invented transcript of private reasoning.
export function Activity({ variant, state, phase, reduced, agentName }: SpecimenProps & { agentName?: string }) {
  const id = useId(); const [open, setOpen] = useState(false); const [detail, setDetail] = useState<number>();
  const chain = state === 'Connected chain' || state === 'Two steps'; const delegated = state === 'Delegation'; const tool = state === 'Tool call';
  const ThoughtIcon = Zap;
  const rows = chain ? [
    { icon: ThoughtIcon, title: 'Reviewing your direction', content: 'Keep activity quiet. Give the document its own reading plane.' },
    { icon: Wrench, title: 'Reading the workspace brief', content: 'Read file · workspace-brief.md\n3 sections · 842 words' },
    { icon: Bot, title: 'Athena · checking spacing', content: 'Compared the document plane, toolbar and conversation gutter.' },
  ] : [{ icon: delegated ? Bot : tool ? Wrench : ThoughtIcon, title: delegated ? 'Athena · checking spacing' : tool ? 'Reading the workspace brief' : 'Considering the layout', content: delegated ? 'Review the relationship between the reading plane and the open conversation.' : tool ? 'Read file · workspace-brief.md\n3 sections · 842 words' : 'I’ll compare the document plane and the conversation before choosing a layout.' }];
  if (state === 'Two steps') rows.pop();
  const hasSummary = rows.length >= 3;
  const activeIndex = phase === 'complete' ? -1 : rows.length - 1;
  const visibleRows = open || !hasSummary ? rows : [rows[rows.length - 1]];
  return <div className="i2-activity">
    {agentName && <div className="i2-progress-name">{agentName}</div>}
    {hasSummary && <button className="i2-activity-trigger" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
      <Dot size={18} aria-hidden="true" /><span>{rows.length} {rows.length === 1 ? 'step' : 'steps'}{phase === 'complete' ? ' completed' : ''}</span><ChevronDown size={14} className="i2-chevron" data-open={open} />
    </button>}
    <div id={id} className={`i2-chain i2-chain-${variant}`} data-summary={hasSummary} data-dot-anchor={variant === 'a' && !hasSummary}>
      {visibleRows.map(row => { const i = rows.indexOf(row); const active = i === activeIndex; return <div className="i2-step" data-active={active} key={row.title}>
        <div className="i2-step-body"><button className="i2-step-trigger" aria-expanded={detail === i} onClick={() => setDetail(detail === i ? undefined : i)}>{variant === 'a' && !hasSummary && <span className="i2-step-anchor" aria-hidden="true">{i === 0 && <Dot size={18} />}</span>}<span className="i2-step-label"><row.icon size={18} aria-hidden="true" /><span>{row.title}</span></span><span className="i2-step-status">{active ? <RippleLoader paused={reduced} label={phase === 'waiting' ? 'Waiting' : 'Working'} /> : <Check size={12} aria-label="Completed" />}</span><ChevronRight size={12} data-open={detail === i} /></button>
          {detail === i && <>{(tool || (chain && i === 1)) ? <Surface layer="elevated" texture="plain" className="i2-code-detail"><code>{row.content}</code></Surface> : <p className="i2-muted">{row.content}</p>}{(delegated || (chain && i === 2)) && <Preview variant={variant} state="Agent session" phase={phase} reduced={reduced} />}</>}
        </div>
      </div>; })}
    </div>
  </div>;
}

export function Messages(props: SpecimenProps) {
  const group = props.state === 'Multiple agents';
  const shown = props.phase === 'complete' ? 3 : props.phase === 'waiting' ? 0 : props.progress === undefined ? 2 : Math.min(3, 1 + Math.floor(Math.max(0, props.progress - 1000) / 1400));
  return <div className={`i2-conversation i2-message-a`} data-still={props.reduced}>
    {props.phase !== 'complete' ? <div className="i2-agent-progress">{(group ? ['Hermes', 'Athena'] : ['Hermes']).map(name => <div key={name}><Activity {...props} agentName={name} state="Connected chain" /></div>)}</div> : <Activity {...props} state="Connected chain" />}
    {shown > 0 && <div className={group ? 'i2-named-message' : 'i2-message-copy'}>
      {group && <span className="i2-agent-name">Hermes</span>}
      <div className="i2-prose">{paragraphs.slice(0, shown).map((p, i) => <p key={p} className={props.variant === 'b' ? 'i2-arrive' : undefined}>{props.variant === 'a' ? p.match(/[^,;.]+[,;.]?\s*/g)?.map((phrase, j) => <span className="i2-phrase" style={{ animationDelay: `${j * 85}ms` }} key={j}>{phrase}</span>) : p}</p>)}</div>
    </div>}
    {props.phase === 'complete' && group && <div className="i2-named-message"><span className="i2-agent-name" data-agent="athena">Athena</span><div className="i2-prose"><p>The document can rise one tier without enclosing the conversation.</p></div></div>}
    {props.phase === 'complete' && <Actions />}
  </div>;
}
export function Material({ variant, state }: SpecimenProps) {
  const [notice, setNotice] = useState(''); const [editing, setEditing] = useState(false); const [text, setText] = useState('Keep the conversation open, and give the document a clear place of its own.');
  if (state === 'User message') return <div className="i2-user-wrap"><Surface layer="elevated" className={`i2-user i2-diffusion-${variant}`}>{editing ? <textarea aria-label="Edit sample message" value={text} onChange={e => setText(e.target.value)} /> : <p>{text}</p>}</Surface><div className="i2-actions"><IconButton variant="text" label={editing ? 'Save message' : 'Edit message'} icon={editing ? <Check size={15} /> : <Pencil size={15} />} onClick={() => setEditing(!editing)} /><IconButton variant="text" label="Copy message" icon={<Copy size={15} />} onClick={() => void copyText(text, setNotice)} /><span role="status" className="i2-meta">{notice}</span></div></div>;
  return <div className="i2-prose"><p>The surface names should make the relationship explicit.</p><Surface layer="elevated" texture="glass" className="i2-code-shell"><div className="i2-row"><span className="i2-meta">TypeScript</span><IconButton label="Copy code" variant="text" icon={<Copy size={14} />} onClick={() => void copyText('const plane = { layer: "elevated", texture: "plain" };', setNotice)} /></div><Surface layer="elevated-2" texture="plain" className="i2-code-detail"><pre><code>{'const plane = {\n  layer: "elevated",\n  texture: "plain",\n};'}</code></pre></Surface></Surface><p className="i2-meta" role="status">{notice}</p></div>;
}

export function Preview(props: SpecimenProps) {
  const [open, setOpen] = useState(true); const [expanded, setExpanded] = useState(false); const [notice, setNotice] = useState(''); const id = useId();
  const agent = props.state === 'Agent session', web = props.state === 'Web page';
  // The fade belongs only to content that really runs past the window; short content sizes the card instead.
  const excerpt = useRef<HTMLDivElement>(null); const [overrun, setOverrun] = useState(false);
  useEffect(() => { const el = excerpt.current; if (!el) return; const measure = () => { const cs = getComputedStyle(el); setOverrun(el.scrollHeight - parseFloat(cs.paddingBottom) > parseFloat(cs.maxHeight) + 1); }; /* bottom padding excluded, so the state cannot oscillate */ measure(); const ro = new ResizeObserver(measure); ro.observe(el); return () => ro.disconnect(); }, [open, props.state, props.phase, props.variant]);
  const title = agent ? 'Athena · workspace review' : web ? 'Designing for quiet focus' : docTitle;
  const Icon = agent ? Bot : web ? Globe : FileText;
  const trigger = <button className="i2-activity-trigger" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}><Icon size={16} /><span>{agent ? 'Agent session' : web ? 'Web preview' : 'Document'}</span><ChevronDown size={14} className="i2-chevron" data-open={open} /></button>;
  const actions = <div className="i2-actions"><IconButton variant="text" label="Expand preview" icon={<Maximize2 size={14} />} onClick={() => setExpanded(true)} /><IconButton variant="text" label="Download preview" icon={<Download size={14} />} onClick={() => downloadText('workspace-direction.txt', docText)} /><IconButton variant="text" label={web ? 'Copy URL' : 'Copy file path'} icon={<Copy size={14} />} onClick={() => void copyText(web ? 'https://example.com/quiet-focus' : '/workspace/workspace-direction.md', setNotice)} /></div>;
  // 2026-09-20. Variant A · "All glass" (user-selected) and variant B · "Glass bracket around paper" (shown beside it at
  // the user's request) share one structure; B only adds a plain paper plane inside the glass. One glass card: a darker chrome strip (type icon, name, kind and
  // coordinate, actions) melts into the glass body. No divider, no nested card. The body is a real excerpt of the document
  // that overruns and fades. While generating, the same card holds NovaLoader at roughly three-quarters of its final height.
  return <div className="i2-preview">
    {trigger}
    {open && <div className="i2-glass-card i2-preview-glass" id={id} data-phase={props.phase} data-inner={props.variant === 'b' ? 'paper' : undefined}>
      <div className="i2-glass-strip">
        <div className="i2-glass-name"><Icon size={16} aria-hidden="true" /><div><h4>{title}</h4><span className="i2-meta">{agent ? <>Agent session · Athena</> : web ? <>Web page · <code>example.com/quiet-focus</code></> : <>Markdown · <code>workspace-direction.md</code></>}</span></div></div>
        {actions}
      </div>
      <div className="i2-glass-body">{props.phase !== 'complete' ? <div className="i2-glass-generating" aria-label="Generating preview"><NovaLoader size={132} paused={props.reduced} label="Generating document" /></div>
        : <div className="i2-glass-excerpt" ref={excerpt} data-overrun={overrun && !agent} data-fit={agent ? 'content' : undefined}>{agent ? <><p>The reading plane now has a clear relationship to the ground.</p><Activity {...props} state="Tool call" /></> : <><h5>{title}</h5>{paragraphs.map((p, i) => <p key={i}>{p}</p>)}</>}</div>}</div>
      {notice && <span role="status" className="i2-meta i2-glass-notice">{notice}</span>}
    </div>}
    <WorkspaceDialog {...props} state={agent ? 'Agent session' : web ? 'Web page' : 'Document'} open={expanded} onOpenChange={setExpanded} />
  </div>;
}

function ToolButton({ label, icon, ...props }: React.ComponentProps<typeof IconButton>) {
  return <Tooltip label={label} side="left"><Button {...props} className="i2-tool-button" aria-label={label}>{icon}</Button></Tooltip>;
}
function ReadingPlane({ variant, state, full, onFull, onClose }: { variant: Variant; state: string; full?: boolean; onFull?: () => void; onClose?: () => void }) {
  const [tools, setTools] = useState(true); const [editing, setEditing] = useState(false); const [history, setHistory] = useState([docText]); const [index, setIndex] = useState(0); const [notice, setNotice] = useState('');
  const text = history[index];
  const stripActions = <div className="i2-actions">{onFull && <ToolButton variant="text" label={full ? 'Exit full screen' : 'Full screen editor'} icon={full ? <Minimize2 size={15} /> : <Maximize2 size={15} />} onClick={onFull} />}{onClose && <ToolButton variant="text" label="Toggle right side panel" icon={<PanelRight size={16} />} onClick={onClose} />}</div>;
  const toolPill = <div className="i2-document-tools">{tools ? <Surface layer={variant === 'a' ? 'top' : 'elevated-2'} className="i2-toolbar"><ToolButton variant="text" label="Collapse document tools" icon={<ChevronsRight size={15} />} onClick={() => setTools(false)} /><ToolButton variant="text" label={editing ? 'Read document' : 'Edit document'} icon={editing ? <FileText size={15} /> : <Pencil size={15} />} onClick={() => setEditing(!editing)} /><ToolButton variant="text" label="Undo" disabled={index === 0} icon={<Undo2 size={15} />} onClick={() => setIndex(i => i - 1)} /><ToolButton variant="text" label="Redo" disabled={index === history.length - 1} icon={<Redo2 size={15} />} onClick={() => setIndex(i => i + 1)} /><ToolButton variant="text" label="Revert document" disabled={index === 0} icon={<RotateCcw size={15} />} onClick={() => { setIndex(0); setNotice('Original fixture restored.'); }} /><ToolButton variant="text" label="Copy document" icon={<Copy size={15} />} onClick={() => void copyText(text, setNotice)} /><ToolButton variant="text" label="Request suggestions" icon={<Flame size={15} />} onClick={() => setNotice('Suggestion: put the key decision before the supporting details.')} /></Surface> : <ToolButton variant="tonal" label="Show document tools" icon={<ChevronRight size={15} />} onClick={() => setTools(true)} />}</div>;
  const body = <div className="i2-document-body">{state === 'Agent session' ? <><h4>Athena’s review</h4><p>{paragraphs[0]}</p><Activity variant={variant} state="Connected chain" phase="complete" reduced /></> : editing ? <textarea className="i2-document-editor" aria-label="Document text" value={text} onChange={e => { setHistory([...history.slice(0, index + 1), e.target.value]); setIndex(index + 1); }} /> : <><h4>{text.split('\n\n')[0]}</h4>{text.split('\n\n').slice(1).map((p, i) => <p key={i}>{p}</p>)}</>}
    {notice && <p className="i2-suggestion" role="status">{notice}</p>}
  </div>;
  // Variant A · "All glass", user-selected 2026-09-20. The workspace paints no ground of its own: the only graph paper is the
  // host's. One glass card = chrome strip (file coordinate in Mono, updated time, full-screen and panel toggle) melting into
  // the glass document surface. The approved tool pill stays beside it on the host ground.
  return <div className={`i2-workspace i2-workspace-${variant}`}>
    <div className="i2-document-layout" data-tools={tools}>
      {toolPill}
      <div className="i2-glass-card i2-workspace-glass" data-inner={variant === 'b' ? 'paper' : undefined}>
        <div className="i2-glass-strip"><div className="i2-workspace-title"><code>workspace-direction.md</code><span className="i2-meta">{state === 'Agent session' ? 'Athena · agent session' : state === 'Web page' ? 'Web preview' : 'Updated 12 hours ago'}</span></div>{stripActions}</div>
        <div className="i2-glass-body">{body}</div>
      </div>
    </div>
  </div>;
}
export function WorkspaceDialog({ open, onOpenChange, variant, state, reduced }: SpecimenProps & { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [full, setFull] = useState(false); const returnFocus = useRef<HTMLElement | null>(null);
  // User direction 2026-09-20: the panel joins the conversation's world. Non-modal: nothing dims, blurs or disables the
  // chat; pointer events outside the panel do not dismiss it. It closes from its toggle or with Escape.
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false}><DialogPrimitive.Portal><CaelosProvider reducedMotion={reduced} className="i2-portal"><DialogPrimitive.Content className="i2-drawer" data-full={full} data-variant={variant} aria-describedby={undefined} onInteractOutside={e => e.preventDefault()} onOpenAutoFocus={e => { returnFocus.current = document.activeElement as HTMLElement; e.preventDefault(); (e.target as HTMLElement).focus(); }} onCloseAutoFocus={e => { if (returnFocus.current?.isConnected) { e.preventDefault(); returnFocus.current.focus(); } }}><DialogPrimitive.Title className="i2-sr">{state === 'Agent session' ? 'Athena agent session' : 'Document workspace'}</DialogPrimitive.Title><ReadingPlane variant={variant} state={state} full={full} onFull={() => setFull(!full)} onClose={() => onOpenChange(false)} /></DialogPrimitive.Content></CaelosProvider></DialogPrimitive.Portal></DialogPrimitive.Root>;
}
export function Workspace(props: SpecimenProps) {
  const [open, setOpen] = useState(false);
  return <><ReadingPlane variant={props.variant} state={props.state} onFull={() => setOpen(true)} /><WorkspaceDialog {...props} open={open} onOpenChange={setOpen} /></>;
}

export function Attachment(props: SpecimenProps) {
  const [retried, setRetried] = useState(false); const [open, setOpen] = useState(false);
  const status = retried || (props.state === 'Uploading' && (props.progress ?? 0) >= 6500) ? 'Ready' : props.state;
  return <div><Surface layer="elevated" className={`i2-attachment i2-attachment-${props.variant}`} data-failed={status === 'Failed'}>
    <button className="i2-file-open" onClick={() => setOpen(true)}><span className="i2-file-symbol">{status === 'Failed' ? <X size={18} /> : status === 'Uploading' ? <RippleLoader size={16} paused={props.reduced} label="Uploading file" /> : <FileText size={21} />}</span><span className="i2-file-label"><span>workspace-direction-review.pdf</span><small>{status === 'Failed' ? 'Upload interrupted' : status === 'Uploading' ? 'Uploading · 64%' : 'PDF · 248 KB'}</small></span></button>
    {status === 'Failed' && <IconButton danger className="i2-danger-control" variant="tonal" label="Retry upload" icon={<RotateCcw size={15} />} onClick={() => setRetried(true)} />}
  </Surface><WorkspaceDialog {...props} state="Document" open={open} onOpenChange={setOpen} /></div>;
}
export function Sources({ variant, state }: SpecimenProps) {
  const source = (name: string, path: string) => <Tooltip label={name} detail={`https://example.com/${path}`}><a className={`i2-source i2-source-${variant}`} href={`https://example.com/${path}`} target="_blank" rel="noreferrer">{name}<ArrowUpRight size={11} /></a></Tooltip>;
  return <div className="i2-prose"><p>Give the document a distinct reading plane, as outlined in {source('Workspace guide', 'workspace-guide')}. Keep the activity history close enough to inspect without interrupting the response.{state === 'Several sources' && <> The {source('Spacing reference', 'spacing-reference')} describes how related elements share space.</>}</p><p className="i2-meta">Fixture sources · example.com</p></div>;
}
export function Recovery({ variant, state, reduced }: SpecimenProps) {
  const [resolved, setResolved] = useState(false);
  if (resolved) return <p className="i2-muted" role="status">{state === 'Error' || state === 'Interrupted' ? 'Response resumed. Your conversation is intact.' : 'You’re at the latest message.'}</p>;
  if (state === 'Unread') return <div className="i2-prose"><p>The document now has its own reading plane.</p><div className="i2-unread" role="separator" aria-label="New messages"><span>{variant === 'a' ? 'New messages' : '2 new messages'}</span></div><p>The conversation remains open around it.</p></div>;
  if (state === 'Error' || state === 'Interrupted') return <div className="i2-error"><p>{state === 'Error' ? 'The connection dropped. Your message is saved.' : 'Response stopped. Continue when you’re ready.'}</p>{variant === 'a' ? <IconButton danger className="i2-danger-control" label="Retry response" variant="tonal" icon={<RotateCcw size={15} />} onClick={() => setResolved(true)} /> : <Button danger className="i2-danger-control" variant="tonal" leadingIcon={<RotateCcw size={15} />} onClick={() => setResolved(true)}>Try again</Button>}</div>;
  return <div className="i2-navigation"><p className="i2-muted">You’re reading earlier in the conversation.</p><Tooltip label="Jump to latest"><Button variant="tonal" className="i2-jump" onClick={() => setResolved(true)} aria-label="Jump to latest">{state === 'Working below' ? <NovaLoader size={36} paused={reduced} /> : <ArrowDown size={28} />}{variant === 'b' && <span>{state === 'Working below' ? 'Working below' : 'Latest message'}</span>}</Button></Tooltip></div>;
}
