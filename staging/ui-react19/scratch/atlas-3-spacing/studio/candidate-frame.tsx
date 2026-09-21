import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CaelosProvider, Dialog, Surface, Inset } from '../../../dist/index.js';
import { CandidateItem } from '../chat-ui-lab/Candidate';
import { DocumentBody } from '../chat-ui-lab/Baseline';
import { UnreadMarker } from '../chat-ui-lab/InteractionCard';
import { scenarios, type Lifecycle, type LabItem } from '../chat-ui-lab/fixtures';
import { studies } from './catalog';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource-variable/yrsa';
import '../../../dist/styles.css';
import '../chat-ui-lab/lab.css';
import './frame.css';
const params = new URLSearchParams(location.search), id = params.get('component'), state = params.get('state') || 'complete';
const study = studies.find(s => s.id === id)!;
const scenario = scenarios.find(s => s.id === study?.candidate?.scenario)!;
function CandidateFrame() {
  const [decision, setDecision] = useState(''); const [answer, setAnswer] = useState(''); const [locked, setLocked] = useState(false); const [recovered, setRecovered] = useState(false); const [expanded, setExpanded] = useState<LabItem | null>(null); const [elapsed, setElapsed] = useState(0);
  const item = scenario.items.find(i => !study.candidate?.kind || i.kind === study.candidate.kind)!;
  const mapped: Lifecycle = state === 'streaming' || state === 'running' || state === 'generating' || state === 'uploading' ? 'in-progress' : state === 'awaiting decision' || state.includes('wait') ? 'waiting' : ['failed','interrupted','in-progress'].includes(state) ? state as Lifecycle : 'complete';
  const sourceStage = (recovered || locked ? item.stages.find(s => s.state === 'complete') : item.stages.find(s => s.state === mapped)) || item.stages.at(-1)!;
  const stage = id === 'permission' && (state === 'denied' || decision === 'deny') ? { ...sourceStage, state: 'complete' as const, text: 'Permission denied in this local experiment.' } : sourceStage;
  useEffect(() => { if (mapped !== 'in-progress') return; const start = performance.now(); const timer = setInterval(() => setElapsed(performance.now() - start), 100); return () => clearInterval(timer); }, []);
  return <CaelosProvider theme="dark" className="chat-ui-lab" reducedMotion={false}><Surface layer="ground" style={{ minHeight: '100dvh' }}><div className="fixture-caption">Local experiment · synthetic content · not a staging implementation · {stage.state}{sourceStage.state !== mapped && !locked && !recovered ? ` (requested ${state} has no matching candidate snapshot)` : ''}</div><div className="fixture-stage">
    {id === 'unread' ? <UnreadMarker count={3} /> : <CandidateItem item={item} stage={stage} scenario={{ ...scenario, items: [item] }} time={stage.at + elapsed} staticPreview={mapped !== 'in-progress' && !['permission','question','recovery','upload-retry'].includes(id || '')} onExpand={setExpanded} onRecover={() => setRecovered(true)} interaction={{ answer, locked, onAnswer: setAnswer, onDecision: value => { setDecision(value.value); setLocked(true); } }} />}
    {expanded && <Dialog open onOpenChange={open => !open && setExpanded(null)} title={expanded.title}><Inset><DocumentBody scenario={scenario} /></Inset></Dialog>}
  </div></Surface></CaelosProvider>;
}
createRoot(document.getElementById('root')!).render(scenario ? <CandidateFrame /> : <p>No candidate is available.</p>);
