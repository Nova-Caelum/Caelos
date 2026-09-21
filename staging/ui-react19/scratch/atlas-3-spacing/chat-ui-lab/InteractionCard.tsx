import { useRef, useState, type ReactNode } from 'react';
import { Badge, Button, Dialog, FieldGroup, InlineCluster, Inset, Stack, Surface, TextArea } from '../../../dist/index.js';
import type { Decision, Scenario, Stage } from './fixtures';

export type InteractionProps = { answer: string; locked: boolean; onAnswer: (value: string) => void; onDecision: (decision: Decision) => void };

// Lab-only compositions. The existing controls and modal keep their own behavior.
export function InteractionCard({ scenario, stage, interaction, staticPreview, requestDetails }: { scenario: Scenario; stage: Stage; interaction?: InteractionProps; staticPreview?: boolean; requestDetails?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLButtonElement>(null!);
  const gate = scenario.gate!;
  const waiting = stage.state === 'waiting';
  const enabled = waiting && !!interaction && !interaction.locked && !staticPreview;
  function decide(value: string) {
    if (!enabled) return;
    setOpen(false);
    interaction.onDecision({ value });
    if (!open) card.current?.focus();
  }
  const actions = gate.kind === 'approval' ? <InlineCluster>
    <Button disabled={!enabled} onClick={() => decide('deny')}>Deny</Button>
    <Button variant="primary" disabled={!enabled} onClick={() => decide('allow')}>Allow</Button>
  </InlineCluster> : <form onSubmit={event => { event.preventDefault(); if (interaction?.answer.trim()) decide(interaction.answer.trim()); }}>
    <FieldGroup>
      <InlineCluster>{gate.options?.map(option => <Button type="button" size="sm" key={option} disabled={!enabled} aria-pressed={interaction?.answer === option} onClick={() => interaction?.onAnswer(option)}>{option}</Button>)}</InlineCluster>
      <TextArea label="Your answer" value={interaction?.answer ?? ''} onChange={event => interaction?.onAnswer(event.target.value)} disabled={!enabled} placeholder="Choose above or write your own answer…" />
      <InlineCluster><Button type="submit" variant="primary" disabled={!enabled || !interaction?.answer.trim()}>Submit answer</Button><Button type="button" disabled={!enabled} onClick={() => decide('Skipped')}>Skip question</Button></InlineCluster>
    </FieldGroup>
  </form>;
  return <Surface layer="elevated"><Inset><Stack>
    <div ref={card} tabIndex={-1} className="lab-interaction-status"><Badge>{waiting ? gate.kind === 'approval' ? 'Awaiting permission' : 'Awaiting your answer' : stage.state === 'interrupted' ? 'Interrupted' : 'Recorded'}</Badge><p className="lab-copy">{gate.prompt}</p><p className="lab-copy" role="status">{stage.text}</p></div>
    {waiting && actions}
    {gate.kind === 'approval' && !staticPreview && <Button ref={returnFocus} size="sm" onClick={() => setOpen(true)}>Review permission</Button>}
    <Dialog open={open} onOpenChange={setOpen} returnFocusRef={returnFocus} title="Tool permission" description="Simulation only. This decision cannot authorize a real tool call." closeLabel="Close permission review" bodyLabel="Permission request details">
      <Stack>{requestDetails}<p className="lab-copy">{gate.prompt}</p><p className="lab-copy">{stage.text}</p>{waiting && actions}</Stack>
    </Dialog>
  </Stack></Inset></Surface>;
}

export function UnreadMarker({ count }: { count: number }) {
  return <div className="lab-unread-marker" role="separator" aria-label={`${count} unread ${count === 1 ? 'message' : 'messages'}`} data-unread-divider>
    <span>New messages</span><Badge>{count}</Badge>
  </div>;
}
