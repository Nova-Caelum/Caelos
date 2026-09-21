import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import useSWR, { SWRConfig } from 'swr';
import { surface } from '@nova-caelum/ui/recipes';
import type { Vote } from '@/lib/db/schema';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { CaelosThemeProvider } from '@/components/caelos-theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DataStreamProvider } from '@/components/chat/data-stream-provider';
import { SessionProvider } from '@/client/session';
import { PreviewMessage, ThinkingMessage } from '@/components/chat/message';
import { MessageReasoning } from '@/components/chat/message-reasoning';
import { DocumentPreview } from '@/components/chat/document-preview';
import { Artifact } from '@/components/chat/artifact';
import { PreviewAttachment } from '@/components/chat/preview-attachment';
import { Greeting } from '@/components/chat/greeting';
import { Messages } from '@/components/chat/messages';
import { MultimodalInput } from '@/components/chat/multimodal-input';
import { initialArtifactData, useArtifact } from '@/hooks/use-artifact';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import type { ChatMessage, Attachment } from '@/lib/types';
import { documentId, documentText, documentTitle, fixtureRequests } from './fixture-network';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource-variable/yrsa';
import 'katex/dist/katex.min.css';
import '@/app/globals.css';
import '@nova-caelum/ui/styles.css';
import '@/app/nova-theme.css';
import '@/client/fonts.css';
import './frame.css';
const params = new URLSearchParams(location.search), component = params.get('component') || 'reasoning', state = params.get('state') || 'complete';
const noop = async () => {};
const text = 'I’ll review the conversation, its supporting activity, and the document reading plane. Each should feel related while remaining easy to distinguish.';
const markdown = '# A clear review\n\nKeep **identity** quiet and use *space* to explain relationships.\n\n- Inspect the actual implementation.\n- Compare one change at a time.\n\n> Leave room for the conversation.\n\n| Component | Review |\n| --- | --- |\n| Reasoning | Disclosure |\n| Artifact | Reading plane |\n\n```ts\nconst review = { status: "explore", approved: false };\nconsole.log(review);\n```\n\n[Illustrative reference](#reference)';
function message(role: 'user' | 'assistant', value: string, id = 'fixture-message', agent = 'Hermes'): ChatMessage { return { id, role, parts: [{ type: 'text', text: value }], metadata: { createdAt: '2026-09-19T12:00:00Z', agent: { id: agent.toLowerCase(), name: agent } } } as ChatMessage; }
function Specimen() {
  const [input, setInput] = useState(''); const [attachments, setAttachments] = useState<Attachment[]>([]); const [removed, setRemoved] = useState(false); const [notice, setNotice] = useState('');
  const [decision, setDecision] = useState<boolean | undefined>(state === 'allowed' ? true : state === 'denied' ? false : undefined);
  const [chunk, setChunk] = useState(state === 'streaming' ? 24 : text.length);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [requests, setRequests] = useState(0);
  const { artifact, setArtifact } = useArtifact();
  const { data: votes = [] } = useSWR<Vote[]>('/api/vote?chatId=atlas3-fixture-chat', url => fetch(url).then(r => r.json()), { fallbackData: [] });
  useEffect(() => { const update = () => setRequests(fixtureRequests.length); window.addEventListener('studio-fixture-request', update); return () => window.removeEventListener('studio-fixture-request', update); }, []);
  useEffect(() => { if (state !== 'streaming') return; const timer = setInterval(() => setChunk(n => Math.min(text.length, n + 18)), 350); return () => clearInterval(timer); }, []);
  useEffect(() => {
    if (component === 'expanded-artifact' || (component === 'inline-artifact' && state === 'generating')) setArtifact({ ...initialArtifactData, documentId, title: documentTitle, kind: 'text', content: state === 'generating' ? '# Workspace review brief\n\nPreparing the review priorities…' : documentText, isVisible: component === 'expanded-artifact', status: state === 'generating' ? 'streaming' : 'idle' });
  }, [setArtifact]);
  const shared = { chatId: 'atlas3-fixture-chat', setMessages, regenerate: noop, addToolApprovalResponse: async (value: { approved: boolean }) => { setDecision(value.approved); setNotice(value.approved ? 'Allowed in this fixture.' : 'Denied in this fixture.'); }, isReadonly: false, isLoading: false, requiresScrollPadding: false };
  const preview = (m: ChatMessage, extra = {}) => <PreviewMessage {...shared} message={m} vote={votes.find(v => v.messageId === m.id)} onEdit={() => setNotice('Edit callback received by fixture. The composer is unchanged.')} {...extra} />;
  const artifactProps = { ...shared, input, setInput, status: 'ready' as const, stop: noop, attachments, setAttachments, messages, votes, sendMessage: async () => { setNotice('Artifact request captured locally. No model was called.'); }, selectedVisibilityType: 'private' as const, selectedModelId: DEFAULT_CHAT_MODEL };
  let content: React.ReactNode;
  if (component === 'reasoning') content = <MessageReasoning isLoading={state === 'streaming'} reasoning={state === 'streaming' ? text.slice(0, chunk) : text} />;
  else if (component === 'waiting') content = state === 'initial wait' ? <ThinkingMessage /> : preview({ ...message('assistant', ''), parts: [] }, { isLoading: true });
  else if (component === 'inline-artifact') content = <DocumentPreview isReadonly={false} result={state === 'generating' ? undefined : { id: documentId, title: documentTitle, kind: 'text' }} />;
  else if (component === 'expanded-artifact') content = <div><p>The conversation remains beside its supporting document.</p><button onClick={() => setArtifact({ ...initialArtifactData, documentId, title: documentTitle, kind: 'text', content: documentText, isVisible: true, status: 'idle' })}>Reopen document</button></div>;
  else if (component === 'attachment') content = removed ? <button onClick={() => setRemoved(false)}>Restore fixture attachment</button> : <PreviewAttachment attachment={{ name: 'workspace-brief.pdf', url: '', contentType: 'application/pdf' }} isUploading={state === 'uploading'} onRemove={() => setRemoved(true)} />;
  else if (component === 'empty') content = <Greeting />;
  else if (component === 'navigation') content = <div style={{ height: 'calc(100dvh - 60px)', display: 'flex', flexDirection: 'column' }}><Messages {...shared} status="ready" messages={Array.from({ length: 20 }, (_, i) => message(i % 4 === 0 ? 'user' : 'assistant', `Review note ${i + 1}. ${text}`, `navigation-${i}`, i % 3 === 0 ? 'Athena' : 'Hermes'))} votes={[]} isArtifactVisible={false} selectedModelId={DEFAULT_CHAT_MODEL} /></div>;
  else if (component === 'composer') content = <div style={{ paddingTop: 170 }}><MultimodalInput {...artifactProps} sendMessage={async () => { setNotice(`Local submission captured: ${input || '(empty)'}`); setInput(''); }} /></div>;
  else if (component === 'tool' || component === 'permission') {
    const part: Record<string, unknown> = { type: 'tool-getWeather', toolCallId: 'fixture-weather', input: { city: 'New York', latitude: 40.7, longitude: -74 }, state: 'input-available' };
    if (component === 'permission') { part.state = decision === undefined ? 'approval-requested' : decision ? 'approval-responded' : 'output-denied'; part.approval = { id: 'fixture-approval', approved: decision }; }
    else if (state === 'denied') part.state = 'output-denied';
    else if (state === 'failed') { part.state = 'output-error'; part.errorText = 'Fixture weather service unavailable.'; }
    else if (state === 'complete') { part.state = 'output-available'; part.output = { latitude: 40.7, longitude: -74, cityName: 'New York', current: { time: '2026-09-19T12:00', temperature_2m: 21 }, current_units: { temperature_2m: '°C' }, hourly: { time: ['2026-09-19T12:00', '2026-09-19T13:00', '2026-09-19T14:00'], temperature_2m: [21,22,23] }, daily: { sunrise: ['2026-09-19T06:30'], sunset: ['2026-09-19T19:00'] } }; }
    content = preview({ ...message('assistant', ''), parts: [part] } as ChatMessage);
  } else if (component === 'identity') content = <div className="fixture-stack">{preview(message('assistant', text))}{state === 'continuation' && preview(message('assistant', 'The same speaker can continue quietly, without repeating the full identity.', 'continuation'), { continued: true })}{state === 'multiple agents' && preview(message('assistant', 'I’ll take the document review and bring back any findings.', 'athena', 'Athena'))}</div>;
  else content = preview(message(component === 'user' || (component === 'actions' && state === 'user') ? 'user' : 'assistant', component === 'markdown' ? markdown : state === 'long text' ? Array(7).fill(text).join('\n\n') : text.slice(0, chunk)), { isLoading: state === 'streaming' && chunk < text.length });
  return <><div className="fixture-caption">Actual staging imports · local fixtures · {requests} isolated requests</div><div data-surface="ground" className={`fixture-workspace ${surface({ layer: "ground" })}`}><main className="fixture-stage" style={artifact.isVisible ? { flex: 1, minWidth: 0 } : undefined}>{content}</main>{(component === 'inline-artifact' || component === 'expanded-artifact') && <Artifact {...artifactProps} />}</div><p className="fixture-notice" role="status">{notice}</p><Toaster /></>;
}
class Boundary extends React.Component<{ children: React.ReactNode }, { error?: string }> { state: { error?: string } = {}; static getDerivedStateFromError(error: Error) { return { error: error.message }; } render() { return this.state.error ? <div role="alert" style={{ padding: 24 }}>Actual specimen could not render: {this.state.error}</div> : this.props.children; } }
createRoot(document.getElementById('root')!).render(<Boundary><BrowserRouter><SWRConfig value={{ provider: () => new Map(), revalidateOnFocus: false, shouldRetryOnError: false }}><ThemeProvider attribute="class" forcedTheme="dark"><CaelosThemeProvider><TooltipProvider><SessionProvider><DataStreamProvider><Specimen /></DataStreamProvider></SessionProvider></TooltipProvider></CaelosThemeProvider></ThemeProvider></SWRConfig></BrowserRouter></Boundary>);
