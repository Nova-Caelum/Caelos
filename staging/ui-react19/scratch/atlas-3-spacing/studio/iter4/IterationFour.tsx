import { useEffect, useState } from 'react';
import { Download, Pause, Play, RotateCcw } from 'lucide-react';
import { Button, CaelosProvider, Checkbox, Select, Surface } from '../../../../dist/index.js';
import { downloadText, Preview, Workspace } from '../iter2/Elements';
import type { Phase, Variant } from '../iter2/catalog';
import '../iter2/ripple.generated.css';
import '../iter2/iter2.css';
import './iter4.css';
import { Alert } from './Alerts';
import { studies4, type Option4, type Study4 } from './catalog4';

// Iter 4 · the four open studies only (04, 05, 06, 07). Own frame, own storage key, own specimens
// for anything reworked. Iter 1–3 sources are imported read-only and never edited from here.
type Review = { choice?: string; notes?: string };
type Reviews = Record<string, Review>;
const reviewKey = 'caelos-atlas3-studio-review-v4';
const pad = (n: number) => String(n).padStart(2, '0');

function readReviews(): { reviews: Reviews; problem: string } {
  try {
    const raw = localStorage.getItem(reviewKey);
    if (!raw) return { reviews: {}, problem: '' };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || Object.values(parsed).some(v => !v || typeof v !== 'object' || Array.isArray(v))) throw new Error();
    return { reviews: parsed, problem: '' };
  } catch { return { reviews: {}, problem: 'Saved Iter 4 notes could not be read. The stored copy is untouched; export new notes before leaving.' }; }
}

function Specimen({ study, option, state, phase, reduced, progress }: { study: Study4; option: Option4; state: string; phase: Phase; reduced: boolean; progress?: number }) {
  switch (study.id) {
    case 'preview': return <Preview variant={option.key as Variant} state={state} phase={phase} reduced={reduced} progress={progress} />;
    case 'workspace': return <Workspace variant={option.key as Variant} state={state} phase={phase} reduced={reduced} progress={progress} />;
    case 'permission': case 'questions': return <Alert kind={study.id} tone={option.tone ?? 'none'} glow={option.glow} edge={option.edge} id={option.key} />;
  }
}

function StudySection4({ study, reduced, review, onReview }: { study: Study4; reduced: boolean; review: Review; onReview: (v: Review) => void }) {
  const anchor = `i4-${study.id}`;
  const [open, setOpen] = useState(study.status === 'new' || location.hash === `#${anchor}`);
  const [state, setState] = useState<string>(study.start);
  const [phase, setPhase] = useState<Phase>('complete');
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const [width, setWidth] = useState('fit');
  useEffect(() => {
    const handler = () => { if (location.hash === `#${anchor}`) setOpen(true); };
    window.addEventListener('hashchange', handler); return () => window.removeEventListener('hashchange', handler);
  }, [anchor]);
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
  const choices = ['Not reviewed', ...study.options.map(o => o.key.toUpperCase()), 'Combine', 'Rework'];
  return <section className="i2-study" id={anchor} data-study={study.id}>
    <div className="i2-study-heading"><div><span className="i2-number">{pad(study.number)}</span><h3>{study.title}<span className={`i4-carried${study.status === 'new' ? ' i4-new' : ''}`}>{study.status === 'new' ? 'New in Iter 4' : 'Carried forward · not yet reworked'}</span></h3><p>{study.brief}</p></div><Button variant="text" size="sm" aria-expanded={open} aria-controls={`${anchor}-body`} onClick={() => { setOpen(!open); setPlaying(false); }}>{open ? 'Close study' : 'Open study'}</Button></div>
    {open && <div id={`${anchor}-body`}>
      <p className="i2-decision">{study.decision}</p>
      <div className="i2-controls">
        {study.states.length > 1 && <Select label={`${study.title} example`} showLabel value={state} onValueChange={v => { setState(v); setElapsed(0); setEpoch(n => n + 1); setPlaying(false); }} options={study.states.map(s => ({ value: s, label: s }))} />}
        <Select label={`${study.title} width`} showLabel value={width} onValueChange={setWidth} options={[{ value: 'fit', label: 'Fit column' }, { value: '390', label: '390px · narrow' }]} />
        {study.motion && <><Select label={`${study.title} phase`} showLabel value={phase} onValueChange={v => { setPlaying(false); setElapsed(0); setPhase(v as Phase); setEpoch(n => n + 1); }} options={[{ value: 'waiting', label: 'Waiting' }, { value: 'working', label: 'In progress' }, { value: 'complete', label: 'Final' }]} /><Button size="sm" variant="tonal" leadingIcon={playing ? <Pause size={14} /> : <Play size={14} />} onClick={() => playing ? setPlaying(false) : elapsed > 0 && elapsed < 7000 ? setPlaying(true) : replay()}>{playing ? 'Pause' : 'Play'}</Button></>}
        <Button size="sm" variant="text" leadingIcon={<RotateCcw size={14} />} onClick={() => { setPlaying(false); setEpoch(n => n + 1); setElapsed(0); }}>Reset examples</Button>
      </div>
      <div className="i4-comparison">{study.options.map(option => <div className="i2-option" key={option.key} data-option={option.key}>
        <header className="i2-option-heading"><span className="i2-option-letter">{option.key.toUpperCase()}</span><div><h4>{option.label}</h4><p>{option.note}</p></div></header>
        <Surface layer="ground" className={`i2-specimen i2-specimen-${study.id}`} style={{ maxWidth: width === 'fit' ? undefined : Number(width) }} aria-label={`${study.title} option ${option.key.toUpperCase()}`}>
          <Specimen key={`${state}-${epoch}`} study={study} option={option} state={state} phase={phase} progress={elapsed > 0 ? elapsed : undefined} reduced={reduced || (study.motion && !playing && phase !== 'complete')} />
        </Surface>
      </div>)}</div>
      <div className="i2-review"><div className="i2-review-options" role="group" aria-label={`${study.title} preference`}><span className="i2-meta">Your direction</span>{choices.map(choice => <Button key={choice} variant="text" size="sm" aria-pressed={(review.choice || 'Not reviewed') === choice} onClick={() => onReview({ ...review, choice })}>{choice}</Button>)}</div>
        <label className="i2-review-notes">Review notes<textarea value={review.notes || ''} onChange={e => onReview({ ...review, notes: e.target.value })} placeholder="What works, what needs to change, and anything to carry forward…" /></label>
      </div>
    </div>}
  </section>;
}

export function IterationFour() {
  const [initial] = useState(readReviews);
  const [reviews, setReviews] = useState<Reviews>(initial.reviews);
  const [notice, setNotice] = useState(initial.problem || 'Notes save separately from Iter 1, 2 and 3.');
  const [reduced, setReduced] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  function record(id: string, review: Review) {
    const next = { ...reviews, [id]: review }; setReviews(next);
    if (initial.problem) return;
    try { localStorage.setItem(reviewKey, JSON.stringify(next)); setNotice('Saved in this browser. Export for a durable copy.'); }
    catch { setNotice('Browser storage is unavailable. Export your notes before leaving.'); }
  }
  function exportReview() {
    downloadText('atlas-three-iter4-review.md', `# Atlas Three · Iter 4 review\n\nExported ${new Date().toISOString()}\n\nFour open studies: 04 previews, 05 workspace, 06 permission alert, 07 question alert. Local proposals; no automatic approval or promotion. Iter 1–3 notes remain separate.\n\n` + studies4.map(s => `## ${pad(s.number)} · ${s.title}\n\nDecision: ${s.decision}\n\n${s.options.map(o => `- ${o.key.toUpperCase()}: ${o.label} — ${o.note}`).join('\n')}\n\nDirection: ${reviews[s.id]?.choice || 'Not reviewed'}\n\n${reviews[s.id]?.notes || '(No notes yet)'}\n`).join('\n'));
    setNotice('Iter 4 review exported. Your browser copy remains saved.');
  }
  const reviewed = studies4.filter(s => reviews[s.id]?.choice && reviews[s.id].choice !== 'Not reviewed').length;
  return <CaelosProvider className="iter2 iter4" theme={theme} reducedMotion={reduced}>
    <header className="i2-intro"><div><p className="i2-eyebrow">Studio / Iter 4</p><h2>Four left: previews, workspace, and two alerts.</h2><p>Permission and question requests are re-derived as temporary alerts rather than info cards: one anatomy, a material, and a tone drawn from an existing token set. Previews and the expanded workspace are carried forward unchanged for now and are reworked next. Study numbers match Iter 2 and 3.</p></div><div className="i2-review-summary"><span>{reviewed} / {studies4.length} reviewed</span><Button variant="tonal" size="sm" leadingIcon={<Download size={14} />} onClick={exportReview}>Export review</Button><span className="i2-meta" role="status">{notice}</span></div></header>
    <div className="i2-global-controls"><label className="i2-check"><Checkbox checked={reduced} onChange={e => setReduced(e.target.checked)} />Reduced motion</label><Select label="Preview theme" value={theme} onValueChange={v => setTheme(v as 'dark' | 'light')} options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} /><span className="i2-meta">Scratch proposals · local fixtures · nothing promoted</span></div>
    <nav className="i2-index" aria-label="Iteration 4 open studies">{studies4.map(s => <a href={`#i4-${s.id}`} key={s.id}><span>{pad(s.number)}</span>{s.title}<small>{reviews[s.id]?.choice && reviews[s.id].choice !== 'Not reviewed' ? reviews[s.id].choice : '—'}</small></a>)}</nav>
    <div className="i2-studies">{studies4.map(study => <StudySection4 key={study.id} study={study} reduced={reduced} review={reviews[study.id] || {}} onReview={review => record(study.id, review)} />)}</div>
    <footer className="i2-footnote">Iter 1, 2 and 3 keep their specimens, review history and storage untouched. These are isolated local fixtures; no staging, Foundry, shared component, token or composer changes.</footer>
  </CaelosProvider>;
}
