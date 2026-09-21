import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button, CaelosProvider, Checkbox, Select } from '../../../../dist/index.js';
import { downloadText } from '../iter2/Elements';
import { IconGlossary } from '../iter2/IconGlossary';
import { StudySection, type Review } from '../iter2/IterationTwo';
import { studies, type Study } from '../iter2/catalog';

// Operational review surface: curate decisions without changing or promoting specimens.
const focused: Study[] = studies.filter(s => ['activity', 'material', 'preview', 'workspace', 'permission', 'questions', 'attachment'].includes(s.id)).map(s => s.id === 'material' ? {
  ...s, title: 'User-message material',
  brief: 'Compare the requested composer-matched bubble with the previous diffusion. The chosen code-block treatment is outside this review.',
  decision: 'Does the composer-matched fill resolve the dark, sheeny bubble?',
  a: 'Composer-matched fill', aNote: 'Composer fill with the stronger focused diffusion shown in your reference.',
  b: 'Previous diffusion', bNote: 'Previous bubble retained only as a comparison reference.',
  states: ['User message'], start: 'User message',
} : s);
const reviewKey = 'caelos-atlas3-studio-review-v3';
type Reviews = Record<string, Review>;
function readReviews(): { reviews: Reviews; problem: string } {
  try {
    const raw = localStorage.getItem(reviewKey);
    if (!raw) return { reviews: {}, problem: '' };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || Object.values(parsed).some(v => !v || typeof v !== 'object' || Array.isArray(v))) throw new Error();
    return { reviews: parsed, problem: '' };
  } catch { return { reviews: {}, problem: 'Saved Iter 3 notes could not be read. The stored copy is untouched; export new notes before leaving.' }; }
}
export function IterationThree() {
  const [initial] = useState(readReviews);
  const [reviews, setReviews] = useState<Reviews>(initial.reviews);
  const [notice, setNotice] = useState(initial.problem || 'Notes save separately from Iter 1 and Iter 2.');
  const [reduced, setReduced] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  function record(id: string, review: Review) {
    const next = { ...reviews, [id]: review }; setReviews(next);
    if (initial.problem) return;
    try { localStorage.setItem(reviewKey, JSON.stringify(next)); setNotice('Saved in this browser. Export for a durable copy.'); }
    catch { setNotice('Browser storage is unavailable. Export your notes before leaving.'); }
  }
  function exportReview() {
    downloadText('atlas-three-iter3-review.md', `# Atlas Three · Iter 3 review\n\nExported ${new Date().toISOString()}\n\nSeven open studies, including restored permission, question and attachment reviews. Numbers match Iter 2. Existing specimens; no automatic approval or promotion. Iter 1/2 notes remain separate.\n\n` + focused.map(s => `## ${s.title}\n\nDecision: ${s.decision}\n\n- A: ${s.a} — ${s.aNote}\n- B: ${s.b} — ${s.bNote}\n\nDirection: ${reviews[s.id]?.choice || 'Not reviewed'}\n\n${reviews[s.id]?.notes || '(No notes yet)'}\n`).join('\n'));
    setNotice('Iter 3 review exported. Your browser copy remains saved.');
  }
  const reviewed = focused.filter(s => reviews[s.id]?.choice && reviews[s.id].choice !== 'Not reviewed').length;
  return <CaelosProvider className="iter2" theme={theme} reducedMotion={reduced}>
    <header className="i2-intro"><div><p className="i2-eyebrow">Studio / Iter 3</p><h2>Seven studies to tighten up.</h2><p>Activity rows, user-message material, inline previews, and the expanded workspace. Permissions, questions and file cards are back in the queue. Study numbers match Iter 2.</p></div><div className="i2-review-summary"><span>{reviewed} / {focused.length} reviewed</span><Button variant="tonal" size="sm" leadingIcon={<Download size={14} />} onClick={exportReview}>Export review</Button><span className="i2-meta" role="status">{notice}</span></div></header>
    <details className="i2-footnote"><summary>Carried forward from your review</summary><p>Inline agent names; glass code shell with a raised plain reading plane; quiet citation chips; icon-led recovery. Permissions, questions and file cards still require review and are included below. Nothing is approved or promoted by this filter.</p><p>The composer remains locked. The icon glossary is available below as a reference, outside the comparison queue.</p></details>
    <div className="i2-global-controls"><label className="i2-check"><Checkbox checked={reduced} onChange={e => setReduced(e.target.checked)} />Reduced motion</label><Select label="Preview theme" value={theme} onValueChange={v => setTheme(v as 'dark' | 'light')} options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} /><a className="i2-glossary-link" href="#i3-icons">Icon glossary ↓</a></div>
    <nav className="i2-index" aria-label="Iteration 3 remaining decisions">{focused.map(s => <a href={`#i3-${s.id}`} key={s.id}><span>{String(studies.findIndex(item => item.id === s.id) + 1).padStart(2, '0')}</span>{s.title}<small>{reviews[s.id]?.choice && reviews[s.id].choice !== 'Not reviewed' ? reviews[s.id].choice : '—'}</small></a>)}</nav>
    <div className="i2-studies">{focused.map(study => <StudySection prefix="i3" key={study.id} study={study} number={studies.findIndex(item => item.id === study.id) + 1} reduced={reduced} review={reviews[study.id] || {}} onReview={review => record(study.id, review)} />)}</div>
    <IconGlossary id="i3-icons" reduced={reduced} />
    <footer className="i2-footnote">Iter 1 and Iter 2 retain the full review history. These are isolated local fixtures; no staging, Foundry, shared component, or composer changes.</footer>
  </CaelosProvider>;
}
