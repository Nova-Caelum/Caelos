import { useState, type ReactNode } from 'react';
import { Activity, Check, Hand, KeyRound, Minus, MessageCircleQuestion, Rocket, ShieldAlert } from 'lucide-react';
import {
  AgentDetailCard, Button, ContextRing, ConversationHeader, Input, InlineCluster,
  LinkedWorkDivider, LinkedWorkLinks, LinkedWorkTrigger, Section, Select, Stack, Surface, Text,
  WorkingFilesList, type WorkingFile,
} from '../../../../dist/index.js';
import { ClaudeCodeIcon, CodexIcon, HermesIcon } from '../icons/HarnessIcons';

/**
 * Iter 5 · the Atlas 2 conversation header family, packaged.
 *
 * WHY THIS BLOCK HAS NO SPECIMEN COLUMN. Every other pair in Iter 5 imports its approved
 * specimen from `studio/iter2`, one folder away. The header family's specimens live in the
 * Atlas 2 folder in a different checkout: they import `@/app/App`, `task-graph-details.tsx`
 * and `checkout-files.tsx` from the React 18 `Caelos-console`, which Atlas 3's `@` alias
 * points somewhere else entirely, and they sit outside this dev server's `fs.allow`. Importing
 * them here is not possible without editing Atlas 2, which is out of bounds.
 *
 * So the comparison is made ACROSS SERVERS instead: this column at 5187 against the live
 * approved study at 5183, at the same state and the same width, measured from the DOM. The
 * controls below are the study's own controls, so the two can be put into identical states.
 */

const modelOptions = ['Model A', 'Model B', 'Model C'];
const reasoningOptions = ['Low', 'Medium', 'High'];

const permissionOptions = [
  { value: 'Ask before acting', label: 'Ask for everything', icon: <Hand size={16} aria-hidden="true" /> },
  { value: 'Approve routine actions', label: 'Approve routine actions', icon: <KeyRound size={16} aria-hidden="true" /> },
  { value: 'Full access', label: 'Full access', icon: <Rocket size={16} aria-hidden="true" /> },
];

/** The study's six demo agents, value for value. Local fixtures, not live telemetry. */
const agents = [
  { name: 'Hermes', model: 'Model A', capacity: 200000, used: 76000, status: '2 subagents', mark: '2', surface: 'Caelos Console' },
  { name: 'Athena', model: 'Model B', capacity: 128000, used: 106240, status: 'Permission needed', mark: '!', surface: 'Desktop' },
  { name: 'Design Lead', model: 'Model A', capacity: 200000, used: 114000, status: 'Answer needed', mark: '?', surface: '' },
  { name: 'Engineer', model: 'Model C', capacity: 100000, used: 92000, status: 'Working', mark: '', surface: 'Terminal' },
  { name: 'Research', model: 'Model B', capacity: 128000, used: 39680, status: 'Working', mark: '', surface: 'Browser' },
  { name: 'Reviewer', model: 'Model C', capacity: 100000, used: null as number | null, status: 'Idle', mark: '', surface: '' },
].map((agent, index) => ({
  ...agent,
  harness: index === 0 ? 'Claude Code' : 'Codex',
  reasoning: index === 0 ? 'High' : 'Medium',
  files: [{ name: 'ConversationHeader.tsx', active: index === 0 || index === 3 }, { name: 'agent-details.css', active: false }],
  subagents: index === 0 ? [
    { name: 'Research assistant', working: true, activity: 'Reviewing the approved composer interaction rules.' },
    { name: 'Code explorer', working: false, activity: 'Located the shared Avatar, Popover, and Progress implementations.' },
  ] : [],
  background: index === 0 ? [{ name: 'Workspace index', running: true, progress: 52 }] : [],
  statusDetail: ['Coordinating research and component review.', 'Waiting for permission to run the UI typecheck.', 'Waiting for a choice of surface to validate.', 'Checking the conversation header layout.', 'Reviewing design references.', 'No work is currently running.'][index],
  since: ['Working since 10:42 · demo', 'Waiting since 10:44 · demo', 'Waiting since 10:45 · demo', 'Working since 10:46 · demo', 'Working since 10:47 · demo', 'Idle since 10:48 · demo'][index],
}));

const workingFileFixtures: WorkingFile[] = [
  { name: 'ConversationHeader.tsx', path: '/preview/caelos/ConversationHeader.tsx', summary: 'Keeps the conversation title anchored as the participant cluster separates.', hasDiff: true },
  { name: 'agent-details.css', path: '/preview/caelos/agent-details.css', summary: 'Aligns the agent details, compact controls, and file actions to a shared reading column.' },
];

const statusIconFor = (status: string) =>
  status === 'Permission needed' ? <ShieldAlert size={18} aria-hidden="true" />
    : status === 'Answer needed' ? <MessageCircleQuestion size={18} aria-hidden="true" />
      : status === 'Idle' ? <Minus size={18} aria-hidden="true" />
        : <Activity size={18} aria-hidden="true" />;

const harnessMarkFor = (harness: string) =>
  harness === 'Claude Code' ? <ClaudeCodeIcon size={18} />
    : harness === 'Codex' ? <CodexIcon size={18} />
      : harness === 'Hermes' ? <HermesIcon size={18} /> : null;

function PackagedAgentCard({ index, shape, owner }: { index: number; shape: 'capsule' | 'rounded'; owner: string }) {
  const agent = agents[index];
  const [surface, setSurface] = useState(agent.surface);
  const [permission, setPermission] = useState(index === 5 ? 'Full access' : 'Ask before acting');
  const [model, setModel] = useState(agent.model);
  const [reasoning, setReasoning] = useState(agent.reasoning);
  const [expanded, setExpanded] = useState<string | null>(null);
  const status = agent.status === '2 subagents' ? 'Working' : agent.status;
  const blocked = agent.status === 'Permission needed' || agent.status === 'Answer needed';
  return <AgentDetailCard
    name={agent.name}
    shape={shape}
    owner={owner}
    contextRing={<ContextRing shape={shape} percent={agent.used === null ? null : Math.round(agent.used / agent.capacity * 100)} />}
    profilePopover="Agent profile and loadout will open here"
    harness={harnessMarkFor(agent.harness)}
    harnessLabel={agent.harness}
    surface={surface}
    onSurfaceChange={setSurface}
    status={status}
    statusIcon={statusIconFor(agent.status)}
    statusDetail={agent.statusDetail}
    since={agent.since}
    blocked={blocked}
    sessionId={`demo-session-${String(index + 1).padStart(2, '0')}`}
    used={agent.used}
    capacity={agent.capacity}
    permission={permission}
    permissionOptions={permissionOptions}
    onPermissionChange={setPermission}
    model={model}
    modelOptions={modelOptions}
    onModelChange={setModel}
    reasoning={reasoning}
    reasoningOptions={reasoningOptions}
    onReasoningChange={setReasoning}
    subagents={agent.subagents}
    background={agent.background}
    files={agent.files}
    workingFiles={<WorkingFilesList
      owner={owner}
      files={workingFileFixtures.map(file => ({ ...file, active: agent.files.some(item => item.active && item.name === file.name) }))}
      expanded={expanded}
      onExpandedChange={setExpanded}
    />}
  />;
}

function PackagedHeader({ shape, count, constrained, title }: {
  shape: 'capsule' | 'rounded'; count: number; constrained: boolean; title: string;
}) {
  const owner = `i5-header-${shape}`;
  const [linkedOpen, setLinkedOpen] = useState(false);
  const [link, setLink] = useState('Caelos Console · NC-142');
  const [draft, setDraft] = useState(link);
  const [linkOpen, setLinkOpen] = useState(false);
  const [project, item] = link.split(' · ');
  return <ConversationHeader
    title={title}
    shape={shape}
    constrained={constrained}
    owner={owner}
    participants={agents.slice(0, count).map(agent => ({
      name: agent.name,
      contextPercent: agent.used === null ? null : Math.round(agent.used / agent.capacity * 100),
      status: agent.status,
      mark: agent.mark,
    }))}
    chatId="nc-chat-id · demo-0142"
    linkedWorkOpen={linkedOpen}
    linkedWork={<LinkedWorkLinks>
      <LinkedWorkTrigger label={project} ariaLabel={`Preview project: ${project}`} owner={owner} onOpenChange={setLinkedOpen}>
        <div style={{ padding: 21 }}><Text as="p" variant="small" tone="muted">
          Preview body. In the app this is the Task Graph; the package supplies the attachment, the geometry and the motion only.
        </Text></div>
      </LinkedWorkTrigger>
      <LinkedWorkDivider />
      <LinkedWorkTrigger label={item} ariaLabel={`Preview module: ${item}`} owner={owner} onOpenChange={setLinkedOpen}>
        <div style={{ padding: 21 }}><Text as="p" variant="small" tone="muted">Module preview body.</Text></div>
      </LinkedWorkTrigger>
    </LinkedWorkLinks>}
    linkOpen={linkOpen}
    onLinkOpenChange={setLinkOpen}
    linkPopover={<div style={{ padding: 21 }}>
      <Section level={3} title={<Text>Link project or work item</Text>} description={<Text variant="small" tone="muted">Project, module, or task</Text>}>
        <form onSubmit={event => { event.preventDefault(); if (draft.trim()) setLink(draft.trim()); setLinkOpen(false); }}>
          <InlineCluster>
            <Input autoFocus aria-label="Project, module, or task" value={draft} onChange={event => setDraft(event.target.value)} />
            <Button type="submit">Link</Button>
          </InlineCluster>
        </form>
      </Section>
    </div>}
    renderParticipantDetail={(_participant, index) => <PackagedAgentCard index={index} shape={shape} owner={owner} />}
  />;
}

/** A packaged-only block. The plate says where its specimen lives and how it was compared. */
function SoloPair({ number, id, title, brief, approval, note, controls, children }: {
  number: string; id: string; title: string; brief: string; approval: string; note: string;
  controls?: ReactNode; children: ReactNode;
}) {
  return <section className="i2-study" id={`i5-${id}`} data-pair={id}>
    <div className="iter2 i5-heading"><div className="i2-study-heading"><div>
      <span className="i2-number">{number}</span><h3>{title}</h3><p>{brief}</p><p className="i5-note">{approval}</p>
    </div></div></div>
    {controls && <div className="iter2 i5-heading"><div className="i2-controls">{controls}</div></div>}
    <div className="i2-comparison" data-solo="true">
      <div className="i2-option" data-side="packaged">
        <header className="iter2 i5-heading"><div className="i2-option-heading">
          <span className="i5-side-tag" data-side="packaged">Packaged</span>
          <div><h4>@nova-caelum/ui</h4><p>{note}</p></div>
        </div></header>
        <Surface layer="ground" className="i2-specimen i5-header-stage" data-role="packaged" aria-label={`${title} packaged component`}>{children}</Surface>
      </div>
    </div>
  </section>;
}

export function HeaderFamily({ title }: { title: string }) {
  const [count, setCount] = useState(4);
  const [constrained, setConstrained] = useState(false);
  const [detailIndex, setDetailIndex] = useState(0);

  return <>
    <SoloPair
      number="f1·f2" id="conversation-header" title="Conversation header and participant roster"
      brief="Both shapes, 420×112 at rest and 468×142 pinned, with the fixed 88×76 participant field. Hover completes the title; click separates the roster; avatar buttons come alive only once pinned."
      approval={'Approved: Atlas 2 as it stands — Daniel: "The header is flawless."'}
      note="The approved specimen lives in Atlas 2 on 127.0.0.1:5183 and cannot be imported here. Compared across servers at the same state and width; measurements are in 03b_PandaHeader_Report.md."
      controls={<>
        <InlineCluster role="group" aria-label="Participant count">
          <Text variant="small" tone="muted">Participants</Text>
          {[1, 2, 3, 4, 5, 6].map(n => <Button key={n} aria-label={`${n} participants`} aria-pressed={count === n}
            forcedState={count === n ? 'active' : 'rest'} onClick={() => setCount(n)}>{n}</Button>)}
        </InlineCluster>
        <Button aria-pressed={constrained} onClick={() => setConstrained(!constrained)}>
          {constrained ? 'Full width' : 'Test constrained width'}
        </Button>
      </>}
    >
      <div className="i5-header-frame">
        {(['capsule', 'rounded'] as const).map(shape => <div className="i5-header-candidate" key={shape}>
          <Text className="i5-header-label" variant="small" tone="muted">
            {shape === 'capsule' ? 'A · Capsule / circular avatars' : 'B · Rounded Card / square avatars'}
          </Text>
          <PackagedHeader shape={shape} count={count} constrained={constrained} title={title} />
        </div>)}
      </div>
    </SoloPair>

    <SoloPair
      number="f3" id="agent-detail" title="Agent detail card · profile"
      brief="376px, two planes joined by a 30px material fade. Status reads icon → word → detail; the bot mark appears only with subagents; work rows are closed with the live item showing through."
      approval="Approved: Atlas 2 as it stands, the profile layout. The older triage layout is deliberately not packaged."
      note="Rendered outside its popover host so all six agents can be seen at once — the same adapter the Gallery used. Geometry is compared in situ against 5183."
      controls={<Select label="Agent" showLabel value={String(detailIndex)} onValueChange={value => setDetailIndex(Number(value))}
        options={agents.map((agent, index) => ({ value: String(index), label: agent.name }))} />}
    >
      <Stack className="i5-card-wall">
        {(['capsule', 'rounded'] as const).map(shape => <div key={shape} className="i5-card-host" data-nc-detail-host="" data-layout="profile" data-shape={shape}>
          <PackagedAgentCard index={detailIndex} shape={shape} owner={`i5-card-${shape}`} />
        </div>)}
      </Stack>
    </SoloPair>

    <SoloPair
      number="f5" id="working-files" title="Working files"
      brief="Name, disclosure, dead zone and diff icon on a 36px row, with the context menu and the drawer hook. The list asks; the host opens the panel."
      approval="Approved: Atlas 2 as it stands."
      note="Standalone, with its own heading visible — inside the agent card that heading is hidden. Right-click a row for the menu."
    >
      <div style={{ width: 330 }}>
        <WorkingFilesList owner="i5-files" files={workingFileFixtures.map((file, i) => ({ ...file, active: i === 0 }))} />
      </div>
    </SoloPair>
  </>;
}
