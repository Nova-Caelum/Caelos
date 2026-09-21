import { useEffect, useRef, useState } from 'react';
import { Badge, Button, CaelosProvider, Checkbox, Composer, Dialog, FieldGroup, InlineCluster, Inset, Range, Section, SectionStack, Select, Stack, Surface, TabsContent, TabsList, TabsRoot, TabsTrigger, type ComposerMessage, type ReplyFormat } from '../../../dist/index.js';
import { BaselineItem, BaselineTranscript, DocumentBody } from './Baseline';
import { CandidateItem, CandidateTranscript } from './Candidate';
import { nextRecovery, resolveScenario, scenarios, snapshots, stateLabels, type Decision, type LabItem } from './fixtures';
import { UnreadMarker } from './InteractionCard';
import './lab.css';

type View = 'states' | 'playback' | 'conversation';
type Comparison = 'current' | 'candidate' | 'side-by-side';
const participants = [{ id: 'hermes', name: 'Hermes', description: 'Simulated coordinator' }, { id: 'athena', name: 'Athena', description: 'Simulated review agent' }];

export function ChatUILab() {
  const [scenarioId, setScenarioId] = useState('text');
  const [decision, setDecision] = useState<Decision>();
  const [answer, setAnswer] = useState('');
  const [readThrough, setReadThrough] = useState(0);
  const replaying = useRef(false);
  const scenario = resolveScenario(scenarios.find(s => s.id === scenarioId)!, decision);
  const [view, setView] = useState<View>('conversation');
  const [comparison, setComparison] = useState<Comparison>('current');
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [speed, setSpeed] = useState('1');
  const [reduced, setReduced] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [width, setWidth] = useState(1000);
  const [epoch, setEpoch] = useState(0);
  const [draft, setDraft] = useState('');
  const [prompt, setPrompt] = useState('');
  const [pendingSend, setPendingSend] = useState(false);
  const [lastSend, setLastSend] = useState<ComposerMessage>();
  const [sendCount, setSendCount] = useState(0);
  const [model, setModel] = useState('Fixture model');
  const [reasoning, setReasoning] = useState('Standard');
  const [replyFormat, setReplyFormat] = useState<ReplyFormat>('text');
  const [goal, setGoal] = useState('');
  const [instruction, setInstruction] = useState('');
  const [attached, setAttached] = useState(false);
  const [live, setLive] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState('hermes');
  const [agentAdded, setAgentAdded] = useState(false);
  const [notice, setNotice] = useState('Ready. Choose a scenario or type in the composer.');
  const [expanded, setExpanded] = useState<LabItem>();
  const [primaryComposer, setPrimaryComposer] = useState<HTMLDivElement | null>(null);
  const primaryTextarea = useRef<HTMLTextAreaElement>(null);
  const lanes = comparison === 'side-by-side' ? ['current', 'candidate'] : [comparison];
  const sending = started && !stopped && time < scenario.duration;
  const playbackEnd = scenario.gate && !decision ? scenario.gate.at : scenario.duration;
  const blocked = started && !!scenario.gate && !decision && time >= scenario.gate.at;

  // One clock drives both renderers. A seek is a pure projection of fixture time.
  useEffect(() => {
    if (!playing || time >= playbackEnd) return;
    const timer = window.setInterval(() => setTime(t => Math.min(playbackEnd, t + 100 * Number(speed))), 100);
    return () => window.clearInterval(timer);
  }, [playing, speed, playbackEnd, time >= playbackEnd]);
  useEffect(() => { if (time >= playbackEnd) setPlaying(false); }, [time, playbackEnd]);

  // Populate the controlled value, let React commit, then activate the composer's
  // existing Send button. Never call the host onSend directly from scenario controls.
  useEffect(() => {
    if (!pendingSend) return;
    const button = primaryComposer?.querySelector<HTMLButtonElement>('[data-testid="send-button"]');
    if (button && !button.disabled) {
      setPendingSend(false);
      button.click();
    }
  }, [pendingSend, draft, primaryComposer]);

  function reset() {
    setPlaying(false); setTime(0); setStarted(false); setStopped(false); setPendingSend(false);
    setDraft(''); setPrompt(''); setLastSend(undefined); setSendCount(0); setExpanded(undefined);
    setGoal(''); setInstruction(''); setAttached(false); setLive(false); setAgentAdded(false); setActiveAgentId('hermes');
    setModel('Fixture model'); setReasoning('Standard'); setReplyFormat('text');
    setDecision(undefined); setAnswer(''); setReadThrough(0); replaying.current = false;
    setEpoch(e => e + 1); setNotice('Lab reset. No real conversations were accessed.');
  }
  function run(text = scenario.prompt, replay = false) {
    replaying.current = replay;
    if (!replay) { setDecision(undefined); setAnswer(''); }
    setPlaying(false); setStarted(false); setStopped(false); setTime(0); setExpanded(undefined);
    if (view === 'states') setView('conversation');
    setDraft(text); setPendingSend(true);
  }
  function send(message: ComposerMessage) {
    if (!replaying.current) { setDecision(undefined); setAnswer(''); }
    replaying.current = false;
    setReadThrough(scenario.unreadAfter ?? 0);
    setLastSend(message); setSendCount(n => n + 1); setPrompt(message.text); setDraft('');
    setTime(0); setStarted(true); setStopped(false); setExpanded(undefined); setEpoch(e => e + 1);
    setPlaying(scenario.duration > 0);
    setNotice(scenario.id === 'empty' ? 'Composer send received. This fixture intentionally leaves the conversation empty.' : 'Composer send received. Playing the selected fixture; no AI request was made.');
  }
  function seek(value: number) {
    setPlaying(false); setStopped(false); setTime(Math.min(value, playbackEnd)); setStarted(true);
    if (scenario.unreadAfter !== undefined) { setReadThrough(scenario.unreadAfter); setEpoch(e => e + 1); }
    if (value > playbackEnd) setNotice('Playback is waiting for your decision. Answer in the conversation to continue.');
    if (!prompt) setPrompt(scenario.prompt);
  }
  function recover(item: LabItem) {
    setTime(Math.min(playbackEnd, stopped ? time + 100 : nextRecovery(item, time) ?? time));
    setStopped(false); setPlaying(true); setNotice('Resuming the deterministic fixture.');
  }
  function recordDecision(value: Decision) {
    if (!scenario.gate || decision) return;
    setDecision(value); setTime(scenario.gate.at + 100); setStopped(false); setPlaying(true);
    setNotice(`Recorded ${scenario.gate.kind === 'approval' ? 'permission' : 'answer'}: ${value.value}. Replay retains this branch; Run scenario asks again. Simulation only.`);
  }
  function changeView(value: string) {
    setView(value as View);
    if (value === 'states') setPlaying(false);
  }
  const transcriptProps = { scenario, time, started, prompt, stopped, epoch, onExpand: setExpanded, onRecover: recover, interaction: { answer, locked: !!decision, onAnswer: setAnswer, onDecision: recordDecision }, readThrough, onRead: setReadThrough };
  const events = scenario.items.flatMap(item => item.stages.map(stage => ({ item, stage }))).sort((a, b) => a.stage.at - b.stage.at);

  return <CaelosProvider className="chat-ui-lab" theme={theme} reducedMotion={reduced || view === 'states'}>
    <div className="lab-intro"><h2>Chat UI Lab</h2><InlineCluster><Badge>Simulation only</Badge><span>Local fixtures · no AI backend · composer locked</span></InlineCluster><p>Exercise primitive compositions and local experiments in context. These are not faithful staging baselines. Candidate explores sources, web previews, unified work steps, word reveal, and user questions. All experiments stay local to this lab.</p></div>
    <div className="lab-layout">
      <Surface as="aside" layer="chrome" className="lab-controls" aria-label="Scenario controls">
        <Inset><SectionStack>
          <Section title="Scenario panel" description="Lab controls live outside the product UI.">
            <FieldGroup>
              <Select label="Scenario" showLabel variant="field" value={scenarioId} onValueChange={id => { reset(); setScenarioId(id); }} options={scenarios.map(s => ({ value: s.id, label: s.name }))} />
              <div><h3 className="lab-label">Prompt</h3><p className="lab-copy" data-testid="scenario-prompt">{scenario.prompt}</p></div>
              <div><h3 className="lab-label">Expected sequence</h3><ol className="lab-sequence">{scenario.sequence.map(step => <li key={step}>{step}</li>)}</ol></div>
              <Button variant="primary" onClick={() => run()}>Run scenario</Button>
              <p className="lab-help">Run fills the real composer and presses its Send control. Free typing uses the same selected fixture. Models, agents, voice preferences and attachments are simulated.</p>
            </FieldGroup>
          </Section>
          <Section title="Playback controls">
            <FieldGroup>
              <InlineCluster><Button size="sm" disabled={scenario.duration === 0 || blocked} onClick={() => {
                if (view === 'states') setView('playback');
                if (!started) run(); else if (time >= scenario.duration) run(prompt || scenario.prompt, true); else { setStopped(false); setPlaying(p => !p); }
              }}>{playing ? 'Pause' : 'Play'}</Button><Button size="sm" onClick={() => run(lastSend?.text || scenario.prompt, true)}>Replay</Button><Button size="sm" onClick={reset}>Reset lab</Button></InlineCluster>
              {blocked && <p className="lab-help" role="status">Waiting for {scenario.gate?.kind === 'approval' ? 'permission' : 'your answer'}. Respond in Conversation or Playback to continue.</p>}
              {scenario.gate && <p className="lab-help">Decisions pause the clock. Replay retains the recorded branch; Run scenario asks again.</p>}
              {scenario.unreadAfter !== undefined && <p className="lab-help">This fixture starts with you reading earlier messages. New arrivals remain unread until you scroll to the bottom or use Jump to latest. Seeking and replay restore the unread boundary.</p>}
              <div className="lab-field"><label htmlFor="lab-time">Timeline <output data-testid="lab-time">{(time / 1000).toFixed(1)} / {(scenario.duration / 1000).toFixed(1)}s</output></label><Range id="lab-time" aria-label="Timeline" min={0} max={scenario.duration || 1} step={100} value={time} disabled={!scenario.duration} onChange={e => seek(Number(e.target.value))} /></div>
              <Select label="Playback speed" showLabel value={speed} onValueChange={setSpeed} options={['0.5', '1', '2', '4'].map(s => ({ value: s, label: `${s}×` }))} />
              <label className="lab-check"><Checkbox checked={reduced} onChange={e => setReduced(e.target.checked)} />Reduced-motion preview</label>
            </FieldGroup>
          </Section>
          <Section title="Comparison & viewport">
            <FieldGroup>
              <Select label="Comparison" showLabel value={comparison} onValueChange={value => setComparison(value as Comparison)} options={[{ value: 'current', label: 'Primitive demo' }, { value: 'candidate', label: 'Candidate' }, { value: 'side-by-side', label: 'Side-by-side' }]} />
              <div className="lab-field"><label htmlFor="lab-width">Available surface width <output>{width}px</output></label><Range id="lab-width" min={280} max={1200} step={10} value={width} onChange={e => setWidth(Number(e.target.value))} /></div>
              <InlineCluster>{[320, 390, 560, 1000].map(w => <Button size="sm" key={w} aria-pressed={width === w} onClick={() => setWidth(w)}>{w}px</Button>)}</InlineCluster>
              <Select label="Lab theme" showLabel value={theme} onValueChange={value => setTheme(value as 'dark' | 'light')} options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} />
            </FieldGroup>
          </Section>
          <Section title="Candidate experiments"><p className="lab-help">Text responses compare clock-driven word reveal. Thinking and tools share one work log. Choose Citations, Web preview, Questionnaire or Tool permission to inspect the other candidates. Reduced motion reveals each text chunk immediately.</p><p className="lab-help">Work steps are scripted activity summaries. Sources and pages are fixtures, not retrieved content.</p></Section>
          <Section title="Simulation log">
            <p className="lab-copy" role="status" data-testid="lab-notice">{notice}</p>
            <p className="lab-help" data-testid="send-count">Composer sends: {sendCount}</p>
            {decision && <p className="lab-copy" data-testid="recorded-decision">Recorded decision: {decision.value}</p>}
            {lastSend && <details><summary>Last composer payload</summary><pre className="lab-payload">{JSON.stringify(lastSend, null, 2)}</pre></details>}
            <p className="lab-help">Reset clears only this lab’s memory. Reloading also clears the lab. Nothing is saved to real chats.</p>
          </Section>
        </SectionStack></Inset>
      </Surface>
      <div className="lab-workspace">
        <TabsRoot value={view} onValueChange={changeView}>
          <TabsList aria-label="Chat UI Lab views"><TabsTrigger value="states">States</TabsTrigger><TabsTrigger value="playback">Playback</TabsTrigger><TabsTrigger value="conversation">Conversation</TabsTrigger></TabsList>
          <TabsContent value="states">
            <p className="lab-help">Static snapshots of applicable lifecycle states for the selected scenario. Absent states are intentionally omitted.</p>
            {!scenario.items.length && <Surface layer="ground" className="lab-empty">No messages yet. The empty fixture has no component lifecycle states.</Surface>}
            {scenario.unreadAfter !== undefined && <Section title="Unread message marker" description="No unread messages, one arrival, and several arrivals."><div className="lab-state-grid">{[0, 1, 3].map(count => <Surface layer="ground" className="lab-state" key={count}><Inset>{count ? <UnreadMarker count={count} /> : <p className="lab-help">All messages read · no divider</p>}</Inset></Surface>)}</div></Section>}
            <SectionStack>{scenario.items.map(item => <Section key={item.id} title={`${item.kind} · ${item.title}`}>
              <div className="lab-state-grid">{snapshots(item).map(stage => <Surface layer="ground" className="lab-state" key={stage.state} data-snapshot={stage.state}>
                <Inset><Stack><h4 className="lab-label">{stateLabels[stage.state]}</h4>{lanes.map(lane => {
                  const Item = lane === 'candidate' ? CandidateItem : BaselineItem;
                  return <div key={lane}><p className="lab-help">{lane === 'current' ? 'Primitive demo' : 'Candidate · lab experiment'}</p><Item item={item} stage={stage} scenario={scenario} onExpand={setExpanded} staticPreview /></div>;
                })}</Stack></Inset>
              </Surface>)}</div>
            </Section>)}</SectionStack>
          </TabsContent>
          {(['playback', 'conversation'] as const).map(mode => <TabsContent key={mode} value={mode}>
            {mode === 'playback' && <div className="lab-event-rail" aria-label="Fixture events">{events.map(({ item, stage }, i) => <Button key={i} size="sm" aria-pressed={time === stage.at} onClick={() => seek(stage.at)}>{(stage.at / 1000).toFixed(1)}s · {item.kind} · {stateLabels[stage.state]}{stage.expanded ? ' · expanded' : ''}</Button>)}</div>}
            <p className="lab-help">{comparison === 'side-by-side' ? 'One clock and draft drive both panes. Narrow surfaces stack the comparison.' : 'Primitive demo shared primitives; local fixture compositions.'} {mode === 'playback' ? 'Seek any event or scrub the timeline to inspect it.' : 'Type freely; responses always follow the selected scenario.'}</p>
            <div className="lab-stage" style={{ width }}>
              <div className="lab-lanes" data-compare={comparison}>
                {lanes.map((lane, index) => {
                  const Transcript = lane === 'candidate' ? CandidateTranscript : BaselineTranscript;
                  return <Surface layer="ground" className="lab-chat" key={lane} aria-label={`${lane === 'current' ? 'Primitive demo' : 'Candidate'} chat`}>
                    <header className="lab-chat-header"><h3>Workspace review</h3><p>{lane === 'current' ? 'Primitive demo' : 'Candidate · lab experiment'} · Simulated conversation</p></header>
                    <Transcript {...transcriptProps} lane={lane} />
                    <div className="lab-composer-host" ref={index === 0 ? setPrimaryComposer : undefined}>
                      <Composer value={draft} onValueChange={setDraft} onSend={send} sending={sending} onStop={() => { setPlaying(false); setStopped(true); setNotice('Response interrupted by the composer’s Stop control. Recover in the message or press Play.'); }}
                        textareaRef={index === 0 ? primaryTextarea : undefined} textareaTestId={`lab-composer-${lane}`} label={`${lane === 'current' ? 'Primitive demo' : 'Candidate'} message`}
                        model={model} models={['Fixture model', 'Fixture model B']} onModelChange={setModel} reasoning={reasoning} reasoningLevels={['Standard', 'Extended']} onReasoningChange={setReasoning}
                        replyFormat={replyFormat} onReplyFormatChange={setReplyFormat} goal={goal} onGoalChange={setGoal} instruction={instruction} onInstructionChange={setInstruction}
                        live={live} onLiveChange={value => { setLive(value); setNotice(`Live voice ${value ? 'on' : 'off'} in the simulation. No microphone, audio or backend is connected.`); }}
                        onDictate={() => { setDraft(scenario.prompt); setNotice('Simulated dictation inserted the fixture prompt. No microphone was accessed.'); primaryTextarea.current?.focus(); }}
                        agents={agentAdded ? participants : [participants[0]]} activeAgentId={activeAgentId} onActiveAgentChange={setActiveAgentId}
                        commands={[{ id: 'review', name: 'review', description: 'Insert a local review prompt', kind: 'command' }]}
                        onAdd={kind => { if (kind === 'File or folder') { setAttached(true); setNotice('Added fixture attachment metadata. No file picker or upload service is connected.'); } else if (kind === 'Agent') { setAgentAdded(true); setNotice('Athena added to the simulated composer roster.'); } }}
                        context={attached ? <InlineCluster><Badge>workspace-brief.pdf · fixture</Badge><Button size="sm" variant="text" onClick={() => setAttached(false)}>Remove attachment</Button></InlineCluster> : undefined}
                      />
                    </div>
                  </Surface>;
                })}
              </div>
            </div>
          </TabsContent>)}
        </TabsRoot>
      </div>
    </div>
    <Dialog open={!!expanded} onOpenChange={open => { if (!open) setExpanded(undefined); }} title={expanded?.title ?? 'Document'} description="Simulated document · local fixture. No production artifact is opened." bodyLabel="Expanded document contents" closeLabel="Close expanded document" className="lab-document-dialog" style={{ width: 760, maxWidth: 'calc(100vw - 32px)', height: 'min(820px, calc(100dvh - 32px))' }}>
      <DocumentBody scenario={scenario} />
    </Dialog>
  </CaelosProvider>;
}
