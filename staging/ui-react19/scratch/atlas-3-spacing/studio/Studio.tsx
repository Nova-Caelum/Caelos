import { useEffect, useState } from 'react';
import { Button, Surface, TextArea } from '../../../dist/index.js';
import { studies, type Study } from './catalog';
import './studio.css';
type Review = { status: string; note: string };
const key = 'caelos-atlas3-studio-review-v1';
function readReviews(): Record<string, Review> { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } }
export function Studio() {
  const [reviews, setReviews] = useState(readReviews);
  const [opened, setOpened] = useState<string[]>([location.hash.slice(1) || 'reasoning']);
  const [notice, setNotice] = useState('');
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(reviews)); } catch { setNotice('Browser storage unavailable. Export notes before leaving.'); } }, [reviews]);
  function open(id: string) { setOpened(o => o.includes(id) ? o : [...o, id]); requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'auto', block: 'start' })); }
  function exportReview() {
    const body = ['# Atlas Three · component review', 'All statuses are review notes, not approval for promotion.', ...studies.map(s => `## ${s.title}\nSource: ${s.source || 'Not wired in staging'}\nStatus: ${reviews[s.id]?.status || 'Not reviewed'}\n${reviews[s.id]?.note || 'No notes yet.'}`)].join('\n\n');
    const url = URL.createObjectURL(new Blob([body], { type: 'text/markdown' })); const a = document.createElement('a'); a.href = url; a.download = 'atlas-three-review.md'; a.click(); URL.revokeObjectURL(url);
  }
  return <div className="studio">
    <Surface layer="chrome" className="studio-intro"><div><p className="studio-eyebrow">Component inspection / Studio</p><h2>Inspect the pieces. Keep their context.</h2><p>Direct staging imports beside preserved local experiments. Each study has its own states and review. Nothing here is automatically approved.</p><p className="studio-muted">Fixture data only · application CSS isolated in frames · live authenticated conversation parity remains unverified.</p></div><Button size="sm" onClick={exportReview}>Export review</Button></Surface>
    <div className="studio-layout"><nav className="studio-toc" aria-label="Component checklist"><p className="studio-eyebrow">{studies.filter(s => reviews[s.id]?.status && reviews[s.id].status !== 'Not reviewed').length} / {studies.length} reviewed</p><ol>{studies.map(s => <li key={s.id}><a href={`#${s.id}`} onClick={e => { e.preventDefault(); history.replaceState(null, '', `?tab=studio#${s.id}`); open(s.id); }}><span aria-hidden="true">{reviews[s.id]?.status && reviews[s.id].status !== 'Not reviewed' ? '◐' : '○'}</span><span>{s.title}<small>{reviews[s.id]?.status || (s.source ? 'Actual implementation' : 'Staging gap')}</small></span></a></li>)}</ol></nav>
    <div className="studio-studies">{studies.map((s, index) => <section id={s.id} className="studio-study" key={s.id} aria-labelledby={`title-${s.id}`}>
      <div className="studio-section-heading"><span className="studio-number">{String(index + 1).padStart(2, '0')}</span><div><h2 id={`title-${s.id}`}>{s.title}</h2><p>{s.description}</p></div><Button size="sm" aria-expanded={opened.includes(s.id)} aria-controls={`body-${s.id}`} onClick={() => setOpened(o => o.includes(s.id) ? o.filter(x => x !== s.id) : [...o, s.id])}>{opened.includes(s.id) ? 'Close study' : 'Inspect'}</Button></div>
      {opened.includes(s.id) && <StudyBody study={s} review={reviews[s.id] || { status: 'Not reviewed', note: '' }} onReview={r => setReviews(v => ({ ...v, [s.id]: r }))} />}
    </section>)}</div></div><p role="status">{notice}</p>
  </div>;
}
function StudyBody({ study: s, review, onReview }: { study: Study; review: Review; onReview: (r: Review) => void }) {
  const [state, setState] = useState(s.states[0]); const [width, setWidth] = useState('responsive'); const [run, setRun] = useState(0);
  const url = (variant: string) => `./specimen.html?component=${s.id}&variant=${variant}&state=${encodeURIComponent(state)}&run=${run}`;
  return <div id={`body-${s.id}`} className="studio-study-body">
    <div className="studio-controls"><label>State <select value={state} onChange={e => setState(e.target.value)}>{s.states.map(value => <option key={value}>{value}</option>)}</select></label><label>Viewport <select value={width} onChange={e => setWidth(e.target.value)}><option value="responsive">Fit column</option><option value="390">390px · narrow</option><option value="720">720px · reading</option></select></label><Button size="sm" onClick={() => setRun(r => r + 1)}>Reset / replay</Button><span className="studio-muted">State snapshots stay inspectable; streaming states replay fixture chunks.</span></div>
    {s.gap && <p className="studio-gap">Coverage note · {s.gap}</p>}
    <div className="studio-comparison">{(['actual', 'candidate'] as const).map(variant => <Surface layer="elevated" className="studio-specimen" key={variant}>
      <div className="studio-specimen-heading"><div><h3>{variant === 'actual' ? 'Current · staging implementation' : 'Candidate · local experiment'}</h3><p>{variant === 'actual' ? s.source || 'Not available as a staging component' : s.candidate ? 'Preserved from Demo · not approved' : 'No candidate proposed'}</p></div>{(variant === 'actual' ? s.source : s.candidate) && <a href={url(variant)} target="_blank" rel="noreferrer">Open full size ↗</a>}</div>
      {(variant === 'actual' ? s.source : s.candidate) ? <div className="studio-frame-scroll"><iframe key={`${state}-${run}-${variant}`} title={`${s.title} — ${variant} — ${state}`} src={url(variant)} sandbox="allow-scripts allow-same-origin" allow="clipboard-write" style={{ width: width === 'responsive' ? '100%' : `${width}px`, height: s.height || 420 }} /></div> : <div className="studio-missing">{variant === 'actual' ? 'Staging gap. No substitute is presented as Current.' : s.id === 'composer' ? 'Locked reference. Composer redesign is outside this study.' : 'Use review notes to define the next experiment.'}</div>}
    </Surface>)}</div>
    <Surface layer="chrome" className="studio-review"><div role="group" aria-label={`Review ${s.title}`}><span className="studio-eyebrow">Review disposition</span>{['Not reviewed', 'Keep', 'Explore', 'Pass'].map(status => <Button size="sm" key={status} aria-pressed={review.status === status} variant={review.status === status ? 'tonal' : 'text'} onClick={() => onReview({ ...review, status })}>{status}</Button>)}</div><TextArea label={`Notes · ${s.title}`} value={review.note} onChange={e => onReview({ ...review, note: e.target.value })} placeholder="What works, what differs, and what should change?" rows={3} /><p className="studio-muted">Saved in this browser. Keep / Explore / Pass records feedback; promotion requires an explicit user decision.</p></Surface>
  </div>;
}
