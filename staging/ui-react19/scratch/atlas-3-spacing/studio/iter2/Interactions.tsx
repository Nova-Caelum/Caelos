import { useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Composer, IconButton, Surface, type ComposerMessage, type ReplyFormat } from '../../../../dist/index.js';
import type { SpecimenProps } from './Elements';

const prompts = [
  { title: 'How much detail should the review include?', choices: ['A concise overview', 'A detailed walkthrough'] },
  { title: 'Where should we start?', choices: ['The conversation', 'The document workspace'] },
];
const initialDraft = 'Keep the conversation feeling open.';

// The production Composer is consumed unchanged. All orchestration lives in this fixture host.
export function Interaction({ variant, kind }: SpecimenProps & { kind: 'permission' | 'questions' }) {
  const [draft, setDraft] = useState('');
  const [started, setStarted] = useState(true);
  const [pending, setPending] = useState(false);
  const [finished, setFinished] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(['', '']);
  const [clarify, setClarify] = useState(false);
  const [other, setOther] = useState(false);
  const otherDrafts = useRef(['', '']);
  const replyDraft = useRef<string | null>(null);
  const [notice, setNotice] = useState('Interaction checkpoint. A saved draft will be restored on completion. Run scenario to test the full send sequence.');
  const [count, setCount] = useState(0);
  const savedDraft = useRef(initialDraft);
  const host = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [model, setModel] = useState('Fixture model');
  const [reasoning, setReasoning] = useState('Standard');
  const [replyFormat, setReplyFormat] = useState<ReplyFormat>('text');
  const [goal, setGoal] = useState('');
  const [instruction, setInstruction] = useState('');
  const [live, setLive] = useState(false);
  const [activeAgent, setActiveAgent] = useState('hermes');
  const [attached, setAttached] = useState(false);
  const [agentAdded, setAgentAdded] = useState(false);
  const active = started && !finished;
  const replyPrefix = clarify ? 'clarifying question:' : other ? 'other answer:' : '';
  function responseText(text: string) {
    return (replyPrefix && text.startsWith(replyPrefix) ? text.slice(replyPrefix.length) : text).trim();
  }

  useEffect(() => {
    if (!pending) return;
    const send = host.current?.querySelector<HTMLButtonElement>('[data-testid="send-button"]');
    if (send && !send.disabled) { setPending(false); send.click(); }
  }, [pending, draft]);
  function focusComposer() {
    requestAnimationFrame(() => {
      const input = textarea.current;
      input?.focus();
      input?.setSelectionRange(input.value.length, input.value.length);
    });
  }
  function beginReply(mode: 'clarify' | 'other') {
    if (!clarify && !other) {
      replyDraft.current = draft;
      setDraft(mode === 'clarify' ? 'clarifying question: ' : otherDrafts.current[index] || 'other answer: ');
    }
    setClarify(mode === 'clarify'); setOther(mode === 'other');
    focusComposer();
  }
  function leaveReply() {
    if (replyDraft.current !== null) setDraft(replyDraft.current);
    replyDraft.current = null;
    setClarify(false); setOther(false);
  }
  function run() {
    savedDraft.current = (replyDraft.current ?? draft) || savedDraft.current;
    replyDraft.current = null;
    setStarted(false); setFinished(false); setIndex(0); setAnswers(['', '']); setClarify(false); setOther(false); otherDrafts.current = ['', ''];
    setDraft(kind === 'questions' ? 'Help me plan the workspace review.' : 'Save the workspace direction as a file.');
    setPending(true);
  }
  function finish(message: string) {
    setFinished(true); setOther(false); setClarify(false); setDraft((replyDraft.current ?? draft) || savedDraft.current); replyDraft.current = null; setNotice(message + ' Your previous draft is restored.'); focusComposer();
  }
  function send(message: ComposerMessage) {
    if (active && replyPrefix && !responseText(message.text)) { focusComposer(); return; }
    setCount(n => n + 1);
    if (!active) { setIndex(0); setAnswers(['', '']); setClarify(false); setOther(false); otherDrafts.current = ['', '']; setStarted(true); setFinished(false); setDraft(''); setNotice(kind === 'questions' ? 'Choose an answer to continue, or choose Other to write your own.' : 'Review the request above the composer.'); focusComposer(); return; }
    if (clarify) {
      const value = responseText(message.text);
      leaveReply();
      setNotice(`Clarification recorded: “${value}”. The request is still awaiting your decision.`);
      focusComposer(); return;
    }
    if (other) { answer(responseText(message.text)); focusComposer(); return; }
    setNotice(kind === 'permission' ? 'Allow or deny the pending request, or use Clarify to ask a question.' : 'Choose an answer, or use Other to write your own.');
  }

  function answer(value: string) {
    const next = [...answers]; next[index] = value; setAnswers(next);
    otherDrafts.current[index] = '';
    const missing = next.findIndex(a => !a.trim());
    if (missing < 0) finish(`Submitted: ${next.join(' · ')}.`);
    else { leaveReply(); setIndex(missing); setNotice('Answer recorded. Choose the next answer.'); }
  }
  function navigate(next: number) {
    if (other) otherDrafts.current[index] = draft;
    leaveReply(); setIndex(next);
  }
  return <div className="i2-interaction">
    <div className="i2-fixture-control"><Button size="sm" variant="tonal" onClick={run}>{started ? 'Restart scenario' : 'Run scenario'}</Button><span className="i2-meta">Fills the composer, then presses Send · local fixture</span></div>
    <div className="i2-interaction-stage">
      {active && kind === 'questions' && <Surface layer="elevated" className={`i2-question i2-question-${variant}`} aria-label="Questions for your review">
        <div className="i2-question-top"><span className="i2-meta">A little direction</span><div className="i2-actions"><span className="i2-meta">Question {index + 1} of {prompts.length}</span><IconButton variant="text" label="Previous question" icon={<ChevronLeft size={15} />} disabled={index === 0} onClick={() => navigate(index - 1)} /><IconButton variant="text" label="Next question" icon={<ChevronRight size={15} />} disabled={index === prompts.length - 1} onClick={() => navigate(index + 1)} /></div></div>
        <h4>{prompts[index].title}</h4>
        <div className="i2-choices i2-choices-a" role="group" aria-label="Suggested answers">{prompts[index].choices.map(choice => <Button variant="tonal" key={choice} aria-pressed={answers[index] === choice} onClick={() => answer(choice)}><span>{choice}</span>{answers[index] === choice && <Check size={15} />}</Button>)}<Button variant="tonal" className="i2-other" aria-pressed={other} onClick={() => beginReply('other')}>Other</Button></div>
      </Surface>}
      {active && kind === 'permission' && <Surface layer="elevated" texture={variant === 'a' ? 'plain' : 'glass'} className={`i2-permission i2-permission-${variant}`} onKeyDown={e => { if (!clarify && (e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); finish('Allowed. The fixture file is saved.'); } }}>
        <h4>May I save the workspace direction?</h4><p>This creates a local document you can open and review.</p><code>write_file · workspace-direction.md</code>
        <div className="i2-permission-actions"><Button danger className="i2-deny i2-danger-control" variant="tonal" onClick={() => finish('Denied. No file was written.')}>Deny</Button><Button className="i2-clarify" aria-pressed={clarify} variant="tonal" onClick={() => beginReply('clarify')}>Clarify</Button><Button className="i2-allow" variant="primary" onClick={() => finish('Allowed. The fixture file is saved.')}>Allow <kbd>⌘↵</kbd></Button></div>
      </Surface>}
      {!active && <p className="i2-muted">{finished ? 'The review is complete. Your draft is ready below.' : 'Use the scenario control to bring the interaction into the conversation.'}</p>}
      <div ref={host} className="i2-composer-host"><Composer value={draft} onValueChange={setDraft} onSend={send} sendDisabled={Boolean(replyPrefix) && !responseText(draft)} textareaRef={textarea} textareaTestId={`i2-${kind}-${variant}`} label={`${variant.toUpperCase()} ${kind} composer`} placeholder="What’s on your mind?"
        model={model} models={['Fixture model', 'Fixture model B']} onModelChange={setModel} reasoning={reasoning} reasoningLevels={['Standard', 'Extended']} onReasoningChange={setReasoning}
        replyFormat={replyFormat} onReplyFormatChange={setReplyFormat} goal={goal} onGoalChange={setGoal} instruction={instruction} onInstructionChange={setInstruction}
        live={live} onLiveChange={v => { setLive(v); setNotice(`Live conversation ${v ? 'on' : 'off'} in this fixture. No audio connection.`); }} onDictate={() => { setDraft('A concise overview'); setNotice('Fixture dictation inserted. No microphone access.'); focusComposer(); }}
        agents={agentAdded ? [{ id: 'hermes', name: 'Hermes' }, { id: 'athena', name: 'Athena' }] : [{ id: 'hermes', name: 'Hermes' }]} activeAgentId={activeAgent} onActiveAgentChange={setActiveAgent}
        commands={[{ id: 'review', name: 'review', description: 'Review this workspace', kind: 'command' }]}
        onAdd={item => { if (item === 'Agent') setAgentAdded(true); if (item === 'File or folder') setAttached(true); }}
        context={attached ? <div className="i2-row"><span className="i2-meta">workspace-brief.pdf · fixture</span><Button size="sm" variant="text" onClick={() => setAttached(false)}>Remove</Button></div> : undefined}
      /></div>
    </div>
    <div className="i2-fixture-log"><p role="status" data-testid="i2-interaction-notice">{notice}</p><span className="i2-meta">Composer sends: {count}</span></div>
  </div>;
}
