import React, {useState,useEffect,useLayoutEffect,useRef} from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import {ArrowUp,Search,X,Pin,Copy,Info,Download,MessageSquare} from 'lucide-react';
import './input-lab.css';
import ReplyComposer from './ReplyComposer';

function HelpTip({label,detail,shortcut,children,mode='dark',reduced=false,tone='sage'}) {
  return <Tooltip.Root><Tooltip.Trigger asChild>{children}</Tooltip.Trigger><Tooltip.Portal><Tooltip.Content className="input-tip" data-tone={tone} data-mode={mode} data-reduced={reduced} sideOffset={9} collisionPadding={14}><span className="input-tip-line">{label}{shortcut&&<kbd>{shortcut}</kbd>}</span>{detail&&<span className="input-tip-detail">{detail}</span>}</Tooltip.Content></Tooltip.Portal></Tooltip.Root>;
}
const titles={short:'Project name',search:'Search your workspace',large:'Project brief'};
const placeholders={short:'Give your project a name…',search:'Find a task, project, or person…',large:'What should we accomplish, and what does done look like?'};
const tasks=['Refine material surfaces','Review sidebar navigation','Document the input family'];
function Field({kind,variant,state,value,onChange}) {
  const id=`study-${variant}-${kind}`;
  const invalid=state==='Needs attention'&&kind==='short'&&!value.trim();
  const props={id,value,onChange:e=>onChange(e.target.value),placeholder:placeholders[kind],disabled:state==='Disabled','aria-describedby':`${id}-hint`,'aria-invalid':invalid||undefined};
  return <div className={`input-specimen ${variant}`} data-state={state.toLowerCase()}>
    <label htmlFor={id}>{titles[kind]}</label>
    <div className={`input-shell input-${kind}`} data-invalid={invalid}>
      {kind==='search'&&<Search size={15} className="input-search-icon" aria-hidden="true"/>}
      {kind==='large'?<textarea {...props} rows={4}/>:<input {...props} type="text" autoComplete="off"/>}
      {kind==='search'&&value&&<button className="input-clear" aria-label={`Clear ${variant} search`} disabled={state==='Disabled'} onClick={()=>onChange('')}><X size={13}/></button>}
    </div>
    <p className={invalid?'input-error':'input-field-hint'} id={`${id}-hint`}>{invalid?'A project name is needed before you continue.':kind==='large'?'Drag the lower corner to give your thoughts more room.':kind==='search'?'Search stays quiet until you need it.':'A visible label stays with you while you type.'}</p>
    {kind==='search'&&value&&<div className="input-results" role="status">{tasks.filter(t=>t.toLowerCase().includes(value.toLowerCase())).map(t=><span key={t}>{t}</span>)}{!tasks.some(t=>t.toLowerCase().includes(value.toLowerCase()))&&<span>No matching tasks in this sample.</span>}</div>}
  </div>;
}
const LINE=22.4,PAD=8,CHROME=48.6,SINGLE=32.89,GROWN=21.39,MAX_LINES=8;
const sampleLines=['Help me shape the next chapter of Caelos.','Keep the interface calm and comfortable to read.','Let space do more of the work.','Use material where it helps establish depth.','Preserve our indigo and sage focus light.','Make the small interactions feel considered.','Give each action room to breathe.','Bring it together into one coherent system.','This ninth line scrolls inside the composer.','The surrounding conversation stays in place.'];
function Composer({mode,reduced,tone}) {
  const [value,setValue]=useState(''),[narrow,setNarrow]=useState(false),[original,setOriginal]=useState(false),[receipt,setReceipt]=useState('');
  const textRef=useRef(null),shellRef=useRef(null);
  const [geometry,setGeometry]=useState({height:LINE+PAD,grown:false});
  useLayoutEffect(()=>{
    const text=textRef.current,shell=shellRef.current;if(!text||!shell)return;
    const measure=()=>{
      const width=shell.clientWidth;if(!width)return;
      text.style.flex='none';text.style.width=`${Math.max(40,width-2*SINGLE-44)}px`;text.style.height='0px';
      const grown=text.scrollHeight>Math.ceil(LINE+PAD);
      if(grown){text.style.width=`${Math.max(40,width-2*GROWN-44)}px`;text.style.height='0px';}
      const natural=text.scrollHeight;
      const height=grown?Math.max(2*LINE+PAD,Math.min(natural,MAX_LINES*LINE+PAD)):LINE+PAD;
      text.style.width='';text.style.flex='';text.style.height=`${height}px`;text.style.overflowY=natural>Math.ceil(height)?'auto':'hidden';
      setGeometry(old=>old.height===height&&old.grown===grown?old:{height,grown});
    };
    measure();let lastWidth=shell.clientWidth;const observer=new ResizeObserver(()=>{if(shell.clientWidth!==lastWidth){lastWidth=shell.clientWidth;measure();}});observer.observe(shell);
    let alive=true;document.fonts?.ready.then(()=>{if(alive)measure();});document.fonts?.addEventListener('loadingdone',measure);
    return()=>{alive=false;observer.disconnect();document.fonts?.removeEventListener('loadingdone',measure);};
  },[value,narrow,original]);
  const send=()=>{if(!value.trim())return;setReceipt(value.trim());setValue('');textRef.current?.focus();};
  const fill=n=>{setValue(sampleLines.slice(0,n).join('\n'));textRef.current?.focus();};
  return <>
    <div className="input-toolbar"><div className="input-options" role="group" aria-label="Composer lettering"><button aria-pressed={!original} onClick={()=>setOriginal(false)}>Refined lettering</button><button aria-pressed={original} onClick={()=>setOriginal(true)}>Current lettering</button></div><button className="input-option" aria-pressed={narrow} onClick={()=>setNarrow(!narrow)}>Narrow composer</button></div>
    <div className="input-composer-stage"><MessageSquare size={23} strokeWidth={1.4}/><h3>What’s on your mind?</h3><p>A quiet place to begin. Room to keep going.</p>
      <div ref={shellRef} className={`input-shell input-composer ${original?'original-lettering':''}`} style={{height:geometry.height+CHROME,borderRadius:geometry.grown?28:39.5,paddingInline:geometry.grown?GROWN:SINGLE,maxWidth:narrow?360:760}}>
        <textarea ref={textRef} value={value} aria-label="Message your agent in the atlas" aria-describedby="composer-help" placeholder="A thought, a question, a possibility…" rows={1} onChange={e=>setValue(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send();}}}/>
        <HelpTip label={value.trim()?'Send message':'Write a message to begin'} shortcut={value.trim()?'↵':undefined} mode={mode} reduced={reduced} tone={tone}><button className="input-send" aria-label="Send atlas preview message" aria-disabled={!value.trim()} onClick={send}><ArrowUp size={18}/></button></HelpTip>
      </div><p id="composer-help" className="input-composer-help">Enter to send · Shift + Enter for a new line · Preview only; stays in this page.</p>
      <div className="input-samples" role="group" aria-label="Try composer lengths">{[1,2,4,8,10].map(n=><button key={n} onClick={()=>fill(n)}>{n===10?'Overflow':`${n} ${n===1?'line':'lines'}`}</button>)}<button onClick={()=>{setValue('');setReceipt('');textRef.current?.focus();}}>Clear</button></div>
      {receipt&&<div className="input-receipt" role="status"><strong>Preview message received</strong><p>{receipt}</p></div>}
    </div>
  </>;
}
const tooltipTones=[{id:"sage",label:"Opaque sage",description:"Solid surface · the baseline."},{id:"sage-frost",label:"Frosted sage",description:"Approved · 20% transparency · 10px background blur."}];
function TooltipStudy({mode,reduced,notify,tone,setTone}) {
  const [pinned,setPinned]=useState(false),[guidance,setGuidance]=useState(false),[backdrop,setBackdrop]=useState('graph');
  return <section className="input-study-section" id="input-tooltips"><div className="input-section-heading"><span>03</span><div><h2>The small details, revealed.</h2><p>Tooltips are a primitive. They explain quiet controls without making the interface louder.</p></div></div>
    <div className="input-toolbar"><div className="input-options" role="group" aria-label="Tooltip comparison background">{['graph','color'].map(b=><button key={b} aria-pressed={backdrop===b} onClick={()=>setBackdrop(b)}>{b==='graph'?'Graph paper backdrop':'Color backdrop'}</button>)}</div><span className="input-tooltip-selection">Same text, sage tint, and shadow. Only the frost changes.</span></div>
    <div className="input-tooltip-comparison">{tooltipTones.map(option=><div className="input-tooltip-card" key={option.id}>
      <h3>{option.label}</h3><p>{option.description}</p>
      <div className="input-tip-stage" data-backdrop={backdrop}><div className="input-tip input-tip-static" data-tone={option.id} data-mode={mode}>Pin project</div><div className="input-tip input-tip-static" data-tone={option.id} data-mode={mode}><span className="input-tip-line">Daniel Eghdami</span><span className="input-tip-detail">Project owner</span></div></div>
    </div>)}</div>
    <div className="input-toolbar"><div className="input-options" role="group" aria-label="Tooltip material">{tooltipTones.map(option=><button key={option.id} aria-pressed={tone===option.id} onClick={()=>setTone(option.id)}>{option.label}</button>)}</div><span className="input-tooltip-selection">Applies to the working tooltips below and Send.</span></div>
    <div className="input-tooltip-grid"><div className="input-tooltip-samples"><span className="input-eyebrow">PALETTE · EXISTING PLATFORM TOKENS</span><p>Sage uses our existing palette. Cream lettering and a soft shadow stay identical in both versions.</p><p>The frosted version lets a little of the surroundings through while keeping the lettering fully opaque. Try both backgrounds, then choose a surface for the working tooltips below.</p></div>
      <Tooltip.Provider delayDuration={380} skipDelayDuration={250}><div className="input-tooltip-interactions"><span className="input-eyebrow">BEHAVIOR · HOVER OR TAB TO AN ICON</span>
        <div className="input-tooltip-row"><HelpTip label={pinned?'Unpin project':'Pin project'} mode={mode} reduced={reduced} tone={tone}><button className="input-icon-action" aria-label={pinned?'Unpin project':'Pin project'} aria-pressed={pinned} onClick={()=>setPinned(!pinned)}><Pin size={17} fill={pinned?'currentColor':'none'}/></button></HelpTip><div><strong>Action label</strong><span>A short label when the icon needs a name.</span></div></div>
        <div className="input-tooltip-row"><HelpTip label="Daniel Eghdami" detail="Project owner" mode={mode} reduced={reduced} tone={tone}><button className="input-icon-action input-owner" aria-label="Project owner: Daniel Eghdami" onClick={()=>notify('Daniel Eghdami · Project owner')}>DE</button></HelpTip><div><strong>Identity</strong><span>An avatar should never leave you guessing.</span></div></div>
        <div className="input-tooltip-row"><HelpTip label="Copy project reference" detail="CAE-208" mode={mode} reduced={reduced} tone={tone}><button className="input-icon-action" aria-label="Copy project reference CAE-208" onClick={async()=>{try{await navigator.clipboard.writeText('CAE-208');notify('Copied CAE-208');}catch{notify('Project reference: CAE-208');}}}><Copy size={17}/></button></HelpTip><div><strong>Useful context</strong><span>A little more detail when it helps.</span></div></div>
        <div className="input-tooltip-row"><HelpTip label="What makes a useful brief?" detail="Describe the outcome and how you’ll know it is done." mode={mode} reduced={reduced} tone={tone}><button className="input-icon-action" aria-label="Help with writing a project brief" aria-expanded={guidance} aria-controls="input-brief-guidance" onClick={()=>setGuidance(!guidance)}><Info size={17}/></button></HelpTip><div><strong>A little guidance</strong><span>Click for a persistent hint, including on touch.</span></div></div>
        {guidance&&<p id="input-brief-guidance" className="input-guidance">Describe the outcome and how you’ll know it is done.</p>}
        <p className="input-tooltip-note">Pause for a moment to reveal. Escape dismisses. Essential instructions and errors stay visible in the form.</p>
      </div></Tooltip.Provider>
    </div>
  </section>;
}
export default function InputLab({notify=()=>{},reduced=false}) {
  const [state,setState]=useState('Rest'),[mode,setMode]=useState('dark'),[grid,setGrid]=useState(true),[reduce,setReduce]=useState(false);
  const [tone,setTone]=useState('sage-frost');
  const [values,setValues]=useState({short:'',search:'',large:''});
  const [note,setNote]=useState(()=>{try{return localStorage.getItem('caelos-input-review-v1')||'';}catch{return '';}}),[saved,setSaved]=useState(true);
  useEffect(()=>{try{localStorage.setItem('caelos-input-review-v1',note);setSaved(true);}catch{setSaved(false);}},[note]);
  const download=()=>{const blob=new Blob([`# Caelos — inputs & tooltips study\n\nStatus: refined inputs and the composer approved September 8, 2026; frosted sage tooltips previously approved. See INPUTS-COMPOSER-APPROVED.md for the definitive scope.\n\nRefined work text: IBM Plex Sans, 13px / 19.5px, weight 500, letter spacing .019em, word spacing .055em.\nComposer: 14px / 22.4px with the same weight and spacing; recovered 1–8 line geometry.\nMaterial: protected text surfaces, indigo-to-sage focus, selective glass.\nTooltip material: ${tone} (opaque versus subtle frost; frost uses 20% transparency and 10px blur).\nTooltips: Radix, 380ms hover delay, keyboard focus and Escape support.\n\n## Review notes\n\n${note||'No notes yet.'}\n`],{type:'text/markdown'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='caelos-inputs-tooltips-review.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  return <div className="input-lab" data-mode={mode} data-grid={grid} data-reduced={reduced||reduce}>
    <div className="intro"><span className="eyebrow">INPUTS & TOOLTIPS · APPROVED</span><h1>More comfortable. Still Caelos.</h1><p>The focus light you love, with the reading comfort we’ve established. Try both columns, stretch a brief, and let the composer grow.</p></div>
    <div className="input-lab-settings"><div className="input-options" role="group" aria-label="Input study theme">{['dark','light'].map(m=><button key={m} aria-pressed={mode===m} onClick={()=>setMode(m)}>{m==='dark'?'Dark surfaces':'Light surfaces'}</button>)}</div><button className="input-option" aria-pressed={grid} onClick={()=>setGrid(!grid)}>Graph paper</button><button className="input-option" aria-pressed={reduce} onClick={()=>setReduce(!reduce)}>Reduced motion</button><a href="#input-tooltips">See tooltips ↓</a></div>
    <ReplyComposer mode={mode} reduced={reduced||reduce}/>
    <section className="input-study-section"><div className="input-section-heading"><span>01</span><div><h2>The everyday input family.</h2><p>Stronger lettering and calmer spacing. The translucent focus gradient remains familiar.</p></div></div>
      <div className="input-toolbar"><div className="input-options" role="group" aria-label="Preview field state">{['Rest','Hover','Focus','Disabled','Needs attention'].map(s=><button key={s} aria-pressed={state===s} onClick={()=>setState(s)}>{s}</button>)}</div><button className="input-option" onClick={()=>setValues(values.short?{short:'',search:'',large:''}:{short:'Governance Evolution Sprint',search:'material',large:'Bring our most-used controls into one coherent family.\n\nDone means they feel calm, legible, and unmistakably Caelos.'})}>Toggle sample text</button></div>
      <div className="input-comparison"><div className="input-column-heading"><span>CURRENT</span><h3>The compact baseline</h3><p>Live field treatment · 12.25px / 400</p></div><div className="input-column-heading"><span>REFINED · APPROVED</span><h3>A little room to breathe</h3><p>Approved reading rhythm · 13px / 500</p></div>{['short','search','large'].flatMap(kind=>['current','refined'].map(variant=><Field key={`${kind}-${variant}`} kind={kind} variant={variant} state={state} value={values[kind]} onChange={value=>setValues(v=>({...v,[kind]:value}))}/>))}</div>
      <p className="input-study-caption">Values stay in sync for comparison. State buttons preview a treatment; the fields also respond to real hover and focus. Light surfaces are a proposed adaptation.</p>
    </section>
    <section className="input-study-section"><div className="input-section-heading"><span>02</span><div><h2>The place where the work begins.</h2><p>The chatbar’s rounded silhouette grows from one line to eight, then scrolls within. Softer timing lets the change settle.</p></div></div><Composer mode={mode} reduced={reduced||reduce} tone={tone}/></section>
    <TooltipStudy mode={mode} reduced={reduced||reduce} notify={notify} tone={tone} setTone={setTone}/>
    <section className="input-study-section input-review"><div className="input-section-heading"><span>04</span><div><h2>Your review.</h2><p>This is an isolated study. Approved gallery decisions and the live app remain as they are.</p></div></div><label htmlFor="input-review-note">What feels right? What needs another pass?</label><textarea id="input-review-note" value={note} onChange={e=>setNote(e.target.value)} placeholder="Inputs, composer, tooltips…" rows={4}/><div className="input-toolbar"><span role="status">{saved?'Notes saved in this browser.':'Browser saving is unavailable. Download to keep your notes.'}</span><button className="input-option" onClick={download}><Download size={14}/> Download review</button></div></section>
  </div>;
}
