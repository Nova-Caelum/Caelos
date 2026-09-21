import React, { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, Composer, Heading, Input, Text, type ReplyFormat } from '@nova-caelum/ui';
import { ConversationHeader } from './StudyHeader';
import { getConversationWidths } from '../composer-review/ResponsiveConversationPreview';
import { conversationHeader, spacing, typography } from '../../styled-system/recipes/index.mjs';
import './study.css';
import { approvedHeaderLayout as approved, agentAvatarSizes } from '../../src/header-layout';

const typeOptions = ['body', 'small', 'label', 'mono', 'display', 'page', 'section', 'title'] as const;
type TypeRole = typeof typeOptions[number];
const tiers = ['1 agent', '2–3 agents', '4–6 agents'] as const;
const insetRoles = [['block', 'Vertical inset'], ['leading', 'Leading text inset'], ['trailing', 'Trailing avatar inset'], ['gap', 'Text–avatar gap']] as const;
type InsetRole = typeof insetRoles[number][0];

type AvatarChoice = 24 | 32 | 40 | 'xl' | 'xxl';

/** Review only: the pane, rather than the browser, owns every measurement. */
export function HeaderProportionsStudy() {
  const [restPercent, setRestPercent] = useState<number>(approved.restPercent);
  const [openPercent, setOpenPercent] = useState<number>(approved.expandedPercent);
  const [splitGap, setSplitGap] = useState<number>(approved.split.gap);
  const [splitCushion, setSplitCushion] = useState<number>(approved.split.cushion);
  const [splitMin, setSplitMin] = useState<number>(approved.split.minText);
  const [splitMax, setSplitMax] = useState<number>(approved.split.maxText);
  const [density, setDensity] = useState<'comfortable' | 'default' | 'compact'>(approved.density);
  const [titleType, setTitleType] = useState<TypeRole | 'header'>('header');
  const [secondaryType, setSecondaryType] = useState<TypeRole>('small');
  const [objectSpace, setObjectSpace] = useState<Record<InsetRole, number | null>>({...approved.spacing});
  const [curveCompensation, setCurveCompensation] = useState<number>(approved.curveCompensation);
  const scaleProbe = useRef<HTMLSpanElement>(null);
  const [spaceScale, setSpaceScale] = useState([0,3,6,9,12,15,18,24,30]);
  const [matchComposer, setMatchComposer] = useState<boolean>(approved.matchComposerHeight);
  const [rosterSize, setRosterSize] = useState<number>(agentAvatarSizes.xl);
  const [soloSize, setSoloSize] = useState<number>(agentAvatarSizes.xxl);
  const [avatarTiers, setAvatarTiers] = useState<{rest:AvatarChoice; expanded:AvatarChoice}[]>(approved.avatarTiers.map(tier => ({...tier})));
  const avatarOptions = [[24, 'Avatar sm · 24px'], [32, 'Avatar md · 32px'], [40, 'Avatar lg · 40px'], ['xl', `Agent XL · ${rosterSize}px`], ['xxl', `Agent XXL · ${soloSize}px`]] as const;
  const resolveAvatar = (choice:AvatarChoice) => choice === 'xl' ? rosterSize : choice === 'xxl' ? soloSize : choice;
  const titleProbe = useRef<HTMLSpanElement>(null);
  const subtitleProbe = useRef<HTMLSpanElement>(null);
  const insetProbe = useRef<HTMLSpanElement>(null);
  const [metrics, setMetrics] = useState({titleLine:24, subtitleLine:18, inset:21, font:{} as CSSProperties});
  useLayoutEffect(() => {
    const update = () => {
      if (!titleProbe.current || !subtitleProbe.current || !insetProbe.current) return;
      const t = getComputedStyle(titleProbe.current);
      if (scaleProbe.current) setSpaceScale([0, ...Array.from(scaleProbe.current.children, child => parseFloat(getComputedStyle(child).width))]);
      const font: Record<string,string> = {};
      for (const property of ['font-family','font-size','font-weight','line-height','letter-spacing','word-spacing','text-transform']) font[`--hp-${property}`] = t.getPropertyValue(property);
      setMetrics({titleLine:parseFloat(t.lineHeight), subtitleLine:parseFloat(getComputedStyle(subtitleProbe.current).lineHeight), inset:parseFloat(getComputedStyle(insetProbe.current).paddingTop), font:font as CSSProperties});
    };
    update();
    document.fonts.addEventListener('loadingdone', update);
    return () => document.fonts.removeEventListener('loadingdone', update);
  }, [titleType, secondaryType, density]);
  const [width, setWidth] = useState(888);
  const [paneWidth, setPaneWidth] = useState(888);
  const [height, setHeight] = useState(108);
  const [title, setTitle] = useState('Untitled conversation');
  const [material, setMaterial] = useState('composer');
  const [draft, setDraft] = useState('');
  const [model, setModel] = useState('Fixture model');
  const [reasoning, setReasoning] = useState('Medium');
  const [reply, setReply] = useState<ReplyFormat>('text');
  const [expanded, setExpanded] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [count, setCount] = useState(3);
  const [notice, setNotice] = useState('');
  const pane = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const shell = composer.current?.querySelector('.nc-composer-shell');
    if (!pane.current || !shell) return;
    const observer = new ResizeObserver(() => {
      setPaneWidth(pane.current!.clientWidth);
      setHeight(shell.getBoundingClientRect().height);
    });
    observer.observe(pane.current); observer.observe(shell);
    return () => observer.disconnect();
  }, []);
  const { chatWidth, composerWidth } = getConversationWidths(paneWidth);
  const tier = count === 1 ? 0 : count <= 3 ? 1 : 2;
  const avatars = {rest:resolveAvatar(avatarTiers[tier].rest), expanded:resolveAvatar(avatarTiers[tier].expanded)};
  const copyHeight = metrics.titleLine + 6 + metrics.subtitleLine;
  const interior = Object.fromEntries(insetRoles.map(([role]) => [role, objectSpace[role] === null ? (role === 'gap' ? spaceScale[3] : metrics.inset) : spaceScale[objectSpace[role]!]])) as Record<InsetRole,number>;
  const headerHeight = Math.max(matchComposer ? height : 0, Math.max(copyHeight, avatars.rest) + 2 * interior.block + 2);
  // Circle chord clearance at the content's top/bottom corners, blended for optical review.
  const radius = headerHeight / 2;
  const capClearance = (contentHeight:number) => (radius - Math.sqrt(Math.max(0, radius * radius - (contentHeight / 2) ** 2))) * curveCompensation / 100;
  const leadingInset = interior.leading + capClearance(copyHeight);
  const trailingInset = interior.trailing + capClearance(avatars.rest);
  const spacingKey = `${interior.block}/${leadingInset}/${trailingInset}/${interior.gap}`;
  const updateAvatar = (index:number, state:'rest'|'expanded', value:AvatarChoice) => setAvatarTiers(previous => previous.map((entry,i) => i === index ? {...entry,[state]:value} : entry));
  return <section className="header-proportions-study" id="header-proportions">
    <Heading as="h2" size="section">03A · Header & Composer proportions</Heading>
    <Text as="p" tone="muted">Resize the conversation pane. Hover to widen; click to separate the participants. Spacing, proportions, avatar sizes and motion are approved. Texture and color remain under review.</Text>
    <div className="hp-probes" aria-hidden="true">
      <span ref={titleProbe} className={titleType === 'header' ? conversationHeader().titleFrame : typography({role:titleType})}>Typography</span>
      <span ref={subtitleProbe} className={typography({role:secondaryType})}>Linked work</span>
      <span ref={scaleProbe}>{[1,2,3,4,5,6,7,8].map(n => <span key={n} style={{display:"inline-block",width:`var(--sys-space-${n})`}} />)}</span>
      <span ref={insetProbe} className={spacing({kind:'inset',density})} />
    </div>
    <div className="hp-controls" data-atlas-layout-control>
      <label>Pane width <input aria-label="Conversation pane width" type="range" min="320" max="2560" step="1" value={width} onChange={e => setWidth(Number(e.target.value))} /></label>
      <label>Material <select aria-label="Header material" value={material} onChange={e => setMaterial(e.target.value)}><option value="composer">Composer material · proposal</option><option value="glass">Current system glass · reference</option></select></label>
      <label>Participants <select aria-label="Header participant count" value={count} onChange={e => setCount(Number(e.target.value))}>{[1,2,3,4,5,6].map(n => <option key={n}>{n}</option>)}</select></label>
      <Button onClick={() => setTitle('Untitled conversation')}>Short title</Button>
      <Button onClick={() => setTitle('Plan the next Nova communications sprint, connect every agent action to the backend, and review the completed conversation interface together')}>Long title</Button>
    </div>
    <fieldset className="hp-settings" data-atlas-layout-control><legend>Proportions & spacing</legend>
      <label>Rest width · {restPercent}% <input aria-label="Header rest percent" type="range" min="40" max="100" value={restPercent} onChange={e => {const n=Number(e.target.value);setRestPercent(n);setOpenPercent(previous => Math.max(previous,n));}} /></label>
      <label>Expanded width · {openPercent}% <input aria-label="Header expanded percent" type="range" min="40" max="100" value={openPercent} onChange={e => {const n=Number(e.target.value);setOpenPercent(n);setRestPercent(previous => Math.min(previous,n));}} /></label>
      <label>Density <select aria-label="Header density" value={density} onChange={e => setDensity(e.target.value as typeof density)}><option value="comfortable">Comfortable</option><option value="default">Default</option><option value="compact">Compact</option></select></label>
      <label><input type="checkbox" checked={matchComposer} onChange={e => setMatchComposer(e.target.checked)} />Use Composer height as a minimum</label>
      <Text variant="small" tone="dim">Density inset: {metrics.inset}px. Individual overrides below remain independent. Expanded width stays at least as wide as rest.</Text>
    </fieldset>
    <fieldset className="hp-settings hp-object-settings" data-atlas-layout-control><legend>Clicked text bubble</legend>
      <div className="hp-object-grid">
        <label>Bubble–avatar gap · {splitGap}px <input aria-label="Bubble–avatar gap" type="range" min="0" max="120" step="3" value={splitGap} onChange={e => setSplitGap(Number(e.target.value))} /></label>
        <label>Text end cushion · {splitCushion}px <input aria-label="Text end cushion" type="range" min="0" max="96" step="3" value={splitCushion} onChange={e => setSplitCushion(Number(e.target.value))} /></label>
        <label>Minimum text width · {splitMin}px <input aria-label="Minimum text width" type="range" min="60" max="600" step="10" value={splitMin} onChange={e => {const n=Number(e.target.value);setSplitMin(n);setSplitMax(previous => Math.max(previous,n));}} /></label>
        <label>Maximum text width · {splitMax}px <input aria-label="Maximum text width" type="range" min="120" max="1000" step="10" value={splitMax} onChange={e => {const n=Number(e.target.value);setSplitMax(n);setSplitMin(previous => Math.min(previous,n));}} /></label>
      </div>
      <Text variant="small" tone="dim">Always fits the text within these bounds. The cushion is between the text area and the bubble’s right edge; the leading inset stays under Object spacing. Avatars follow the bubble at the selected gap. Narrow panes take priority over the minimum. Titles show up to four lines; scroll the clicked title to read more.</Text>
    </fieldset>
    <fieldset className="hp-settings hp-object-settings" data-atlas-layout-control><legend>Object spacing · approved baseline</legend>
      <Text variant="small" tone="dim">Independent interior roles use the existing spacing scale. Sliders override density; reset restores inherited insets. The gap is the minimum reserved separation between the text area and avatar cluster.</Text>
      <div className="hp-object-grid">{insetRoles.map(([role,label]) => <label key={role}>{label} · {interior[role]}px · {objectSpace[role] === null ? 'inherited' : objectSpace[role] === 0 ? 'none' : `space-${objectSpace[role]}`}
        <input aria-label={label} aria-valuetext={`${interior[role]} pixels${objectSpace[role] === null ? ', inherited' : ''}`} type="range" min="0" max="8" step="1" value={objectSpace[role] ?? spaceScale.reduce((best,value,index) => Math.abs(value-interior[role]) < Math.abs(spaceScale[best]-interior[role]) ? index : best,0)} onChange={e => setObjectSpace(previous => ({...previous,[role]:Number(e.target.value)}))} />
      </label>)}</div>
      <label>Curved-cap compensation · {curveCompensation}% <input aria-label="Curved-cap compensation" type="range" min="0" max="100" step="1" value={curveCompensation} onChange={e => setCurveCompensation(Number(e.target.value))} /></label>
      <Text variant="small" tone="dim">0% uses the insets as entered. 100% adds clearance for the pill’s curved ends. Effective leading / trailing: {leadingInset.toFixed(1)} / {trailingInset.toFixed(1)}px.</Text>
      <Button onClick={() => {setObjectSpace({block:null,leading:null,trailing:null,gap:null});setCurveCompensation(0);}}>Reset object spacing</Button>
    </fieldset>
    <fieldset className="hp-settings" data-atlas-layout-control><legend>Typography recipes</legend>
      <label>Title <select aria-label="Header title typography" value={titleType} onChange={e => setTitleType(e.target.value as typeof titleType)}><option value="header">Current header · Yrsa 21px</option>{typeOptions.map(role => <option key={role}>{role}</option>)}</select></label>
      <label>Secondary text <select aria-label="Header secondary typography" value={secondaryType} onChange={e => setSecondaryType(e.target.value as TypeRole)}>{typeOptions.map(role => <option key={role}>{role}</option>)}</select></label>
    </fieldset>
    <fieldset className="hp-settings hp-avatar-settings" data-atlas-layout-control><legend>Avatar sizes by participant tier</legend>
      <Text variant="small" tone="dim">Rest controls the whole cluster’s height, preserving its composition. Expanded controls each detached avatar after click. Hover keeps the cluster together. 24 / 32 / 40px are shared Avatar sizes. Agent XL and Agent XXL are approved size tiers; sliders let you explore variations without changing the saved baseline.</Text>
      <div className="hp-controls">
        <label>Agent XL · {rosterSize}px <input aria-label="Agent XL size" type="range" min="24" max="96" step="1" value={rosterSize} onChange={e => setRosterSize(Number(e.target.value))} /></label>
        <label>Agent XXL · {soloSize}px <input aria-label="Agent XXL size" type="range" min="24" max="96" step="1" value={soloSize} onChange={e => setSoloSize(Number(e.target.value))} /></label>
      </div>
      <div className="hp-avatar-grid">{tiers.map((label,index) => <div key={label} data-active={index === tier}>
        <strong>{label}{index === tier ? ' · viewing' : ''}</strong>
        {(['rest','expanded'] as const).map(state => <label key={state}>{state === 'rest' ? 'Rest cluster' : 'Expanded avatar'}<select aria-label={`${label} ${state} avatar size`} value={avatarTiers[index][state]} onChange={e => updateAvatar(index,state,e.target.value === 'xl' || e.target.value === 'xxl' ? e.target.value : Number(e.target.value) as AvatarChoice)}>{avatarOptions.map(([size,name]) => <option value={size} key={size}>{name}</option>)}</select></label>)}
      </div>)}</div>
    </fieldset>
    <div data-atlas-layout-control><Input label="Study conversation title" value={title} onChange={e => setTitle(e.target.value)} /></div>
    <Text as="p" variant="mono" tone="muted" role="status">Pane {Math.round(paneWidth)}px · Composer {Math.round(composerWidth)} × {Math.round(height)}px · Header {Math.round(composerWidth * (expanded ? openPercent : restPercent) / 100)}px · Base height {Math.round(headerHeight)}px · {pinned ? 'Click / pinned' : expanded ? 'Hover / focus' : 'Rest'}</Text>
    <div className="hp-pane" ref={pane} style={{ width }} data-material={material}>
      <div className="hp-header-slot" style={{ width: composerWidth, ...metrics.font, '--hp-rest': `${composerWidth * restPercent / 100}px`, '--hp-open': `${composerWidth * openPercent / 100}px`, '--hp-height': `${headerHeight}px`, '--object-inset-block': `${interior.block}px`, '--object-inset-leading': `${leadingInset}px`, '--object-inset-trailing': `${trailingInset}px`, '--object-content-gap': `${interior.gap}px`, '--hp-copy-height': `${copyHeight}px`, '--hp-title-line': `${metrics.titleLine}px` } as CSSProperties}>
        <ConversationHeader title={title} shape="capsule" className="hp-header" owner="header-proportions"
          splitGap={splitGap} splitCushion={splitCushion} splitMin={splitMin} splitMax={splitMax} restAvatarHeight={avatars.rest} expandedAvatarSize={avatars.expanded} layoutKey={`${restPercent}/${openPercent}/${density}/${titleType}/${secondaryType}/${count}/${avatars.rest}/${metrics.titleLine}/${spacingKey}`}
          participants={['Caelos','Athena','Hermes','Nova','Apollo','Iris'].slice(0,count).map(name => ({name,contextPercent:42,status:'Ready'}))}
          linkedWork={<span className={typography({role:secondaryType,tone:"muted"})}>No linked project · No work item</span>}
          chatId="Study conversation" pinned={pinned} onPinnedChange={setPinned} onExpandedChange={setExpanded} />
      </div>
      <div className="hp-spacer"><Text tone="dim">Conversation space</Text></div>
      <div className="hp-chat" style={{width:chatWidth}}><div className="hp-suggestions"><Button variant="tonal">Help me turn an idea into a plan</Button><Button variant="tonal">Review a design decision with me</Button></div></div>
      <div className="hp-composer" ref={composer} style={{width:composerWidth}}>
        <Composer value={draft} onValueChange={setDraft} onSend={() => {setDraft('');setNotice('Draft cleared locally. No message was sent.');}}
          label="Proportions study composer" model={model} models={['Fixture model','Fixture model B']} onModelChange={setModel}
          reasoning={reasoning} reasoningLevels={['Low','Medium','High']} onReasoningChange={setReasoning}
          replyFormat={reply} onReplyFormatChange={setReply} />
      </div>
    </div>
    <Text as="p" variant="small" tone="dim">The pane is capped by the available window; use the slider or drag its lower-right edge. Base height follows the content and density; Composer height is an optional minimum. Avatar settings are kept separately for each participant tier. Clicked titles show up to four lines and scroll for longer text. {notice}</Text>
  </section>;
}
