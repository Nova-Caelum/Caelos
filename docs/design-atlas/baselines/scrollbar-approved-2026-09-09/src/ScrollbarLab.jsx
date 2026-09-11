import React, {useState} from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import {Folder, Search, Plus, Mic, Brain, ArrowUp, SlidersHorizontal, Check, FileText} from 'lucide-react';
import './input-lab.css';
import './scrollbar-lab.css';

const projects=['Governance Evolution Sprint','Design foundations','Agent workspace','Research & discovery','Taskgraph refinement','Platform architecture','Conversation experience','Personal knowledge','Team rituals','Connected tools','Launch preparation','The next chapter'];
const commands=['Add a file','Add a folder','Add an agent','Add a goal','Add a session rule','Reference a project','Reference a task','Reference a conversation','Add a working note','Attach a screenshot','Attach a document','Attach a link'];
const draft=['Let’s bring the next chapter of Caelos into focus.','', 'I want the workspace to feel considered in the smallest details. A quiet surface, comfortable lettering, and enough room for each thought to land.','', 'Keep the important controls close. Let the surrounding interface settle into the background while I write.','', 'When this message grows, the composer should stay grounded. Only the words need to move.','', 'Preserve our soft divisions and the warmth of dawn cream. Give each action a clear purpose.','', 'These final lines let us try the scrollbar at the bottom as well as the top.'];
function Scroller({children,label,editable=false}) {
  const [drag,setDrag]=useState(false);
  return <ScrollArea.Root className="sb-scroll" type="auto" data-dragging={drag}>
    <ScrollArea.Viewport className="sb-viewport" tabIndex={editable?undefined:0} role={editable?undefined:'region'} aria-label={editable?undefined:label}>
      {editable?<div className="sb-draft" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label={label}>{draft.join('\n')}</div>:children}
    </ScrollArea.Viewport>
    <ScrollArea.Scrollbar className="sb-track" orientation="vertical" onPointerDown={()=>setDrag(true)} onPointerUp={()=>setDrag(false)} onPointerCancel={()=>setDrag(false)} onLostPointerCapture={()=>setDrag(false)}><ScrollArea.Thumb className="sb-thumb"/></ScrollArea.Scrollbar>
  </ScrollArea.Root>;
}
function Specimen({context,preview}) {
  const [selected,setSelected]=useState('Governance Evolution Sprint');
  const [command,setCommand]=useState('');
  return <article className="sb-comparison-card" data-preview={preview}>
    <div className="sb-card-heading"><span className="input-eyebrow">APPROVED · SCROLLBAR</span><h2>Soft presence</h2><p>A desaturated violet trace, with no change on hover.</p></div>
    <div className={`sb-stage sb-stage-${context}`}>
      {context==='sidebar'?<div className="sb-frame sb-sidebar"><div className="sb-frame-title"><span>Workspace</span><Search size={15}/></div><span className="sb-section-label">PROJECTS</span><Scroller label={`Quiet project list`}>{projects.map(name=><button className="sb-row" key={name} aria-pressed={selected===name} onClick={()=>setSelected(name)}><Folder size={15}/><span>{name}</span></button>)}</Scroller><div className="sb-frame-footer"><span className="sb-presence"/> A little room for what’s next</div></div>:context==='menu'?<div className="sb-frame sb-menu"><div className="sb-frame-title"><span>Add to this conversation</span><Plus size={16}/></div><Scroller label={`Quiet add menu`}>{commands.map((name,i)=><button className="sb-row" key={name} onClick={()=>setCommand(name)}><FileText size={15}/><span>{name}</span>{command===name&&<Check size={14}/>}</button>)}</Scroller><div className="sb-frame-footer" role="status">{command?`${command} selected · preview only`:'A long list, kept within reach'}</div></div>:<div className="sb-composer-wrap"><div className="sb-composer-caption">A longer thought, comfortably contained.</div><div className="sb-frame sb-composer"><Scroller label={`Quiet editable message`} editable/><div className="sb-composer-controls" aria-hidden="true"><div><Plus size={17}/><Mic size={16}/></div><div><Brain size={18}/><span className="sb-send"><ArrowUp size={16}/></span></div></div></div><p className="sb-composer-note">Editable preview · scroll inside the writing area</p></div>}
    </div>
    <div className="sb-state-strip" aria-hidden="true">{['rest','drag'].map(state=><div key={state}><span className={`sb-swatch sb-swatch-${state}`}/><span>{state==='drag'?'Dragging':'Rest · hover'}</span></div>)}</div>
  </article>;
}
export default function ScrollbarLab({reduced=false}) {
  const [context,setContext]=useState('sidebar'),[mode,setMode]=useState('dark'),[preview,setPreview]=useState('live'),[reduce,setReduce]=useState(false);
  return <div className="input-lab scrollbar-lab" data-mode={mode} data-reduced={reduced||reduce} id="scrollbars">
    <header className="intro"><span className="eyebrow">THE FINAL DETAIL · APPROVED SCROLLBAR</span><h1>A quiet sense of place.</h1><p>Visible when you need it. Quiet enough to let everything else lead.</p></header>
    <div className="sb-controls"><div className="input-options" role="group" aria-label="Scrollbar context">{['sidebar','menu','composer'].map(c=><button aria-pressed={c===context} onClick={()=>setContext(c)} key={c}>{c==='sidebar'?'Sidebar':c==='menu'?'Long menu':'Composer'}</button>)}</div><div className="input-options" role="group" aria-label="Scrollbar theme">{['dark','light'].map(m=><button key={m} aria-pressed={mode===m} onClick={()=>setMode(m)}>{m==='dark'?'Dark':'Light'}</button>)}</div></div>
    <div className="sb-grid"><Specimen key={context} context={context} preview={preview}/></div>
    <div className="sb-bottom"><div><SlidersHorizontal size={15}/><span>Preview a state</span><div className="input-options" role="group" aria-label="Scrollbar state preview">{['live','drag'].map(s=><button key={s} aria-pressed={preview===s} onClick={()=>setPreview(s)}>{s==='live'?'Interactive':'Dragging'}</button>)}</div></div><button className="input-option" aria-pressed={reduce} onClick={()=>setReduce(!reduce)}>Reduce motion</button></div>
    <p className="sb-footnote">Scroll, drag, or focus a list and use the arrow keys. Hover stays unchanged. Dragging adds only a little definition, without glow or expansion.</p>
  </div>;
}
