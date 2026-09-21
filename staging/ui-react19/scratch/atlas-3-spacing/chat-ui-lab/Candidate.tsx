import { Fragment, useEffect, useRef, useState } from 'react';
import { AgentMessage, Badge, Button, Dialog, Disclosure, FieldGroup, InlineCluster, Inset, Popover, PopoverContent, PopoverTrigger, Stack, Surface, TextArea, useCaelosTheme } from '../../../dist/index.js';
import { BaselineItem, BaselineTranscript, type ItemProps, type TranscriptProps } from './Baseline';
import { InteractionCard } from './InteractionCard';
import { stageAt, stateLabels, type LabSource } from './fixtures';

// Operational voice: calm working copy and shared controls. Structural voice is
// reserved for URLs, commands and tool identifiers. Semantic badges carry state.
function Citation({ source, index }: { source: LabSource; index: number }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><Button ref={trigger} size="sm" variant="text" className="lab-candidate-citation" aria-label={`Source ${index}: ${source.title}`} onMouseEnter={() => setOpen(true)} onClick={event => { event.preventDefault(); setOpen(true); }}>[{index}]</Button></PopoverTrigger>
    <PopoverContent className="lab-candidate-source" onOpenAutoFocus={event => event.preventDefault()} onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus({ preventScroll: true }); }} onMouseLeave={() => setOpen(false)}>
      <Stack><strong>{source.title}</strong><span className="lab-coordinate">{source.url}</span><p className="lab-copy">{source.description}</p><p className="lab-help">Simulated source · illustrative reference only</p><Button size="sm" onClick={() => setOpen(false)}>Close source</Button></Stack>
    </PopoverContent>
  </Popover>;
}

// Virtual-clock projection, not timers or CSS animation: pause and scrub reproduce
// exactly the same words. Already delivered words persist between growing chunks.
export function revealedText({ item, stage, time = stage.at, staticPreview }: ItemProps, reduced: boolean) {
  if (reduced || staticPreview || stage.state !== 'in-progress') return stage.text;
  const previous = [...item.stages].reverse().find(s => s.at < stage.at && s.state === 'in-progress');
  const prefix = previous && stage.text.startsWith(previous.text) ? previous.text : '';
  const words = stage.text.slice(prefix.length).trim().split(/\s+/);
  const next = item.stages.find(s => s.at > stage.at);
  const interval = Math.min(140, Math.max(1, ((next?.at ?? stage.at + 1600) - stage.at) / Math.max(1, words.length)));
  const count = Math.min(words.length, Math.max(1, Math.floor((time - stage.at) / interval) + 1));
  return `${prefix}${prefix ? ' ' : ''}${words.slice(0, count).join(' ')}`;
}
function Response(props: ItemProps) {
  const { reducedMotion } = useCaelosTheme();
  const text = revealedText(props, !!reducedMotion);
  const { item, stage, staticPreview } = props;
  const chunks = text.split(/(\[\d+\])/g);
  return <AgentMessage agent={{ id: item.agent ?? 'hermes', name: item.agent ?? 'Hermes' }} responding={stage.state === 'in-progress' && !staticPreview}>
    <p className="lab-copy" data-word-reveal>{chunks.map((chunk, i) => {
      const number = /^\[(\d+)\]$/.exec(chunk)?.[1];
      const source = number ? item.sources?.[Number(number) - 1] : undefined;
      return source ? <Citation key={i} source={source} index={Number(number)} /> : <Fragment key={i}>{chunk}</Fragment>;
    })}{!reducedMotion && !staticPreview && stage.state === 'in-progress' && <span className="lab-candidate-cursor" aria-hidden="true">▏</span>}</p>
  </AgentMessage>;
}
function WorkLog(props: ItemProps) {
  const { item, stage, scenario, staticPreview, time = stage.at } = props;
  const [expanded, setExpanded] = useState<boolean>();
  const group = staticPreview ? [item] : scenario.items.filter(i => (i.kind === 'thinking' || i.kind === 'tool') && (i.agent ?? 'Hermes') === (item.agent ?? 'Hermes'));
  const steps = group.map(i => ({ item: i, stage: staticPreview ? stage : stageAt(i, time) }));
  const done = steps.filter(s => s.stage?.state === 'complete').length;
  const interrupted = !!props.stopped || stage.state === 'interrupted';
  const complete = done === group.length;
  useEffect(() => setExpanded(undefined), [complete, interrupted]);
  if (!staticPreview && group[0].id !== item.id) return null;
  return <AgentMessage agent={{ id: item.agent ?? 'hermes', name: item.agent ?? 'Hermes' }}>
    <Disclosure title={<InlineCluster><span>Work steps</span><Badge>{interrupted ? 'Interrupted' : complete ? 'Complete' : `${done} of ${group.length} complete`}</Badge></InlineCluster>} open={expanded ?? !complete} onOpenChange={setExpanded}>
      <ol className="lab-candidate-steps">{steps.map(({ item: stepItem, stage: step }) => <li key={stepItem.id} data-work-step={stepItem.id} data-step-state={interrupted && step?.state !== 'complete' ? 'interrupted' : step?.state ?? 'waiting'}>
        <Stack><InlineCluster><span className={stepItem.kind === 'tool' ? 'lab-coordinate' : undefined}>{stepItem.title}</span><span className="lab-help">{interrupted && step?.state !== 'complete' ? 'Interrupted' : step ? stateLabels[step.state] : 'Waiting'}</span></InlineCluster><p className="lab-copy">{step?.text ?? 'Queued after the preceding work.'}</p></Stack>
      </li>)}</ol>
    </Disclosure>
    {interrupted && props.onRecover && <Button size="sm" onClick={() => props.onRecover?.(item)}>Resume work</Button>}
  </AgentMessage>;
}

const previewPages = [
  { path: '/overview', title: 'Workspace review', copy: 'A focused review of conversation flow, tool activity and document reading.', points: ['Read the conversation in context', 'Inspect tool results', 'Open the full review brief'] },
  { path: '/checklist', title: 'Review checklist', copy: 'Verify the experience across a narrow pane and a full workspace.', points: ['Navigate with the keyboard', 'Recover an interrupted response', 'Check an expanded document'] },
];
function Preview({ stage }: ItemProps) {
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const expandTrigger = useRef<HTMLButtonElement>(null!);
  const { theme } = useCaelosTheme();
  const current = previewPages[page];
  // Trusted static fixture only, deliberately sandboxed without scripts or network.
  const srcDoc = `<!doctype html><html><head><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><style>html{color-scheme:${theme}}body{font:16px/1.6 sans-serif;margin:24px}h1{font-size:24px}li{margin:12px 0}small{opacity:.7}</style></head><body><small>LOCAL WEBSITE FIXTURE</small><h1>${current.title}</h1><p>${current.copy}</p><ul>${current.points.map(point => `<li>${point}</li>`).join('')}</ul></body></html>`;
  const frame = (label: string) => <iframe key={`${page}-${refresh}`} title={label} className="lab-candidate-frame" sandbox="" srcDoc={srcDoc} />;
  return <AgentMessage agent={{ id: 'hermes', name: 'Hermes' }}><Surface layer="elevated"><Inset><Stack>
    <InlineCluster><span>Website preview</span><Badge>{stateLabels[stage.state]}</Badge></InlineCluster>
    {stage.state === 'complete' ? <>
      <InlineCluster><Button size="sm" aria-label="Previous preview page" disabled={page === 0} onClick={() => setPage(0)}>Back</Button><Button size="sm" aria-label="Next preview page" disabled={page === 1} onClick={() => setPage(1)}>Next</Button><Button size="sm" onClick={() => setRefresh(n => n + 1)}>Reload preview</Button></InlineCluster>
      <span className="lab-coordinate" aria-live="polite">fixture://workspace{current.path}</span>
      {frame('Local website preview')}
      <InlineCluster><Button ref={expandTrigger} size="sm" onClick={() => setExpanded(true)}>Expand preview</Button><span className="lab-help">Local fixture · no network</span></InlineCluster>
      <Disclosure title="Preview console"><pre className="lab-payload">{`[ready] ${current.path}\n[info] Local fixture rendered\n[info] Reloads: ${refresh}\n[info] No runtime errors simulated`}</pre></Disclosure>
    </> : <p className="lab-copy">{stage.text}</p>}
    <Dialog returnFocusRef={expandTrigger} open={expanded} onOpenChange={setExpanded} title={current.title} description="Local website fixture. Links and remote navigation are disabled." closeLabel="Close expanded preview" bodyLabel="Expanded website preview" className="lab-candidate-preview-dialog" style={{ width: 900, maxWidth: 'calc(100vw - 32px)' }}>{frame('Expanded local website preview')}</Dialog>
  </Stack></Inset></Surface></AgentMessage>;
}
function Questionnaire(props: ItemProps) {
  const { interaction, stage, scenario, staticPreview } = props;
  const [step, setStep] = useState(0);
  const [context, setContext] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const result = useRef<HTMLDivElement>(null);
  const submitted = useRef(false);
  useEffect(() => { if (submitted.current && interaction?.locked) { result.current?.focus(); submitted.current = false; } }, [interaction?.locked]);
  function submit(value: string) { submitted.current = true; interaction?.onDecision({ value }); }
  const enabled = !!interaction && !interaction.locked && stage.state === 'waiting' && !staticPreview;
  function navigate(next: number) { setStep(next); requestAnimationFrame(() => heading.current?.focus()); }
  if (stage.state !== 'waiting' || interaction?.locked) return <div ref={result} tabIndex={-1}><AgentMessage agent={{ id: 'hermes', name: 'Hermes' }}><InteractionCard {...props} /></AgentMessage></div>;
  return <AgentMessage agent={{ id: 'hermes', name: 'Hermes' }}><Surface layer="elevated"><Inset><FieldGroup>
    <h4 ref={heading} tabIndex={-1} className="lab-label">{step === 0 ? scenario.gate?.prompt : 'Any additional context? (optional)'}</h4>
    <p className="lab-help">Question {step + 1} of 2</p>
    <form onSubmit={event => { event.preventDefault(); if (!enabled || !interaction.answer.trim()) return; if (step === 0) navigate(1); else submit(`${interaction.answer.trim()}${context.trim() ? ` · Context: ${context.trim()}` : ''}`); }}>
      <FieldGroup>{step === 0 ? <>
        <InlineCluster>{scenario.gate?.options?.map(option => <Button type="button" key={option} disabled={!enabled} aria-pressed={interaction?.answer === option} onClick={() => interaction?.onAnswer(option)}>{option}</Button>)}</InlineCluster>
        <TextArea label="Your answer" disabled={!enabled} value={interaction?.answer ?? ''} onChange={e => interaction?.onAnswer(e.target.value)} />
      </> : <TextArea label="Additional context (optional)" disabled={!enabled} value={context} onChange={e => setContext(e.target.value)} />}
      <InlineCluster>{step === 1 && <Button type="button" onClick={() => navigate(0)} disabled={!enabled}>Previous question</Button>}<Button type="submit" variant="primary" disabled={!enabled || !interaction?.answer.trim()}>{step === 0 ? 'Next question' : 'Submit answers'}</Button>{step === 1 && <Button type="button" disabled={!enabled} onClick={() => submit(interaction?.answer.trim() ?? '')}>Skip optional context</Button>}</InlineCluster>
      </FieldGroup>
    </form>
  </FieldGroup></Inset></Surface></AgentMessage>;
}
export function CandidateItem(props: ItemProps) {
  const { item, stage } = props;
  let content;
  if (item.kind === 'thinking' || item.kind === 'tool') content = <WorkLog {...props} />;
  else if (item.preview) content = <Preview {...props} />;
  else if (item.kind === 'approval') content = <AgentMessage agent={{ id: 'hermes', name: 'Hermes' }}><Stack><pre className="lab-candidate-code"><code>{'get_weather({\n  city: "New York"\n})'}</code></pre><InteractionCard {...props} requestDetails={<pre className="lab-candidate-code"><code>{'get_weather({ city: "New York" })'}</code></pre>} /></Stack></AgentMessage>;
  else if (props.scenario.id === 'questionnaire' && item.kind === 'question') content = <Questionnaire {...props} />;
  else if (item.kind === 'response' && stage.state !== 'interrupted' && stage.state !== 'failed') content = <Response {...props} />;
  else return <BaselineItem {...props} />;
  // Suppress grouped siblings entirely, including their empty message containers.
  if ((item.kind === 'thinking' || item.kind === 'tool') && !props.staticPreview && props.scenario.items.find(i => (i.kind === 'thinking' || i.kind === 'tool') && (i.agent ?? 'Hermes') === (item.agent ?? 'Hermes'))?.id !== item.id) return null;
  return <div data-item={item.id} data-kind={item.kind} data-lifecycle={stage.state} className="lab-candidate">{content}</div>;
}
export function CandidateTranscript(props: TranscriptProps) {
  return <BaselineTranscript {...props} ItemRenderer={CandidateItem} />;
}
