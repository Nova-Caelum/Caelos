import { useState, type ReactNode } from 'react';
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, ChevronsRight, Copy, Download, FileText, Flame, KeyRound, Maximize2, MessageCircleQuestion, Pencil, PanelRight, Redo2, RotateCcw, ThumbsDown, ThumbsUp, Undo2 } from 'lucide-react';
import {
  ActivityChain, Alert as PackagedAlert, AlertStage, ArrivingText, ArtifactPreview, ArtifactWorkspace,
  Button, CaelosProvider, Checkbox, CompactError, Composer, ConversationColumn, ConversationMessage,
  FileCard, IconButton, InlineSource, JumpToLatest, MessageActions, MessageProse, Select, Surface,
  RetryButton, UnreadDivider, UserMessage, WorkspaceEditor, WorkspacePanel, WorkspaceToolButton, WorkspaceToolPill,
  type ActivityStep, type ComposerMessage, type ReplyFormat,
} from '../../../../dist/index.js';
import { Activity, Attachment, docTitle, Material, Messages, Preview, Recovery, Sources, Workspace } from '../iter2/Elements';
import { Alert as SpecimenAlert } from '../iter4/Alerts';
import type { Phase } from '../iter2/catalog';
import '../iter2/ripple.generated.css';
import '../iter2/iter2.css';
import '../iter4/iter4.css';
import { HeaderFamily } from './HeaderFamily';
import './iter5.css';

/**
 * Iter 5 · Packaged.
 *
 * Every approved chat specimen beside the `@nova-caelum/ui` component built from it — same
 * fixture data, same stage, same width, same ground. The left column imports the real Atlas
 * specimen module; the right column imports the built package from `dist`. Nothing here is a
 * new design: a visible difference between the two columns is a packaging defect, not a change.
 */

// ── Fixture data, verbatim from `studio/iter2/Elements.tsx` ─────────────────────────────
const paragraphs = [
  'The conversation can stay open while the work gains a clear place of its own.',
  'Use the graph-paper ground for continuity. A raised reading plane supports the document; a quiet activity chain keeps its history close at hand.',
  'Every new surface should explain a relationship. Open the detail when it helps, then let it return to a simple line in the conversation.',
];
const docText = `${docTitle}\n\n${paragraphs.join('\n\n')}`;
const chainSteps: ActivityStep[] = [
  { id: 'direction', kind: 'thinking', title: 'Reviewing your direction', detail: 'Keep activity quiet. Give the document its own reading plane.', detailKind: 'text' },
  { id: 'brief', kind: 'tool', title: 'Reading the workspace brief', detail: 'Read file · workspace-brief.md\n3 sections · 842 words', detailKind: 'code' },
  { id: 'spacing', kind: 'agent', title: 'Athena · checking spacing', detail: 'Compared the document plane, toolbar and conversation gutter.', detailKind: 'text' },
];
const singleThought: ActivityStep[] = [
  { id: 'layout', kind: 'thinking', title: 'Considering the layout', detail: 'I’ll compare the document plane and the conversation before choosing a layout.', detailKind: 'text' },
];
const userText = 'Keep the conversation open, and give the document a clear place of its own.';
const questionPrompts = [
  { title: 'How much detail should the review include?', choices: ['A concise overview', 'A detailed walkthrough'] },
  { title: 'Where should we start?', choices: ['The conversation', 'The document workspace'] },
];

type PairProps = { number: string; id: string; title: string; brief: string; approval: string; left: ReactNode; right: ReactNode; controls?: ReactNode; stageClass?: string };

/**
 * Scoping, and why it matters for the comparison.
 *
 * Panda emits the whole package inside `@layer recipes`, while `iter2.css` / `iter4.css` are
 * unlayered — so ANY `.iter2 …` rule beats EVERY package rule regardless of specificity. Putting
 * `iter2` on a common ancestor would therefore restyle the packaged column with Atlas CSS and make
 * the diff meaningless. `iter2` / `iter4` are applied to the specimen stage ONLY. The packaged
 * column sits on the bare `.atlas3` ground, which is the honest test: the component has to
 * reproduce the approved render with no Atlas stylesheet at all.
 */
function Pair({ number, id, title, brief, approval, left, right, controls, stageClass }: PairProps) {
  const stage = `i2-specimen${stageClass ? ` ${stageClass}` : ''}`;
  return <section className="i2-study" id={`i5-${id}`} data-pair={id}>
    <div className="iter2 i5-heading"><div className="i2-study-heading"><div><span className="i2-number">{number}</span><h3>{title}</h3><p>{brief}</p><p className="i5-note">{approval}</p></div></div></div>
    {controls && <div className="iter2 i5-heading"><div className="i2-controls">{controls}</div></div>}
    <div className="i2-comparison">
      <div className="i2-option" data-side="specimen">
        <header className="iter2 i5-heading"><div className="i2-option-heading"><span className="i5-side-tag">Approved specimen</span><div><h4>Atlas 3 source</h4><p>Imported and rendered unchanged, under its own <code>.iter2</code> / <code>.iter4</code> stylesheet.</p></div></div></header>
        <Surface layer="ground" className={`iter2 iter4 ${stage}`} data-role="specimen" aria-label={`${title} approved specimen`}>{left}</Surface>
      </div>
      <div className="i2-option" data-side="packaged">
        <header className="iter2 i5-heading"><div className="i2-option-heading"><span className="i5-side-tag" data-side="packaged">Packaged</span><div><h4>@nova-caelum/ui</h4><p>The built package alone. No Atlas stylesheet reaches this column.</p></div></div></header>
        <Surface layer="ground" className={stage} data-role="packaged" aria-label={`${title} packaged component`}>{right}</Surface>
      </div>
    </div>
  </section>;
}

function PackagedMessages({ reduced }: { reduced: boolean }) {
  const [vote, setVote] = useState('');
  return <ConversationColumn>
    <ActivityChain steps={chainSteps} activeIndex={-1} statusLabel="Working" />
    <ConversationMessage agentName="Hermes" speaker="sage">
      <MessageProse>{paragraphs.map(text => <p key={text}><ArrivingText text={text} arrival={reduced ? 'none' : 'phrase'} /></p>)}</MessageProse>
    </ConversationMessage>
    <ConversationMessage agentName="Athena" speaker="ready">
      <MessageProse><p>The document can rise one tier without enclosing the conversation.</p></MessageProse>
    </ConversationMessage>
    <MessageActions>
      <IconButton variant="text" label="Copy response" icon={<Copy size={15} />} />
      <IconButton variant="text" label="Good response" aria-pressed={vote === 'up'} icon={<ThumbsUp size={15} />} onClick={() => setVote(vote === 'up' ? '' : 'up')} />
      <IconButton variant="text" label="Poor response" aria-pressed={vote === 'down'} icon={<ThumbsDown size={15} />} onClick={() => setVote(vote === 'down' ? '' : 'down')} />
    </MessageActions>
  </ConversationColumn>;
}

function PackagedUserMessage() {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(userText);
  return <UserMessage value={text} editing={editing} onValueChange={setText} editorLabel="Edit sample message"
    actions={<>
      <IconButton variant="text" label={editing ? 'Save message' : 'Edit message'} icon={editing ? <Check size={15} /> : <Pencil size={15} />} onClick={() => setEditing(!editing)} />
      <IconButton variant="text" label="Copy message" icon={<Copy size={15} />} />
    </>} />;
}

function PackagedPreview({ state, phase }: { state: string; phase: Phase }) {
  const agent = state === 'Agent session', web = state === 'Web page';
  const [expanded, setExpanded] = useState(false);
  return <>
    <ArtifactPreview
      kind={agent ? 'agent-session' : web ? 'web' : 'document'}
      title={agent ? 'Athena · workspace review' : web ? 'Designing for quiet focus' : docTitle}
      coordinate={agent ? <>Agent session · Athena</> : web ? <>Web page · <code>example.com/quiet-focus</code></> : <>Markdown · <code>workspace-direction.md</code></>}
      phase={phase}
      fit={agent ? 'content' : 'window'}
      actions={<>
        <IconButton variant="text" label="Expand preview" icon={<Maximize2 size={14} />} onClick={() => setExpanded(true)} />
        <IconButton variant="text" label="Download preview" icon={<Download size={14} />} />
        <IconButton variant="text" label={web ? 'Copy URL' : 'Copy file path'} icon={<Copy size={14} />} />
      </>}>
      {agent
        ? <><p>The reading plane now has a clear relationship to the ground.</p>
            <ActivityChain codeSurface="top" steps={[chainSteps[1]]} activeIndex={phase === 'complete' ? -1 : 0} /></>
        : <><h5>{agent ? 'Athena · workspace review' : web ? 'Designing for quiet focus' : docTitle}</h5>{paragraphs.map((p, i) => <p key={i}>{p}</p>)}</>}
    </ArtifactPreview>
    <PackagedWorkspacePanel open={expanded} onOpenChange={setExpanded} state={state} />
  </>;
}

function PackagedToolPill({ tier }: { tier: 'top' | 'elevated-2' }) {
  return <WorkspaceToolPill tier={tier}>
    <WorkspaceToolButton label="Collapse document tools" icon={<ChevronsRight size={15} />} />
    <WorkspaceToolButton label="Edit document" icon={<Pencil size={15} />} />
    <WorkspaceToolButton label="Undo" disabled icon={<Undo2 size={15} />} />
    <WorkspaceToolButton label="Redo" disabled icon={<Redo2 size={15} />} />
    <WorkspaceToolButton label="Revert document" disabled icon={<RotateCcw size={15} />} />
    <WorkspaceToolButton label="Copy document" icon={<Copy size={15} />} />
    <WorkspaceToolButton label="Request suggestions" icon={<Flame size={15} />} />
  </WorkspaceToolPill>;
}

function PackagedWorkspaceBody({ state, editing, text, onText }: { state: string; editing: boolean; text: string; onText: (v: string) => void }) {
  if (state === 'Agent session') return <>
    <h4>Athena’s review</h4>
    <p>{paragraphs[0]}</p>
    <ActivityChain codeSurface="top" steps={chainSteps} activeIndex={-1} />
  </>;
  if (editing) return <WorkspaceEditor value={text} onValueChange={onText} />;
  return <><h4>{text.split('\n\n')[0]}</h4>{text.split('\n\n').slice(1).map((p, i) => <p key={i}>{p}</p>)}</>;
}

function PackagedWorkspace({ state, tier, placement, onFull, onClose }: { state: string; tier: 'top' | 'elevated-2'; placement?: 'inline' | 'panel'; onFull?: () => void; onClose?: () => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(docText);
  return <ArtifactWorkspace placement={placement} name="workspace-direction.md"
    meta={state === 'Agent session' ? 'Athena · agent session' : state === 'Web page' ? 'Web preview' : 'Updated 12 hours ago'}
    tools={<PackagedToolPill tier={tier} />}
    actions={<>
      {onFull && <WorkspaceToolButton label="Full screen editor" icon={<Maximize2 size={15} />} onClick={onFull} />}
      {onClose && <WorkspaceToolButton label="Toggle right side panel" icon={<PanelRight size={16} />} onClick={onClose} />}
      {!onFull && !onClose && <WorkspaceToolButton label={editing ? 'Read document' : 'Edit document'} icon={editing ? <FileText size={15} /> : <Pencil size={15} />} onClick={() => setEditing(!editing)} />}
    </>}>
    <PackagedWorkspaceBody state={state} editing={editing} text={text} onText={setText} />
  </ArtifactWorkspace>;
}

function PackagedWorkspacePanel({ open, onOpenChange, state }: { open: boolean; onOpenChange: (v: boolean) => void; state: string }) {
  const [full, setFull] = useState(false);
  return <WorkspacePanel open={open} onOpenChange={onOpenChange} full={full}
    title={state === 'Agent session' ? 'Athena agent session' : 'Document workspace'}>
    <PackagedWorkspace state={state} tier="top" placement="panel" onFull={() => setFull(!full)} onClose={() => onOpenChange(false)} />
  </WorkspacePanel>;
}

function PackagedPermission() {
  const [draft, setDraft] = useState('');
  const [model, setModel] = useState('Fixture model');
  const [reasoning, setReasoning] = useState('Standard');
  const [replyFormat, setReplyFormat] = useState<ReplyFormat>('text');
  const [notice, setNotice] = useState('Packaged alert. The orchestration below is the same production Composer.');
  return <div className="i2-interaction">
    <AlertStage>
      <PackagedAlert material="tonal" tone="progress" edge="system" glow
        icon={<KeyRound size={16} />} kicker="Permission"
        title="May I save the workspace direction?"
        lede="This creates a local document you can open and review."
        command="write_file · workspace-direction.md"
        actions={<>
          <Button danger variant="text" onClick={() => setNotice('Denied. No file was written.')}>Deny</Button>
          <Button variant="tonal" onClick={() => setDraft('clarifying question: ')}>Clarify</Button>
          <Button variant="primary" onClick={() => setNotice('Allowed. The fixture file is saved.')}>Allow <kbd>⌘↵</kbd></Button>
        </>} />
      <div className="i2-composer-host"><Composer value={draft} onValueChange={setDraft} onSend={(m: ComposerMessage) => setNotice(`Sent: ${m.text}`)}
        label="Iter 5 packaged permission composer" placeholder="What’s on your mind?"
        model={model} models={['Fixture model', 'Fixture model B']} onModelChange={setModel}
        reasoning={reasoning} reasoningLevels={['Standard', 'Extended']} onReasoningChange={setReasoning}
        replyFormat={replyFormat} onReplyFormatChange={setReplyFormat}
        agents={[{ id: 'hermes', name: 'Hermes' }]} activeAgentId="hermes" /></div>
    </AlertStage>
    <div className="i2-fixture-log"><p role="status">{notice}</p></div>
  </div>;
}

function PackagedQuestion() {
  const [draft, setDraft] = useState('');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(['', '']);
  const [model, setModel] = useState('Fixture model');
  const [reasoning, setReasoning] = useState('Standard');
  const [replyFormat, setReplyFormat] = useState<ReplyFormat>('text');
  const [notice, setNotice] = useState('Packaged alert. A choice answers immediately; Other focuses the composer.');
  const answer = (value: string) => {
    const next = [...answers]; next[index] = value; setAnswers(next);
    const missing = next.findIndex(a => !a.trim());
    if (missing < 0) setNotice(`Submitted: ${next.join(' · ')}.`); else { setIndex(missing); setNotice('Answer recorded. Choose the next answer.'); }
  };
  return <div className="i2-interaction">
    <AlertStage>
      <PackagedAlert material="glass" tone="none"
        icon={<MessageCircleQuestion size={16} />}
        title={questionPrompts[index].title}
        kicker={`Question ${index + 1} of ${questionPrompts.length}`}
        pager={<>
          <IconButton variant="text" label="Previous question" icon={<ChevronLeft size={15} />} disabled={index === 0} onClick={() => setIndex(index - 1)} />
          <IconButton variant="text" label="Next question" icon={<ChevronRight size={15} />} disabled={index === questionPrompts.length - 1} onClick={() => setIndex(index + 1)} />
        </>}
        choices={<>
          {questionPrompts[index].choices.map(choice => <Button variant="tonal" key={choice} aria-pressed={answers[index] === choice} onClick={() => answer(choice)}><span>{choice}</span>{answers[index] === choice && <Check size={15} />}</Button>)}
          <Button variant="tonal" onClick={() => setDraft('other answer: ')}><span>Other</span></Button>
        </>} />
      <div className="i2-composer-host"><Composer value={draft} onValueChange={setDraft} onSend={(m: ComposerMessage) => setNotice(`Sent: ${m.text}`)}
        label="Iter 5 packaged question composer" placeholder="What’s on your mind?"
        model={model} models={['Fixture model', 'Fixture model B']} onModelChange={setModel}
        reasoning={reasoning} reasoningLevels={['Standard', 'Extended']} onReasoningChange={setReasoning}
        replyFormat={replyFormat} onReplyFormatChange={setReplyFormat}
        agents={[{ id: 'hermes', name: 'Hermes' }]} activeAgentId="hermes" /></div>
    </AlertStage>
    <div className="i2-fixture-log"><p role="status">{notice}</p></div>
  </div>;
}

function PackagedFileCard({ state, reduced }: { state: string; reduced: boolean }) {
  const [retried, setRetried] = useState(false);
  const [open, setOpen] = useState(false);
  const status = retried ? 'ready' : state === 'Failed' ? 'failed' : state === 'Uploading' ? 'uploading' : 'ready';
  return <div>
    <FileCard status={status as 'ready' | 'uploading' | 'failed'}
      name="workspace-direction-review.pdf"
      detail={status === 'failed' ? 'Upload interrupted' : status === 'uploading' ? 'Uploading · 64%' : 'PDF · 248 KB'}
      onOpen={() => setOpen(true)} onRetry={() => setRetried(true)} />
    <PackagedWorkspacePanel open={open} onOpenChange={setOpen} state="Document" />
    <span hidden>{String(reduced)}</span>
  </div>;
}

function PackagedSources({ state }: { state: string }) {
  return <MessageProse>
    <p>Give the document a distinct reading plane, as outlined in <InlineSource href="https://example.com/workspace-guide">Workspace guide</InlineSource>. Keep the activity history close enough to inspect without interrupting the response.
      {state === 'Several sources' && <> The <InlineSource href="https://example.com/spacing-reference">Spacing reference</InlineSource> describes how related elements share space.</>}</p>
    <p className="i2-meta">Fixture sources · example.com</p>
  </MessageProse>;
}

function PackagedRecovery({ state, reduced }: { state: string; reduced: boolean }) {
  const [resolved, setResolved] = useState(false);
  if (resolved) return <p className="i2-muted" role="status">{state === 'Error' || state === 'Interrupted' ? 'Response resumed. Your conversation is intact.' : 'You’re at the latest message.'}</p>;
  if (state === 'Unread') return <MessageProse>
    <p>The document now has its own reading plane.</p>
    <UnreadDivider>New messages</UnreadDivider>
    <p>The conversation remains open around it.</p>
  </MessageProse>;
  if (state === 'Error' || state === 'Interrupted') return <CompactError
    action={<RetryButton label="Retry response" onClick={() => setResolved(true)} />}>
    {state === 'Error' ? 'The connection dropped. Your message is saved.' : 'Response stopped. Continue when you’re ready.'}
  </CompactError>;
  return <JumpToLatest state={state === 'Working below' ? 'working' : 'latest'} caption="You’re reading earlier in the conversation."
    onClick={() => setResolved(true)} />;
}

export function IterationFive() {
  const [reduced, setReduced] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [phase, setPhase] = useState<Phase>('complete');
  const [previewState, setPreviewState] = useState('Artifact');
  const [workspaceState, setWorkspaceState] = useState('Document');
  const [toolTier, setToolTier] = useState<'top' | 'elevated-2'>('top');
  const [fileState, setFileState] = useState('Ready');
  const [sourceState, setSourceState] = useState('One source');
  const [recoveryState, setRecoveryState] = useState('Error');
  const specimen = { variant: 'a' as const, phase, reduced };

  return <CaelosProvider className="iter5" theme={theme} reducedMotion={reduced}>
    <header className="iter2 i5-heading i2-intro">
      <div>
        <p className="i2-eyebrow">Studio / Iter 5 · Packaged</p>
        <h2>Every approved specimen, beside the component built from it.</h2>
        <p>Left: the Atlas 3 module Daniel approved, imported unchanged. Right: the PandaCSS component in <code>@nova-caelum/ui</code>, imported from the built package. Same fixture data, same stage, same width. A visible difference is a packaging defect, not a design change.</p>
      </div>
      <div className="i2-review-summary"><span className="i2-meta">Nothing here is approved by being built. Iter 1–4 are untouched.</span></div>
    </header>

    <div className="iter2 i5-heading i2-global-controls">
      <label className="i2-check"><Checkbox checked={reduced} onChange={e => setReduced(e.target.checked)} />Reduced motion</label>
      <Select label="Theme" value={theme} onValueChange={v => setTheme(v as 'dark' | 'light')} options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} />
      <Select label="Phase" value={phase} onValueChange={v => setPhase(v as Phase)} options={[{ value: 'waiting', label: 'Waiting' }, { value: 'working', label: 'In progress' }, { value: 'complete', label: 'Final' }]} />
      <span className="i2-meta">Scratch comparison · local fixtures · nothing promoted</span>
    </div>

    <div className="i2-studies">
      <Pair number="01" id="activity-chain" title="Activity · connected chain" approval="Approved: option A + Iter 3.5 changes."
        brief="Three steps, the count summary, the status mark and chevron beside each label."
        left={<Activity {...specimen} state="Connected chain" />}
        right={<ActivityChain steps={chainSteps} activeIndex={phase === 'complete' ? -1 : chainSteps.length - 1} statusLabel={phase === 'waiting' ? 'Waiting' : 'Working'} />} />

      <Pair number="01" id="activity-single" title="Activity · single row" approval="Approved: option A + Iter 3.5 changes."
        brief="One row, no count summary, the leading dot anchor instead."
        left={<Activity {...specimen} state="Single thought" />}
        right={<ActivityChain steps={singleThought} activeIndex={phase === 'complete' ? -1 : 0} statusLabel={phase === 'waiting' ? 'Waiting' : 'Working'} />} />

      <Pair number="02" id="messages" title="Agent messages" approval={'Approved: "Perfect!!! you got it!"'}
        brief="Inline names, unboxed indented text, two agents in one turn."
        left={<Messages {...specimen} state="Multiple agents" />}
        right={<PackagedMessages reduced={reduced} />} />

      <Pair number="03" id="user-message" title="User message" approval="Approved: option A, composer-matched fill."
        brief="The composer's own fill and diffusion, one hairline edge."
        left={<Material {...specimen} state="User message" />}
        right={<PackagedUserMessage />} />

      <Pair number="04" id="preview" title="Inline preview" approval={'Approved: option B "Strip and paper", glass-to-paper blend.'}
        brief="All three kinds and all three phases. The fade applies only when content really overruns."
        controls={<Select label="Preview kind" showLabel value={previewState} onValueChange={setPreviewState}
          options={[{ value: 'Artifact', label: 'Document' }, { value: 'Web page', label: 'Web page' }, { value: 'Agent session', label: 'Agent session' }]} />}
        left={<Preview variant="b" state={previewState} phase={phase} reduced={reduced} />}
        right={<PackagedPreview state={previewState} phase={phase} />} />

      <Pair number="05" id="workspace" title="Expanded workspace" approval={'Approved: option B, non-modal panel, tool pill on the top tier.'}
        brief="Inline reading plane, tool pill and the non-modal side panel. The written approval says the pill is on `top`; the live specimen renders `elevated-2` — switch the tier control to see both."
        stageClass="i2-specimen-workspace"
        controls={<>
          <Select label="Workspace kind" showLabel value={workspaceState} onValueChange={setWorkspaceState}
            options={[{ value: 'Document', label: 'Document' }, { value: 'Agent session', label: 'Agent session' }]} />
          <Select label="Packaged tool-pill tier" showLabel value={toolTier} onValueChange={v => setToolTier(v as 'top' | 'elevated-2')}
            options={[{ value: 'top', label: 'top · written approval' }, { value: 'elevated-2', label: 'elevated-2 · live specimen' }]} />
        </>}
        left={<Workspace variant="b" state={workspaceState} phase={phase} reduced={reduced} />}
        right={<PackagedWorkspace state={workspaceState} tier={toolTier} />} />

      <Pair number="06" id="permission" title="Permission alert" approval="Approved: Iter 4 option A — peach-gold tonal wash, neutral hairline edge."
        brief="Above the composer, at the composer's width, 10px apart."
        left={<SpecimenAlert kind="permission" tone="gold" glow edge="system" id="i5" />}
        right={<PackagedPermission />} />

      <Pair number="07" id="questions" title="Question alert" approval="Approved: Iter 4 option A — package glass card, cream ink."
        brief="The same anatomy in glass. A question claims no state, so it carries no semantic colour."
        left={<SpecimenAlert kind="questions" tone="none" id="i5" />}
        right={<PackagedQuestion />} />

      <Pair number="08" id="file-card" title="File card" approval="Approved: option A, the two-line card."
        brief="Ready, uploading and failed. The failed state takes the danger token set complete; retry lifts on the button tokens."
        controls={<Select label="File state" showLabel value={fileState} onValueChange={setFileState}
          options={[{ value: 'Ready', label: 'Ready' }, { value: 'Uploading', label: 'Uploading' }, { value: 'Failed', label: 'Failed' }]} />}
        left={<Attachment variant="a" state={fileState} phase={phase} reduced={reduced} progress={fileState === 'Uploading' ? 3000 : undefined} />}
        right={<PackagedFileCard state={fileState} reduced={reduced} />} />

      <Pair number="09" id="sources" title="Inline sources" approval="Reviewed: direction A, the quiet chip."
        brief="Part of the sentence, never a card. Hover or focus reveals the name and URL."
        controls={<Select label="Source count" showLabel value={sourceState} onValueChange={setSourceState}
          options={[{ value: 'One source', label: 'One source' }, { value: 'Several sources', label: 'Several sources' }]} />}
        left={<Sources variant="a" state={sourceState} phase={phase} reduced={reduced} />}
        right={<PackagedSources state={sourceState} />} />

      <Pair number="10" id="recovery" title="Orientation and recovery" approval="UNCONFIRMED — direction A recorded, requested refinement not built."
        brief="The unread divider, the compact error and the jump control."
        controls={<Select label="Recovery state" showLabel value={recoveryState} onValueChange={setRecoveryState}
          options={[{ value: 'Unread', label: 'Unread' }, { value: 'Error', label: 'Error' }, { value: 'Interrupted', label: 'Interrupted' }, { value: 'Working below', label: 'Working below' }, { value: 'Finished below', label: 'Finished below' }]} />}
        left={<Recovery variant="a" state={recoveryState} phase={phase} reduced={reduced} />}
        right={<PackagedRecovery state={recoveryState} reduced={reduced} />} />

      <HeaderFamily title="Design the next conversation header" />
    </div>

    <footer className="iter2 i5-heading i2-footnote">
      Packaged from the approved Atlas 3 specimens on 2026-09-20, and from the approved Atlas 2 conversation
      header family the same night. The header family's blocks carry no specimen column because their source
      lives in a different checkout and cannot be imported here; they were compared across servers against the
      live study on 127.0.0.1:5183. Every non-token value carried into the package is listed in
      <code> 03_PandaComponents_Report.md</code> and <code>03b_PandaHeader_Report.md</code>.
    </footer>
  </CaelosProvider>;
}
