import { useEffect, useState } from 'react';
import { Download, Pause, Play, RotateCcw } from 'lucide-react';
import { Button, CaelosProvider, Checkbox, Select, Surface } from '../../../../dist/index.js';
import { Activity, Attachment, downloadText, Material, Messages, Preview, Recovery, Sources, Workspace, type SpecimenProps } from './Elements';
import { IconGlossary } from './IconGlossary';
import { Interaction } from './Interactions';
import { studies, type Phase, type Study } from './catalog';
import './ripple.generated.css';
import './iter2.css';

export type Review = { choice?: string; notes?: string };
type Reviews = Record<string, Review>;
const reviewKey = 'caelos-atlas3-studio-review-v2';
const choices = ['Not reviewed', 'A', 'B', 'Combine', 'Rework both'];
function readReviews(): { reviews: Reviews; problem: string } {
  try {
    const raw = localStorage.getItem(reviewKey);
    if (!raw) return { reviews: {}, problem: '' };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    for (const value of Object.values(parsed)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    }
    return { reviews: parsed, problem: '' };
  } catch { return { reviews: {}, problem: 'Saved Iter 2 reviews could not be read. They have not been overwritten. Export new notes before leaving.' }; }
}
function Specimen({ study, ...props }: SpecimenProps & { study: Study }) {
  switch (study.id) {
    case 'activity': return <Activity {...props} />;
    case 'messages': return <Messages {...props} />;
    case 'material': return <Material {...props} />;
    case 'preview': return <Preview {...props} />;
    case 'workspace': return <Workspace {...props} />;
    case 'permission': case 'questions': return <Interaction {...props} kind={study.id} />;
    case 'attachment': return <Attachment {...props} />;
    case 'sources': return <Sources {...props} />;
    case 'recovery': return <Recovery {...props} />;
  }
}
export function StudySection({ study, number, reduced, review, onReview, prefix = 'i2' }: { study: Study; number: number; reduced: boolean; review: Review; onReview: (v: Review) => void; prefix?: string }) {
  const [open, setOpen] = useState(number === 1 || location.hash === `#${prefix}-${study.id}`);
  const [state, setState] = useState<string>(study.start);
  const [phase, setPhase] = useState<Phase>('complete');
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const [width, setWidth] = useState('fit');
  const motionStudy = study.id === 'activity' || study.id === 'messages' || study.id === 'attachment' || study.id === 'preview';
  useEffect(() => {
    const handler = () => { if (location.hash === `#${prefix}-${study.id}`) setOpen(true); };
    window.addEventListener('hashchange', handler); return () => window.removeEventListener('hashchange', handler);
  }, [study.id, prefix]);
  useEffect(() => {
    if (!playing || !open) return;
    const timer = setInterval(() => setElapsed(n => Math.min(7000, n + 100)), 100); return () => clearInterval(timer);
  }, [playing, open]);
  useEffect(() => {
    if (!playing) return;
    setPhase(elapsed < 1000 ? 'waiting' : elapsed < 6500 ? 'working' : 'complete');
    if (elapsed >= 7000) setPlaying(false);
  }, [elapsed, playing]);
  function replay() { setElapsed(0); setPhase('waiting'); setEpoch(n => n + 1); setPlaying(true); }
  return <section className="i2-study" id={`${prefix}-${study.id}`} data-study={study.id}>
    <div className="i2-study-heading"><div><span className="i2-number">{String(number).padStart(2, '0')}</span><h3>{study.title}</h3><p>{study.brief}</p></div><Button variant="text" size="sm" aria-expanded={open} aria-controls={`${prefix}-body-${study.id}`} onClick={() => { setOpen(!open); setPlaying(false); }}>{open ? 'Close study' : 'Open study'}</Button></div>
    {open && <div id={`${prefix}-body-${study.id}`}>
      <p className="i2-decision">{study.decision}</p>
      <div className="i2-controls">
        {study.states.length > 1 && <Select label={`${study.title} example`} showLabel value={state} onValueChange={v => { setState(v); setElapsed(0); setEpoch(n => n + 1); setPlaying(false); }} options={study.states.map(s => ({ value: s, label: s }))} />}
        <Select label={`${study.title} width`} showLabel value={width} onValueChange={setWidth} options={[{ value: 'fit', label: 'Fit column' }, { value: '390', label: '390px · narrow' }]} />
        {motionStudy && <><Select label={`${study.title} phase`} showLabel value={phase} onValueChange={v => { setPlaying(false); setElapsed(0); setPhase(v as Phase); setEpoch(n => n + 1); }} options={[{ value: 'waiting', label: 'Waiting' }, { value: 'working', label: 'In progress' }, { value: 'complete', label: 'Final' }]} /><Button size="sm" variant="tonal" leadingIcon={playing ? <Pause size={14} /> : <Play size={14} />} onClick={() => playing ? setPlaying(false) : elapsed > 0 && elapsed < 7000 ? setPlaying(true) : replay()}>{playing ? 'Pause' : 'Play'}</Button></>}
        <Button size="sm" variant="text" leadingIcon={<RotateCcw size={14} />} onClick={() => { setPlaying(false); setEpoch(n => n + 1); setElapsed(0); }}>Reset examples</Button>
        {motionStudy && <span className="i2-meta" role="status">{playing ? `${(elapsed / 1000).toFixed(1)}s · ` : ''}One timeline for both options</span>}
      </div>
      <div className="i2-comparison">{(['a', 'b'] as const).map(variant => <div className="i2-option" key={variant}>
        <header className="i2-option-heading"><span className="i2-option-letter">{variant.toUpperCase()}</span><div><h4>{study[variant]}</h4><p>{variant === 'a' ? study.aNote : study.bNote}</p></div></header>
        <Surface layer="ground" className={`i2-specimen i2-specimen-${study.id}`} style={{ maxWidth: width === 'fit' ? undefined : Number(width) }} aria-label={`${study.title} option ${variant.toUpperCase()}`}>
          <Specimen key={`${state}-${epoch}`} study={study} variant={variant} state={state} phase={phase} progress={elapsed > 0 ? elapsed : undefined} reduced={reduced || (motionStudy && !playing && phase !== 'complete')} />
        </Surface>
      </div>)}</div>
      <div className="i2-review"><div className="i2-review-options" role="group" aria-label={`${study.title} preference`}><span className="i2-meta">Your direction</span>{choices.map(choice => <Button key={choice} variant="text" size="sm" aria-pressed={(review.choice || 'Not reviewed') === choice} onClick={() => onReview({ ...review, choice })}>{choice}</Button>)}</div>
        <label className="i2-review-notes">Review notes<textarea value={review.notes || ''} onChange={e => onReview({ ...review, notes: e.target.value })} placeholder="What works, what needs to change, and anything to carry forward…" /></label>
      </div>
    </div>}
  </section>;
}
export function IterationTwo() {
  const [initial] = useState(readReviews);
  const [reviews, setReviews] = useState<Reviews>(initial.reviews);
  const [warning, setWarning] = useState(initial.problem);
  const [reduced, setReduced] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [saved, setSaved] = useState('Notes save in this browser. Export for a durable handoff.');
  function record(id: string, review: Review) {
    const next = { ...reviews, [id]: review }; setReviews(next);
    if (initial.problem) return;
    try { localStorage.setItem(reviewKey, JSON.stringify(next)); setWarning(''); setSaved('Saved in this browser.'); }
    catch { setWarning('Browser storage is unavailable. Export your review before leaving.'); }
  }
  function exportReview() {
    downloadText('atlas-three-iter2-review.md', `# Atlas Three · Iter 2 review\n\nExported ${new Date().toISOString()}\n\nLocal proposals only. No component is approved or promoted automatically.\n\n` + studies.map(s => `## ${s.title}\n\nDecision: ${s.decision}\n\n- A: ${s.a} — ${s.aNote}\n- B: ${s.b} — ${s.bNote}\n\nDirection: ${reviews[s.id]?.choice || 'Not reviewed'}\n\n${reviews[s.id]?.notes || '(No notes yet)'}\n`).join('\n'));
    setSaved('Review exported. The browser copy remains saved.');
  }
  const reviewed = studies.filter(s => reviews[s.id]?.choice && reviews[s.id].choice !== 'Not reviewed').length;
  return <CaelosProvider className="iter2" theme={theme} reducedMotion={reduced}>
    <header className="i2-intro"><div><p className="i2-eyebrow">Studio / Iter 2</p><h2>Less furniture. A clearer conversation.</h2><p>Revised from your completed Iter 2 review. Your exported comments are preserved in the Atlas review archive. Two proposals per decision, using the same content and controls. Open a study to interact, replay, and leave a direction.</p></div><div className="i2-review-summary"><span>{reviewed} / {studies.length} reviewed</span><Button variant="tonal" size="sm" leadingIcon={<Download size={14} />} onClick={exportReview}>Export review</Button><span className="i2-meta" role="status">{warning || saved}</span></div></header>
    <div className="i2-global-controls"><label className="i2-check"><Checkbox checked={reduced} onChange={e => setReduced(e.target.checked)} />Reduced motion</label><Select label="Preview theme" value={theme} onValueChange={v => setTheme(v as 'dark' | 'light')} options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} /><span className="i2-meta">Scratch proposals · local fixtures · nothing promoted</span></div>
    <a href="#i2-icons" className="i2-glossary-link">Icon glossary & semantic controls ↓</a><IconGlossary reduced={reduced} /><nav className="i2-index" aria-label="Iteration 2 component checklist">{studies.map((s, i) => <a href={`#i2-${s.id}`} key={s.id}><span>{String(i + 1).padStart(2, '0')}</span>{s.title}<small>{reviews[s.id]?.choice && reviews[s.id].choice !== 'Not reviewed' ? reviews[s.id].choice : '—'}</small></a>)}</nav>
    <div className="i2-studies">{studies.map((study, i) => <StudySection key={study.id} study={study} number={i + 1} reduced={reduced} review={reviews[study.id] || {}} onReview={review => record(study.id, review)} />)}</div>
    <footer className="i2-footnote">Carried forward: existing message actions, the empty conversation, and the locked composer. The composer is present for permission and question workflows; its internals are unchanged. Iter 1 keeps the original specimens and review notes.</footer>
  </CaelosProvider>;
}
