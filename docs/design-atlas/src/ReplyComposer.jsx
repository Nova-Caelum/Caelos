import React, {createContext, useContext, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {MessageSquare, Volume2, Captions, AudioLines, ArrowUp, Plus, Mic, KeyRound, Brain, Square, Check} from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import './reply-composer.css';

// The writing surface is the shared vertical anchor for composer popovers.
const ComposerAnchor = createContext(null);
const ComposerReducedMotion = createContext(false);
const PermissionsIcon = KeyRound;
function useComposerDock(side='top') {
  const shell=useContext(ComposerAnchor), trigger=useRef(null);
  const [gap,setGap]=useState(0);
  useLayoutEffect(()=>{
    if(!shell||!trigger.current)return;
    // Layout offsets keep nested menus anchored while their parent surface animates.
    const measure=()=>{
      const el=trigger.current;
      if(shell.contains(el)){
        let top=0, node=el;
        while(node&&node!==shell){top+=node.offsetTop;node=node.offsetParent;}
        if(node===shell){top+=shell.clientTop;setGap(side==='bottom'?shell.offsetHeight-top-el.offsetHeight:top);return;}
      }
      const control=el.getBoundingClientRect(), surface=shell.getBoundingClientRect();
      setGap(side==='bottom'?surface.bottom-control.bottom:control.top-surface.top);
    };
    measure();
    const observer=new ResizeObserver(measure);
    observer.observe(shell);observer.observe(trigger.current);
    const bridge=trigger.current.closest('.rc-docked-bridge');if(bridge)observer.observe(bridge);
    window.addEventListener('resize',measure);
    return()=>{observer.disconnect();window.removeEventListener('resize',measure);};
  },[shell,side]);
  return {trigger,gap};
}
const formats = [
  {id:'text', label:'Text', Icon:MessageSquare},
  {id:'voice', label:'Voice', Icon:Volume2},
  {id:'both', label:'Text + voice', Icon:Captions},
];
function Hint({label,children,mode,disabled=false}) {
  const [open,setOpen]=useState(false);
  return <Tooltip.Root open={!disabled&&open} onOpenChange={setOpen}><Tooltip.Trigger asChild>{children}</Tooltip.Trigger><Tooltip.Portal><Tooltip.Content className="input-tip" data-tone="sage-frost" data-mode={mode} sideOffset={10}>{label}</Tooltip.Content></Tooltip.Portal></Tooltip.Root>;
}
function ReplyFormat({value,onChange,mode}) {
  const {trigger:dockRoot,gap}=useComposerDock('bottom');
  const [open,setOpen]=useState('closed');
  const root=useRef(null), trigger=useRef(null), timer=useRef(null), options=useRef([]);
  const selected=formats.find(f=>f.id===value);
  const lastExpanded=useRef(false);
  if(open!=='closed')lastExpanded.current=open==='pinned';
  const cancel=()=>clearTimeout(timer.current);
  const close=()=>{cancel();setOpen('closed');};
  const enter=e=>{if(e.pointerType==='touch')return;cancel();setOpen(s=>s==='closed'?'hover':s);};
  const leave=()=>{cancel();timer.current=setTimeout(()=>setOpen(s=>s==='hover'?'closed':s),260);};
  const focusOption=i=>requestAnimationFrame(()=>options.current[i]?.focus());
  useEffect(()=>{const outside=e=>{if(!root.current?.contains(e.target))close();};document.addEventListener('pointerdown',outside);return()=>{document.removeEventListener('pointerdown',outside);clearTimeout(timer.current);};},[]);
  return <div className="rc-reply" ref={el=>{root.current=el;dockRoot.current=el;}} onPointerEnter={enter} onPointerLeave={leave} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))close();}} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();trigger.current?.focus();}}}>
    <button ref={trigger} className="rc-icon rc-format-trigger" aria-label={`Reply format: ${selected.label}`} aria-haspopup="menu" aria-expanded={open!=='closed'} aria-controls={open!=='closed'?'reply-format-menu':undefined} onClick={()=>{cancel();setOpen(s=>s==='pinned'?'closed':'pinned');}} onKeyDown={e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setOpen('pinned');focusOption(formats.findIndex(f=>f.id===value));}}}><selected.Icon size={18}/></button>
    <div className="rc-format-bridge rc-docked-bridge" style={{paddingTop:gap}} data-open={open!=='closed'} inert={open==='closed'?'':undefined} aria-hidden={open==='closed'} data-expanded={lastExpanded.current}><div id="reply-format-menu" className="rc-format-menu" role="menu" aria-label="Reply format" data-expanded={lastExpanded.current} onKeyDown={e=>{const index=options.current.indexOf(document.activeElement);if(['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?2:(index+(['ArrowRight','ArrowDown'].includes(e.key)?1:2))%3;focusOption(next);}}}>
      {formats.map(({id,label,Icon},i)=><Hint label={label} mode={mode} disabled={open!=='hover'} key={id}><button ref={el=>options.current[i]=el} className="rc-format-option" role="menuitemradio" aria-checked={value===id} aria-label={label} onClick={()=>{onChange(id);close();trigger.current?.focus();}}><Icon size={18}/><span className="rc-format-label">{label}</span></button></Hint>)}
    </div></div>
  </div>;
}
function Choice({label,icon:Icon,items,value,onChange,mode,showLabel=false,kind='',align='end',onOpenChange,menuOwner,side='top',hint=label,animated=false}) {
  const {trigger,gap}=useComposerDock(side);
  const reduced=useContext(ComposerReducedMotion),[open,setOpen]=useState(false);
  // Open on completed click: docked menus can overlap the trigger, so opening
  // on pointer-down lets the same release accidentally select a menu item.
  const changeOpen=value=>{setOpen(value);onOpenChange?.(value);};
  return <Dropdown.Root open={open} onOpenChange={changeOpen}><Hint label={hint} mode={mode} disabled={open}><Dropdown.Trigger asChild><button ref={trigger} onPointerDown={e=>{if(e.button===0&&!e.ctrlKey)e.preventDefault();}} onClick={()=>changeOpen(!open)} className={showLabel?`rc-model ${kind}`:'rc-icon'} aria-label={label}>{Icon&&<Icon size={17}/>} {showLabel&&value}</button></Dropdown.Trigger></Hint><Dropdown.Portal><Dropdown.Content className={`rc-small-menu${animated?' rc-emerging-menu':''}`} data-reduced={reduced} data-model-owner={menuOwner} data-mode={mode} side={side} align={align} sideOffset={gap} collisionPadding={12}><Dropdown.RadioGroup value={value} onValueChange={onChange}>{items.map(item=><Dropdown.RadioItem className="rc-small-item" key={item} value={item}>{item}<Dropdown.ItemIndicator><Check size={13}/></Dropdown.ItemIndicator></Dropdown.RadioItem>)}</Dropdown.RadioGroup></Dropdown.Content></Dropdown.Portal></Dropdown.Root>;
}
function ModelSettings({model,reasoning,setModel,setReasoning,mode}) {
  const {trigger:dockRoot,gap}=useComposerDock('bottom');
  const [open,setOpen]=useState('closed');
  const root=useRef(null), trigger=useRef(null), timer=useRef(null), childOpen=useRef(false);
  const cancel=()=>clearTimeout(timer.current);
  const close=()=>{cancel();setOpen('closed');};
  const enter=e=>{if(e.pointerType==='touch')return;cancel();setOpen(s=>s==='closed'?'hover':s);};
  const leave=()=>{cancel();timer.current=setTimeout(()=>{if(!childOpen.current)setOpen(s=>s==='hover'?'closed':s);},260);};
  const childChanged=value=>{childOpen.current=value;cancel();setOpen('pinned');};
  const focusFirst=()=>requestAnimationFrame(()=>root.current?.querySelector('.rc-model')?.focus());
  useEffect(()=>{
    const outside=e=>{if(!root.current?.contains(e.target)&&!e.target.closest?.('[data-model-owner="composer"]'))close();};
    document.addEventListener('pointerdown',outside);
    return()=>{document.removeEventListener('pointerdown',outside);clearTimeout(timer.current);};
  },[]);
  return <div className="rc-brain" ref={el=>{root.current=el;dockRoot.current=el;}} onPointerEnter={enter} onPointerLeave={leave}
    onBlur={()=>{cancel();timer.current=setTimeout(()=>{if(!childOpen.current&&!root.current?.contains(document.activeElement))close();},0);}}
    onKeyDown={e=>{if(e.key==='Escape'&&!childOpen.current){e.preventDefault();e.stopPropagation();close();trigger.current?.focus();}}}>
    <button ref={trigger} className="rc-icon" aria-label={`Model and reasoning: ${model}, ${reasoning}`} aria-expanded={open!=='closed'} aria-controls={open!=='closed'?'composer-model-settings':undefined}
      onClick={()=>{cancel();setOpen(s=>s==='pinned'?'closed':'pinned');}}
      onKeyDown={e=>{if(e.key==='ArrowDown'){e.preventDefault();setOpen('pinned');focusFirst();}}}><Brain size={18}/></button>
    <div className="rc-brain-bridge rc-docked-bridge" style={{paddingTop:gap}} data-open={open!=='closed'} inert={open==='closed'?'':undefined} aria-hidden={open==='closed'}><div id="composer-model-settings" className="rc-model-settings" role="group" aria-label="Model and reasoning">
      <Choice label={`Model: ${model}`} hint="Choose model" items={['GPT-6 Astra','GPT-5.6 Sol']} value={model} onChange={setModel} mode={mode} showLabel onOpenChange={childChanged} menuOwner="composer" side="bottom" align="start"/>
      <Choice label={`Reasoning: ${reasoning}`} hint="Choose reasoning" items={['Low','Medium','High']} value={reasoning} onChange={setReasoning} mode={mode} showLabel kind="rc-reasoning" onOpenChange={childChanged} menuOwner="composer" side="bottom"/>
    </div></div>
  </div>;
}
function AddToConversation({mode,setNotice}) {
  const {trigger,gap}=useComposerDock();
  const reduced=useContext(ComposerReducedMotion),[open,setOpen]=useState(false);
  return <Dropdown.Root open={open} onOpenChange={setOpen}><Hint label="Add to this conversation" mode={mode} disabled={open}><Dropdown.Trigger asChild><button ref={trigger} onPointerDown={e=>{if(e.button===0&&!e.ctrlKey)e.preventDefault();}} onClick={()=>setOpen(!open)} className="rc-icon" aria-label="Add to this conversation"><Plus size={19}/></button></Dropdown.Trigger></Hint><Dropdown.Portal><Dropdown.Content className="rc-small-menu rc-emerging-menu" data-reduced={reduced} data-mode={mode} side="top" align="start" sideOffset={gap} collisionPadding={12}>{['File or folder','Agent','Goal','Session instruction'].map(item=><Dropdown.Item className="rc-small-item" key={item} onSelect={()=>setNotice(`${item} · placement preview; setup is part of the next composer pass.`)}>{item}</Dropdown.Item>)}</Dropdown.Content></Dropdown.Portal></Dropdown.Root>;
}
export default function ReplyComposer({mode='dark',reduced=false}) {
  const [format,setFormat]=useState('text'),[draft,setDraft]=useState(''),[live,setLive]=useState(false),[receipt,setReceipt]=useState(''),[notice,setNotice]=useState('');
  const [permission,setPermission]=useState('Ask before actions'),[model,setModel]=useState('GPT-6 Astra'),[reasoning,setReasoning]=useState('High'),[narrow,setNarrow]=useState(false);
  const [shell,setShell]=useState(null);
  const field=useRef(null), [height,setHeight]=useState(24);
  useLayoutEffect(()=>{const el=field.current;if(!el)return;const measure=()=>{el.style.height='0px';const h=Math.min(192,Math.max(24,el.scrollHeight));el.style.height=`${h}px`;el.style.overflowY=el.scrollHeight>192?'auto':'hidden';setHeight(h);};measure();const ro=new ResizeObserver(measure);ro.observe(el.parentElement);return()=>ro.disconnect();},[draft,narrow]);
  const chosen=formats.find(f=>f.id===format);
  const send=()=>{if(!draft.trim())return;setReceipt(draft.trim());setNotice(`Preview sent · ${chosen.label} reply selected`);setDraft('');field.current?.focus();};
  return <ComposerAnchor.Provider value={shell}><ComposerReducedMotion.Provider value={reduced}><section id="composer-reply" className="input-study-section rc-study">
    <div className="input-section-heading"><span>NEW</span><div><h2>Your conversation, your way.</h2><p>One quiet surface for writing, context, and how the reply reaches you.</p></div></div>
    <div className="rc-stage" data-narrow={narrow}>
      <div className="rc-stage-heading"><span className="input-eyebrow">COMPOSER · INTERACTION STUDY</span><h3>A thought is a good place to start.</h3><p>Write it. Say it. Choose how it comes back.</p></div>
      <div className="rc-workspace">
        <div className="rc-recipient"><span className="rc-avatar">NC</span><span>Nova</span><Choice label={`Permissions: ${permission}`} icon={PermissionsIcon} animated items={['Ask before actions','Read only','Approve workspace actions']} value={permission} onChange={setPermission} mode={mode} align="start"/><span className="rc-recipient-detail">Your conversation</span></div>
        {live&&<div className="rc-live" role="status"><AudioLines size={18}/><span>Live conversation preview</span><button onClick={()=>setLive(false)}>End conversation</button></div>}
        <div ref={setShell} className="rc-shell" style={{borderRadius:height>48?22:27}}>
          <textarea ref={field} value={draft} onChange={e=>setDraft(e.target.value)} rows={1} aria-label="Try the new composer" placeholder="What’s on your mind?" onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send();}}}/>
          <div className="rc-controls"><div className="rc-left">
            <AddToConversation mode={mode} setNotice={setNotice}/>
            <Hint label="Dictate a message" mode={mode}><button className="rc-icon" aria-label="Preview dictation" onClick={()=>{setDraft('Help me shape the next chapter of Caelos.');setNotice('Sample dictation inserted · microphone is not recording.');field.current?.focus();}}><Mic size={17}/></button></Hint>
          </div><div className="rc-right">
            <ModelSettings model={model} reasoning={reasoning} setModel={setModel} setReasoning={setReasoning} mode={mode}/>
            <ReplyFormat value={format} onChange={v=>{setFormat(v);setNotice(`Reply format · ${formats.find(f=>f.id===v).label}`);}} mode={mode}/>
            
            <Hint label={draft.trim()?'Send message':'Live Conversation Mode'} mode={mode}><button className="rc-main-action" data-ready={!!draft.trim()} aria-label={draft.trim()?'Send preview message':'Live Conversation Mode'} aria-pressed={draft.trim()?undefined:live} onClick={()=>{if(draft.trim())send();else{setLive(!live);setNotice(!live?'Conversation mode preview · no microphone or audio connection.':'Conversation preview ended.');}}}>{draft.trim()?<ArrowUp size={19}/>:live?<Square size={15}/>:<AudioLines size={20}/>}</button></Hint>
          </div></div>
        </div>
        <div className="rc-under"><span>{chosen.label} replies</span><button onClick={()=>{setLive(!live);setNotice('Conversation mode preview · your draft is preserved.');}}>{live?'End conversation':'Live conversation'}<AudioLines size={12}/></button></div>
      </div>
      <div className="rc-play-controls"><button onClick={()=>{setDraft('Help me shape the next chapter of Caelos.');field.current?.focus();}}>Try a message</button><button onClick={()=>setDraft(Array.from({length:8},(_,i)=>['Keep the interface calm and comfortable to read.','Give each action room to breathe.'][i%2]).join('\n'))}>Eight lines</button><button aria-pressed={narrow} onClick={()=>setNarrow(!narrow)}>Narrow width</button><button onClick={()=>{setDraft('');setReceipt('');setLive(false);setNotice('');}}>Reset draft</button></div>
      <div className="rc-notice" role="status">{notice||'Interactive preview · messages and audio stay simulated.'}</div>
      {receipt&&<div className="rc-receipt"><span className="input-eyebrow">PREVIEW MESSAGE</span><p>{receipt}</p></div>}
    </div>
    <div className="rc-explainer"><div><span>01 · REST</span><p>Your selected format, in one icon.</p></div><div><span>02 · HOVER</span><p>Three choices open below the bar. Select directly.</p></div><div><span>03 · CLICK</span><p>Names appear. The selector stays open.</p></div></div>
  </section></ComposerReducedMotion.Provider></ComposerAnchor.Provider>;
}
