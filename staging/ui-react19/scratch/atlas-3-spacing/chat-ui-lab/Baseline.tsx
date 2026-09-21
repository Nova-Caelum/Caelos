import { Fragment, useEffect, useRef, useState, type ComponentType } from 'react';
import { AgentMessage, Badge, Button, Disclosure, InlineCluster, Inset, Progress, ScrollArea, SectionStack, Stack, Surface } from '../../../dist/index.js';
import { stageAt, stateLabels, type LabItem, type Scenario, type Stage } from './fixtures';
import { InteractionCard, UnreadMarker, type InteractionProps } from './InteractionCard';

// Operational compositions only. Identity, controls, surfaces and disclosure behavior
// are the existing built primitives. There is no alternate component design here.
export function DocumentBody({ scenario }: { scenario: Scenario }) {
  return <SectionStack className="lab-document">{scenario.document?.map((paragraph, i) => <p key={i}>{paragraph}</p>)}</SectionStack>;
}
export type ItemProps = { item: LabItem; stage: Stage; scenario: Scenario; onExpand: (item: LabItem) => void; onRecover?: (item: LabItem) => void; staticPreview?: boolean; time?: number; stopped?: boolean; interaction?: InteractionProps };
export function BaselineItem({ item, stage, scenario, onExpand, onRecover, staticPreview, interaction }: ItemProps) {
  const [expanded, setExpanded] = useState<boolean | undefined>();
  useEffect(() => setExpanded(undefined), [stage.expanded, stage.state]);
  const active = stage.state === 'in-progress' || stage.state === 'waiting';
  const identity = { id: item.agent ?? 'hermes', name: item.agent ?? 'Hermes' };
  const status = <Badge tone={stage.state === 'failed' ? 'danger' : stage.state === 'complete' ? 'done' : 'neutral'}>{stateLabels[stage.state]}</Badge>;
  const recovery = !staticPreview && onRecover && (stage.state === 'failed' || stage.state === 'interrupted') && <Button size="sm" onClick={() => onRecover(item)}>{stage.state === 'failed' ? 'Retry upload' : 'Recover response'}</Button>;
  let content;
  if (item.kind === 'approval' || item.kind === 'question') {
    content = <Stack><InteractionCard scenario={scenario} stage={stage} interaction={interaction} staticPreview={staticPreview} />{recovery}</Stack>;
  } else if (item.kind === 'response') {
    content = <Stack><p className="lab-copy">{stage.text}</p>{!active && stage.state !== 'complete' && <InlineCluster>{status}{recovery}</InlineCluster>}</Stack>;
  } else if (item.kind === 'attachment') {
    content = <Surface layer="elevated"><Inset><Stack><InlineCluster><span>{item.title}</span>{status}</InlineCluster><p className="lab-copy">{stage.text}</p>{stage.progress !== undefined && <Progress value={stage.progress} label="Attachment upload" />}{recovery}</Stack></Inset></Surface>;
  } else if (item.kind === 'artifact') {
    content = <Surface layer="elevated"><Inset><Stack><InlineCluster><span>{item.title}</span>{status}</InlineCluster><p className="lab-copy">{stage.text}</p>{stage.state === 'complete' && <>
      <Disclosure title="Document contents" open={expanded ?? stage.expanded ?? false} onOpenChange={setExpanded}><DocumentBody scenario={scenario} /></Disclosure>
      <Button size="sm" onClick={() => onExpand(item)}>Open expanded document</Button>
    </>}</Stack></Inset></Surface>;
  } else {
    content = <Surface layer="elevated"><Inset><Stack>
      <Disclosure title={<InlineCluster><span className={item.kind === 'tool' ? 'lab-coordinate' : undefined}>{item.title}</span>{status}</InlineCluster>} open={expanded ?? (staticPreview || active)} onOpenChange={setExpanded}>
        <p className="lab-copy">{stage.text}</p>
      </Disclosure>{recovery}
    </Stack></Inset></Surface>;
  }
  return <div data-item={item.id} data-kind={item.kind} data-lifecycle={stage.state}>
    <AgentMessage agent={identity} responding={active && !staticPreview}>{content}</AgentMessage>
  </div>;
}
export type TranscriptProps = {
  scenario: Scenario; time: number; started: boolean; prompt: string; stopped: boolean;
  lane: string; epoch: number; onExpand: (item: LabItem) => void; onRecover: (item: LabItem) => void;
  ItemRenderer?: ComponentType<ItemProps>; interaction: InteractionProps; readThrough: number; onRead: (time: number) => void;
};
export function BaselineTranscript({ scenario, time, started, prompt, stopped, lane, epoch, onExpand, onRecover, interaction, readThrough, onRead, ItemRenderer = BaselineItem }: TranscriptProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const [showLatest, setShowLatest] = useState(false);
  const unread = started && scenario.unreadAfter !== undefined ? scenario.items.filter(item => item.stages[0].at > readThrough && item.stages[0].at <= time) : [];
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    following.current = scenario.unreadAfter === undefined;
    setShowLatest(!following.current);
    element.scrollTop = 0;
  }, [epoch]);
  useEffect(() => {
    const element = viewport.current;
    if (element && following.current) {
      element.scrollTop = element.scrollHeight;
      if (scenario.unreadAfter !== undefined && started) onRead(time);
    }
  }, [time, started]);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const update = () => {
      following.current = element.scrollHeight - element.scrollTop - element.clientHeight < 48;
      setShowLatest(!following.current);
      if (following.current && started && scenario.unreadAfter !== undefined) onRead(time);
    };
    element.addEventListener('scroll', update);
    return () => element.removeEventListener('scroll', update);
  }, [time, started, scenario.unreadAfter, onRead]);
  function jumpToLatest() {
    following.current = true;
    if (viewport.current) { viewport.current.scrollTop = viewport.current.scrollHeight; viewport.current.focus(); }
    if (scenario.unreadAfter !== undefined) onRead(time);
    setShowLatest(false);
  }
  return <div className="lab-transcript-wrap">
    <ScrollArea className="lab-transcript" viewportRef={viewport} viewportLabel={`${lane} conversation messages`}>
      <Inset><SectionStack data-transcript={lane} data-time={time}>
        {!started || !scenario.items.length ? <div className="lab-empty"><p>No messages yet.</p><p>Start a simulated conversation with the composer.</p></div> : <>
          <Surface layer="chrome" className="lab-user"><p className="lab-copy"><strong>You</strong></p><p className="lab-copy">{prompt}</p></Surface>
          {scenario.items.map(item => {
            const stage = stageAt(item, time);
            if (!stage) return null;
            const displayed = stopped && (stage.state === 'waiting' || stage.state === 'in-progress') ? { ...stage, state: 'interrupted' as const } : stage;
            return <Fragment key={`${epoch}-${item.id}`}>
              {item.id === unread[0]?.id && <UnreadMarker count={unread.length} />}
              <ItemRenderer stopped={stopped} time={time} item={item} stage={displayed} scenario={scenario} onExpand={onExpand} onRecover={onRecover} interaction={interaction} />
            </Fragment>;
          })}
        </>}
      </SectionStack></Inset>
    </ScrollArea>
    {started && (showLatest || unread.length > 0) && <Button className="lab-latest" size="sm" onClick={jumpToLatest}>{unread.length ? `${unread.length} new ${unread.length === 1 ? 'message' : 'messages'} · Jump to latest` : 'Jump to latest'}</Button>}
    {scenario.unreadAfter !== undefined && <span className="lab-announcement" role="status">{unread.length ? `${unread.length} unread ${unread.length === 1 ? 'message' : 'messages'}` : 'No unread messages'}</span>}
  </div>;
}
