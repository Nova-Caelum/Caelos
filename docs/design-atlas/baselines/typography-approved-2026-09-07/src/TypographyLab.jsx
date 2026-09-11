import React, {useState, useEffect} from 'react';
import {Type, Download, RotateCcw} from 'lucide-react';
import './typography.css';

const OPTIONS = {
  current: {label:'Approved atlas', description:'The current component typography, as a reference.'},
  balanced: {label:'Refined hierarchy', description:'Same 13px working text. Clearer labels, readable IDs, and more deliberate weight.'},
  roomy: {label:'Reading comfort', description:'14px working text and a little more leading for longer sessions.'},
};

const APPROVED = Object.freeze({weight:500, tracking:.019, words:.055});

const READING = {
  approved: {...APPROVED, label:'Approved · Caelos', description:'Locked September 7: medium weight, .019em letter spacing, and .055em extra word spacing. Pair with Refined hierarchy and natural-case tabs.'},
  original: {label:'Original lettering', weight:400, tracking:0, words:0, description:'No reading adjustments. Compare against the selected hierarchy below.'},
  subtle: {label:'A · A little softer', weight:450, tracking:.008, words:.025, description:'A small increase in stroke weight with very light spacing.'},
  comfortable: {label:'B · Clear & comfortable', weight:500, tracking:.015, words:.05, description:'Medium-weight working text, slightly more air between letters and words. My starting recommendation.'},
  open: {label:'C · More breathing room', weight:500, tracking:.025, words:.09, description:'The same medium weight as B, with more open lettering and word spacing.'},
};

// Operational: a review workspace. All adjustments are scoped to its specimen.
// Structural: task IDs retain Plex Mono. Existing material recipes remain intact.
export default function TypographyLab({SidebarDemo,TaskDemo,FilterDemo,ButtonDemo,MotionDemo,notify,reduced}) {
  const [preset,setPreset]=useState('balanced');
  const [sentence,setSentence]=useState(true);
  const [reading,setReading]=useState('approved');
  const [tuning,setTuning]=useState(READING.approved);
  function chooseReading(id){setReading(id);setTuning(READING[id]);}
  function tune(key,value){setReading('custom');setTuning(old=>({...old,[key]:Number(value)}));}
  const readingOn=reading!=='original';
  const isApproved=readingOn&&preset==='balanced'&&sentence&&tuning.weight===APPROVED.weight&&tuning.tracking===APPROVED.tracking&&tuning.words===APPROVED.words;
  const readingLabel=READING[reading]?.label||'Custom lettering';
  const [note,setNote]=useState(()=>{try{return localStorage.getItem('caelos-atlas-typography-note-v1')||''}catch{return ''}});
  const [saved,setSaved]=useState(true);
  useEffect(()=>{try{localStorage.setItem('caelos-atlas-typography-note-v1',note);setSaved(true)}catch{setSaved(false)}},[note]);
  const text=`# Caelos typography review\n\nDirection: ${OPTIONS[preset].label}\nLettering: ${readingLabel}\nReading adjustments: ${readingOn?'enabled':'off'}\nWorking-text weight: ${tuning.weight}\nAdded letter spacing: ${tuning.tracking}em\nAdded word spacing: ${tuning.words}em\nTab labels: ${sentence?'Natural case':'Uppercase'}\n\nNotes: ${note||'Not yet reviewed'}\n\n${isApproved?'Approved typography baseline — locked by Daniel on 2026-09-07.':'Comparison variation — not the approved typography baseline.'}\nPrimary button typography is unchanged.\n`;
  function download(){const url=URL.createObjectURL(new Blob([text],{type:'text/markdown'}));const a=document.createElement('a');a.href=url;a.download='Caelos-typography-review.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Typography review download requested.');}
  return <div className="typography-lab">
    <header className="intro"><div className="eyebrow">TYPOGRAPHY · APPROVED BASELINE</div><h1>A little easier on the eyes.</h1><p>Your chosen Plex Sans treatment is locked. The lab opens with your approved settings; alternatives remain available for comparison.</p></header>
    <div className="type-controls">
      <h2 className="type-control-heading">1 · Compare the lettering</h2>
      <div role="group" aria-label="Reading treatment" className="type-presets type-reading-presets">{Object.entries(READING).map(([id,item])=><button key={id} aria-pressed={reading===id} onClick={()=>chooseReading(id)}>{item.label}</button>)}</div>
      <p aria-live="polite">{READING[reading]?.description||'Your custom combination. The preview updates as you adjust each control.'}</p>
      <div className="type-reading-proof" style={{'--proof-size':preset==='roomy'?'14px':'13px'}}>
        <div><span>Regular · same size</span><p>Bring the platform into focus. Keep important decisions easy to find.</p></div>
        <div><span>{readingLabel}</span><p style={{fontWeight:readingOn?tuning.weight:400,letterSpacing:readingOn?`${tuning.tracking}em`:'normal',wordSpacing:readingOn?`${tuning.words}em`:'normal'}}>Bring the platform into focus. Keep important decisions easy to find.</p></div>
      </div>
      <div className="type-tuners">
        <label htmlFor="type-weight">Stroke weight <output>{tuning.weight}</output><select id="type-weight" value={tuning.weight} onChange={e=>tune('weight',e.target.value)}><option value="400">400 · Regular</option><option value="450">450 · Between regular and medium</option><option value="500">500 · Medium</option><option value="550">550 · A little stronger</option></select></label>
        <label htmlFor="type-tracking">Letter spacing <output>{tuning.tracking.toFixed(3)} em</output><input id="type-tracking" type="range" min="0" max="0.04" step="0.001" value={tuning.tracking} onChange={e=>tune('tracking',e.target.value)}/></label>
        <label htmlFor="type-words">Extra word spacing <output>{tuning.words.toFixed(3)} em</output><input id="type-words" type="range" min="0" max="0.14" step="0.005" value={tuning.words} onChange={e=>tune('words',e.target.value)}/></label>
      </div>
      <p className="type-tuning-note">Weight applies to working copy and supporting text; navigation and controls stay at least medium. Headings, task IDs, and the approved primary keep their original weight. Spacing adjusts ordinary interface text. Original lettering switches all reading adjustments off.</p>
      <h2 className="type-control-heading type-divider">2 · Compare size and hierarchy</h2>
      <div role="group" aria-label="Typography direction" className="type-presets">{Object.entries(OPTIONS).map(([id,item])=><button key={id} aria-pressed={preset===id} onClick={()=>setPreset(id)}>{item.label}{id==='balanced'&&<small>Recommended</small>}</button>)}</div>
      <p aria-live="polite">{OPTIONS[preset].description}</p>
      <div className="type-secondary"><label><input type="checkbox" checked={sentence} onChange={e=>setSentence(e.target.checked)}/>Natural case on project tabs</label><button className="text-button compact" onClick={()=>{setPreset('balanced');setSentence(true);chooseReading('approved')}}><RotateCcw size={12}/>Restore approved settings</button></div>
    </div>
    <div className="type-grounding"><Type size={17}/><p><strong>IBM Plex Sans</strong> for working copy and state labels. <strong>IBM Plex Mono</strong> for coordinates. Yrsa stays with the Nova Caelum signature.</p></div>
    <div className="type-preview" data-type-preset={preset} data-natural-case={sentence} data-reading-tuned={readingOn} style={{'--reading-weight':tuning.weight,'--reading-control-weight':Math.max(500,tuning.weight),'--reading-tracking':`${tuning.tracking}em`,'--reading-words':`${tuning.words}em`}}>
      <div className="type-reading-summary"><strong>{isApproved?'Approved · Caelos':readingLabel}</strong><span>{OPTIONS[preset].label} · {readingOn?`${tuning.weight} weight · +${tuning.tracking}em letters · +${tuning.words}em words`:'Reading adjustments off'}</span></div>
      <div className="type-context"><span className="type-signpost">PROJECT WORKSPACE</span><h2>Core platform</h2><p>A shared foundation for people and agents. Keep the important decisions easy to find, and give supporting details room to recede.</p></div>
      <div className="type-work-grid"><div><h3 className="type-caption">Navigation · orient and move</h3><SidebarDemo notify={notify}/></div><div><h3 className="type-caption">Working copy · act and decide</h3><TaskDemo notify={notify}/><div className="type-long-copy"><h4>Bring the platform into focus</h4><p>Refine the shared component vocabulary across task management, agent conversations, and the knowledge workspace. Each surface should make the next useful action clear.</p><span>Updated by Daniel · 12 minutes ago</span></div></div></div>
      <div className="type-pair"><div><h3 className="type-caption">Filters · distinguish without shouting</h3><FilterDemo/></div><div><h3 className="type-caption">Actions · the primary remains our anchor</h3><ButtonDemo notify={notify}/></div></div>
      <div className="type-tabs"><h3 className="type-caption">Project tabs · familiar shape, considered lettering</h3><MotionDemo reduced={reduced} notify={notify}/></div>
    </div>
    <details className="type-spec"><summary>Inspect the base text roles (before reading adjustments)</summary><div className="type-table-wrap"><table><thead><tr><th>Role / purpose</th><th>Refined hierarchy</th><th>Reading comfort</th></tr></thead><tbody>
      <tr><td>Project title · orientation</td><td>Plex Sans · 28 / 33.6 · 600</td><td>Same</td></tr>
      <tr><td>Working text · decisions</td><td>Plex Sans · 13 / 19.5 · 400</td><td>14 / 21 · 400</td></tr>
      <tr><td>Navigation · location</td><td>Plex Sans · 13 / 18.2 · 500</td><td>14 / 19.6 · 500</td></tr>
      <tr><td>Status / filter · condition</td><td>Plex Sans · 11–12 / 1.35 · 500</td><td>12–13 / 1.35 · 500</td></tr>
      <tr><td>ID · reference</td><td>Plex Mono · 10 / 13.5 · 400</td><td>Same</td></tr>
      <tr><td>Section label · signpost</td><td>Plex Sans · 10 / 14 · 600 · .09em</td><td>Same</td></tr>
      <tr><td>Metadata · supporting context</td><td>Plex Sans · 11 / 15.4 · 400</td><td>12 / 16.8 · 400</td></tr>
      <tr><td>Primary action · approved anchor</td><td>Existing source, unchanged</td><td>Same</td></tr>
    </tbody></table></div><p>Sizes and line heights are in pixels unless a ratio is shown. This table shows the underlying hierarchy. The approved reading treatment raises ordinary working and supporting text to 500 weight and adds .019em letter spacing and .055em word spacing; project tabs use natural case.</p></details>
    <div className="type-review"><label htmlFor="type-note">Your typography notes</label><textarea id="type-note" value={note} onChange={e=>setNote(e.target.value)} placeholder="Which direction feels right? Anything too small, too heavy, or too spaced out?"/><div><span>{saved?(isApproved?'Notes saved. Showing the approved typography baseline.':'Notes saved. This variation is not the approved baseline.'):'Storage unavailable. Export to keep your notes.'}</span><button className="tonal-button" onClick={download}><Download size={14}/>Export typography review</button></div></div>
  </div>;
}
