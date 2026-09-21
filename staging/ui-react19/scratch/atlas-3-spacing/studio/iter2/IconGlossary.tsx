import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUpRight, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsRight, Copy, Download, FileText, Globe, Maximize2, Minimize2, PanelRight, Pause, Pencil, Play, Redo2, RotateCcw, ThumbsDown, ThumbsUp, Undo2, Bot, Zap, Flame, PanelLeft, MessageSquare, Volume2, Captions, Folder, Goal, AudioLines, ArrowUp, Plus, Mic, KeyRound, Brain, Square, Wrench, X } from 'lucide-react';
import { Button, Chip, NovaLoader, Surface } from '../../../../dist/index.js';
import { ClaudeCodeIcon, CodexIcon, HermesIcon } from '../icons/HarnessIcons';
import claudeSvg from '../icons/ClaudeCode.svg?url';
import codexSvg from '../icons/Codex.svg?url';
import hermesSvg from '../icons/Hermes.svg?url';
import './icon-glossary.css';
import { RippleLoader } from '../../../../src/RippleLoader';
const icons = [
  [Zap, 'Zap', 'Thinking · reasoning', 'Approved thinking symbol.'],
  [Flame, 'Flame', 'General action · Request suggestions', 'Approved general-action symbol when no more specific action applies.'],
  [Wrench, 'Wrench', 'Reading the workspace brief', 'Tool action in the activity chain. The verb identifies what the tool does.'],
  [Bot, 'Bot', 'Athena · checking spacing / Agent session', 'Delegated activity and its session preview.'],
  [FileText, 'FileText', 'Document · Read document · PDF', 'Document preview, filename strip, attachment, and exit editing.'],
  [Globe, 'Globe', 'Web preview', 'Web section header.'],
  [ChevronDown, 'ChevronDown', '3 steps · Document · Web preview', 'Open or close disclosure; rotates on expansion.'],
  [ChevronRight, 'ChevronRight', 'Action detail · Next question · Show document tools', 'Expand detail or move forward, depending on the labelled control.'],
  [ChevronLeft, 'ChevronLeft', 'Previous question', 'Return to an earlier question.'],
  [ChevronsRight, 'ChevronsRight', 'Collapse document tools', 'Hide the expanded toolbar.'],
  [Maximize2, 'Maximize2', 'Expand preview · Full screen editor', 'Open a reading workspace or enlarge it.'],
  [Minimize2, 'Minimize2', 'Exit full screen', 'Return to the side panel.'],
  [PanelLeft, 'PanelLeft', 'Toggle left side panel', 'One generic mark for the left-hand panel. Approved mapping 2026-09-20: the open and close states share this icon and this label; the panel’s own state says which way it will go, so the icon never changes.'],
  [PanelRight, 'PanelRight', 'Toggle right side panel', 'One generic mark for the right-hand panel (the artifact workspace). Approved mapping 2026-09-20: the open and close states share this icon and this label.'],
  [Pencil, 'Pencil', 'Edit message · Edit document', 'Enter editing.'],
  [Check, 'Check', 'Save message · Selected answer', 'Confirm an edit or identify an answered choice. Not used on Allow.'],
  [Copy, 'Copy', 'Copy response / message / code / document / path / URL', 'Copies the object named in the tooltip.'],
  [Download, 'Download', 'Download preview · Export review', 'Save the fixture document or review file.'],
  [Undo2, 'Undo2', 'Undo', 'Previous local document version.'],
  [Redo2, 'Redo2', 'Redo', 'Next local document version.'],
  [RotateCcw, 'RotateCcw', 'Retry upload / response · Revert document · Reset examples', 'Retry failures, restore the original document, or reset a study; tooltip makes the action explicit.'],
  [ThumbsUp, 'ThumbsUp', 'Good response', 'Positive response feedback.'],
  [ThumbsDown, 'ThumbsDown', 'Poor response', 'Negative response feedback.'],
  [ArrowUpRight, 'ArrowUpRight', 'Workspace guide · Spacing reference', 'External source chip opens a new tab.'],
  [ArrowDown, 'ArrowDown', 'Jump to latest', 'Finished work below the current scroll position.'],
  [X, 'X', 'Upload interrupted', 'Failed file indicator. Not used on Deny.'],
  [Play, 'Play', 'Play', 'Start or resume the study timeline.'],
  [Pause, 'Pause', 'Pause', 'Pause the study timeline.'],
] as const;
const composerIcons = [
  [Plus, 'Plus', 'Add to conversation', 'Opens the addition menu.'],
  [Folder, 'Folder', 'File or folder', 'Addition menu.'],
  [Bot, 'Bot', 'Agent', 'Addition menu.'],
  [Goal, 'Goal', 'Goal', 'Addition menu and goal context pill.'],
  [FileText, 'FileText', 'Session instruction', 'Addition menu and instruction context pill.'],
  [Mic, 'Mic', 'Dictate a message', 'Composer toolbar.'],
  [Brain, 'Brain', 'Model settings', 'Agent, model and reasoning controls.'],
  [MessageSquare, 'MessageSquare', 'Text', 'Reply format: text only.'],
  [Volume2, 'Volume2', 'Voice', 'Reply format: voice only.'],
  [Captions, 'Captions', 'Text + voice', 'Reply format: both.'],
  [AudioLines, 'AudioLines', 'Live Conversation Mode', 'Primary action when the composer is empty.'],
  [ArrowUp, 'ArrowUp', 'Send message', 'Primary action when ready to submit.'],
  [Square, 'Square', 'Stop response / live conversation', 'Replaces the primary action while active.'],
  [KeyRound, 'KeyRound', 'Conversation permissions', 'Permission selector above the writing surface.'],
  [Check, 'Check', 'Selected option', 'Choice menu selection indicator.'],
  [X, 'X', 'Remove goal / instruction', 'Context pill remove control.'],
] as const;
const categories = [['choices','Thinking & actions'],['harnesses','Harness icons'],['conversation','Conversation & panels'],['composer','Composer · locked'],['status','Loaders & status']] as const;
const choices = [
  {title:'Thinking', description:'Zap identifies thinking and reasoning. Brain remains the composer’s model-settings control.', entries:[
    [Zap, 'Zap', 'Considering the layout', 'Approved · thinking and reasoning.'],
  ]},
  {title:'General actions', description:'Flame identifies general actions. Wrench stays specific to tool use; Bot identifies delegated agent work.', entries:[
    [Flame, 'Flame', 'Updating the workspace', 'Approved · general action.'],
  ]},
] as const;
const harnesses = [
  [HermesIcon, 'Hermes agent', hermesSvg, 'Negative-space trace. Cream interior shapes; original black hair and eyes are transparent. Fine details are best at 24px and above.'],
  [ClaudeCodeIcon, 'Claude Code', claudeSvg, 'Original pixel silhouette, monochrome. Eye cutouts remain transparent.'],
  [CodexIcon, 'Codex', codexSvg, 'Original supplied mark, padded to a 20px live area. Terminal cutouts remain transparent.'],
] as const;
export function IconGlossary({ reduced, id = 'i2-icons' }: { reduced: boolean; id?: string }) {
  const [open, setOpen] = useState(() => window.location.hash === `#${id}`);
  const [category, setCategory] = useState<string>('choices');
  useEffect(() => { const reveal = () => { if (window.location.hash === `#${id}`) setOpen(true); }; window.addEventListener('hashchange', reveal); return () => window.removeEventListener('hashchange', reveal); }, [id]);
  return <section className="i2-study" id={id}>
    <div className="i2-study-heading"><div><h3>Icon glossary & semantic controls</h3><p>Review symbols by meaning. Existing controls, proposed alternatives and custom harness marks are identified separately.</p></div><Button variant="text" aria-expanded={open} aria-controls={`${id}-content`} onClick={() => setOpen(!open)}>{open ? 'Close glossary' : 'Open glossary'}</Button></div>
    {open && <div id={`${id}-content`} className="i2-glossary-layout">
      <Surface layer="elevated" className="i2-glossary-nav"><nav aria-label="Icon glossary sections">{categories.map(([key,label]) => <Button key={key} variant={category===key?'tonal':'text'} aria-current={category===key?'page':undefined} aria-controls={`${id}-panel`} onClick={() => setCategory(key)}>{label}</Button>)}</nav><p className="i2-meta">Scratch proposals only. Composer icons are a read-only inventory.</p></Surface>
      <div id={`${id}-panel`} className="i2-glossary-panel">
        {category==='choices' && <><h4>Separate meanings, separate symbols</h4><p className="i2-meta">Zap for thinking. Flame for general actions.</p>{choices.map(group => <section className="i2-icon-choice" key={group.title}><h3>{group.title}</h3><p className="i2-meta">{group.description}</p><div className="i2-icon-grid">{group.entries.map(([Icon,name,label,meaning]) => <Surface layer="elevated" key={name} className="i2-icon-entry"><Icon size={24} strokeWidth={1.75} aria-hidden/><div><h4>{name}</h4><div className="i2-icon-sample"><Icon size={16} aria-hidden/><span>{label}</span></div><p>{meaning}</p></div></Surface>)}</div></section>)}</>}
        {category==='harnesses' && <><h3>Harness icons</h3><p className="i2-meta">24 × 24 SVG · currentColor · transparent background. Filled brand marks with Lucide-compatible sizing; local drafts for review.</p><div className="i2-harness-grid">{harnesses.map(([Icon,name,url,note]) => <Surface layer="elevated" className="i2-harness-card" key={name}><h4>{name}</h4><div className="i2-harness-hero"><Icon size={96}/></div><div className="i2-harness-sizes">{[16,20,24,32,48].map(size=><span key={size}><Icon size={size}/><code>{size}px</code></span>)}</div><div className="i2-harness-contrast"><span className="i2-harness-on-light"><Icon size={32}/></span><span className="i2-harness-on-dark"><Icon size={32}/></span><span className="i2-harness-on-grid"><Icon size={32}/></span></div><p className="i2-meta">{note}</p><a href={url} download={name.toLowerCase().replaceAll(' ','-')+'.svg'}>Download SVG</a></Surface>)}</div></>}
        {(category==='conversation'||category==='composer') && <><h3>{category==='composer'?'Composer · existing icons':'Conversation & panel controls'}</h3><p className="i2-meta">{category==='composer'?'Read directly from composer-internal.jsx. No composer controls or icons have been edited.':'Bot replaces the people symbol for delegated agent work. Side panels use one generic mark per side — PanelLeft and PanelRight — for both the open and the close state, labelled “Toggle left side panel” and “Toggle right side panel” (approved 2026-09-20).'}</p><div className="i2-icon-grid">{(category==='composer'?composerIcons:icons).map(([Icon,name,label,meaning]) => <Surface layer="elevated" key={name} className="i2-icon-entry"><Icon size={23} aria-hidden/><div><h4>{label}</h4><code>{name}</code><p>{meaning}</p></div></Surface>)}</div></>}
        {category==='status' && <><h3>Loaders & semantic controls</h3><div className="i2-icon-grid"><Surface layer="elevated" className="i2-icon-entry"><RippleLoader size={16} paused={reduced}/><div><h4>Working · Waiting · Uploading</h4><code>RippleLoader</code><p>Small activity indicator beside an agent or current step. Uses surrounding text colour.</p></div></Surface><Surface layer="elevated" className="i2-icon-entry"><NovaLoader size={42} paused={reduced}/><div><h4>Generating document · Working below</h4><code>NovaLoader</code><p>Large empty preview during generation; smaller instance in the jump control.</p></div></Surface></div><Surface layer="elevated" className="i2-token-reference"><h4>Shared controls and status pills</h4><p className="i2-meta">Button, Chip and Surface use the React 19 package. Failure accents use maintained semantic danger tokens.</p><div className="i2-row"><Button danger variant="tonal" className="i2-danger-control">Deny</Button><Button variant="tonal">Clarify</Button><Button variant="primary">Allow</Button><Chip variant="status" tone="progress">Working</Chip><Chip variant="status" tone="done">Done</Chip><Chip variant="status" tone="danger">Failed</Chip></div><p className="i2-meta">Deny / Clarify / Allow stay text-only. Failures use danger-tint, danger-line, danger-glow and danger-on-tint.</p></Surface></>}
      </div>
    </div>}
  </section>;
}
