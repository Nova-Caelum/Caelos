import React, { useState, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource-variable/yrsa';
import { Button, CaelosProvider, Checkbox, Input, PersonChip, Range, Surface, TextArea, UserCard, TabsRoot, TabsList, TabsTrigger, TabsContent } from '../../dist/index.js';
import '../../dist/styles.css';
import './study.css';
import { StudioIterations } from './studio/StudioIterations';
import { ChatUILab } from './chat-ui-lab/ChatUILab';
import { ActionRow, FieldGroup, InlineCluster, Inset, ResponsiveGrid, Section, SectionStack, SpacingDensity, Stack, type Density } from './relationships';

function App() {
  const params = new URLSearchParams(location.search);
  const [tab, setTab] = useState(params.get('tab') === 'studio' ? 'studio' : params.get('tab') === 'chat-ui-lab' ? 'chat-ui-lab' : 'spacing');
  const [width, setWidth] = useState(Number(params.get('width')) || 840);
  const [density, setDensity] = useState<Density>(params.get('density') === 'compact' ? 'compact' : params.get('density') === 'comfortable' ? 'comfortable' : 'default');
  const [stress, setStress] = useState(params.get('stress') === '1');
  const [theme, setTheme] = useState<'dark' | 'light'>(params.get('theme') === 'light' ? 'light' : 'dark');
  const [glass, setGlass] = useState(true);
  const [name, setName] = useState('A new direction');
  const [saved, setSaved] = useState('');
  const [people, setPeople] = useState(['Daniel', 'Hermes']);
  const [showCrowding, setShowCrowding] = useState(false);
  const [note, setNote] = useState('');
  return <CaelosProvider theme={theme} glass={glass} className="atlas3" reducedMotion={tab === 'spacing'}>
    <Surface layer="ground" className="atlas-shell">
      <header className="atlas-header">
        <div><p className="atlas-meta">Caelos / Design Atlas 3</p><h1>{tab === "spacing" ? "Space that explains the relationship." : tab === "studio" ? "Conversation components, in focus." : "Conversation workflows, in motion."}</h1><p>{tab === "spacing" ? "Same components. Deliberate grouping. Resize the work surface and compare." : "Inspect in Studio. Exercise in Demo. Review before promotion."}</p></div>
        {tab === "spacing" && <a href="#review">Review this study</a>}
      </header>
      <TabsRoot value={tab} onValueChange={value => { setTab(value); const url = new URL(location.href); url.searchParams.set('tab', value); history.replaceState(null, '', url); }}>
      <div className="atlas3-navigation"><TabsList aria-label="Design Atlas Three"><TabsTrigger value="spacing">Approved spacing</TabsTrigger><TabsTrigger value="chat-ui-lab">Demo</TabsTrigger><TabsTrigger value="studio">Studio</TabsTrigger></TabsList></div>
      <TabsContent value="spacing" forceMount hidden={tab !== 'spacing'} style={{ paddingTop: 0 }}>
      <Surface layer="chrome" className="study-controls">
        <div className="width-control"><label htmlFor="width">Surface width <output>{width}px maximum</output></label><Range id="width" min={280} max={1000} step={1} value={width} onChange={e => setWidth(Number(e.target.value))} /></div>
        <InlineCluster>{[320, 390, 560, 840].map(w => <Button key={w} size="sm" aria-pressed={width === w} onClick={() => setWidth(w)}>{w}px</Button>)}</InlineCluster>
        <InlineCluster role="group" aria-label="Density">{(['compact', 'default', 'comfortable'] as const).map(value => <Button key={value} size="sm" variant={density === value ? 'primary' : 'text'} aria-pressed={density === value} onClick={() => setDensity(value)}>{value === 'compact' ? 'Compact' : value === 'default' ? 'Default' : 'Comfortable'}</Button>)}</InlineCluster>
        <InlineCluster><Button size="sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? 'Dark' : 'Light'}</Button><label><Checkbox checked={stress} onChange={e => setStress(e.target.checked)} />Long content</label><label><Checkbox checked={glass} onChange={e => setGlass(e.target.checked)} />Glass</label></InlineCluster>
      </Surface>
      <div className="study-workbench">
        <div className="study-caption"><span>01 / Composed work surface</span><span>{density === 'compact' ? '18 / 24 / 12' : density === 'default' ? '21 / 27 / 15' : '24 / 30 / 18'}px · fields / sections / heading → content</span></div>
        <SpacingDensity value={density}>
          <Surface layer="ground" className="specimen" style={{ width: `${width}px` } as CSSProperties} data-testid="specimen">
            <Inset><SectionStack>
              <div className="project-intro"><h2>{stress ? 'A new direction for the shared Caelos workspace and every connected project' : 'A new direction'}</h2><p>Project reference · Shared workspace</p></div>
              <Section title="Project details" description="Give this work a clear name and a useful definition of success.">
                <ResponsiveGrid>
                  <FieldGroup data-testid="primary-fields"><Input label={stress ? 'Project name as it appears in the workspace and shared review collection' : 'Project name'} value={name} onChange={e => { setName(e.target.value); setSaved(''); }} description={stress ? 'Use a specific name that teammates can distinguish from other active projects.' : undefined} /><Input label="Search" variant="search" placeholder="Find a project" /></FieldGroup>
                  <FieldGroup data-testid="secondary-fields"><TextArea label="Success criteria" placeholder="What does done look like?" rows={3} /><Input label="Unavailable" disabled placeholder="An unavailable field" /><Input label="Needs attention" invalid description={stress ? 'Give this project a unique name. Someone should be able to understand the intended outcome without opening the full brief.' : 'Give this project a name.'} /></FieldGroup>
                </ResponsiveGrid>
              </Section>
              <Section title="People" description="Keep related identities together; give the next group its own boundary.">
                <SectionStack>
                  <Section level={3} title="Person chips" data-testid="chips-section"><InlineCluster>{people.map(person => <PersonChip key={person} name={stress && person === 'Hermes' ? 'Hermes · Workspace coordination' : person} kind={person === 'Hermes' ? 'agent' : 'person'} onRemove={() => setPeople(people.filter(p => p !== person))} />)}{people.length < 2 && <Button size="sm" variant="text" onClick={() => setPeople(['Daniel', 'Hermes'])}>Restore people</Button>}</InlineCluster></Section>
                  <Section level={3} title="User cards" data-testid="cards-section"><UserCard name="Daniel" description={stress ? 'Design direction, detailed review, and shared workspace ownership across the Caelos project.' : 'Design direction and review'} /></Section>
                </SectionStack>
              </Section>
              <Section title="Ready for review" description="Actions wrap as a group. The surface owns the space around them."><ActionRow><Button variant="text" onClick={() => { setName('A new direction'); setSaved('Draft restored.'); }}>Reset draft</Button><Button variant="tonal" onClick={() => setSaved('Preview ready in this study.')}>Preview</Button><Button variant="primary" onClick={() => setSaved(name.trim() ? 'Saved locally for this session.' : 'Enter a project name first.')}>Save project</Button></ActionRow><p className="status" role="status">{saved}</p></Section>
            </SectionStack></Inset>
          </Surface>
        </SpacingDensity>
      </div>
      <div className="study-notes">
        <Section title="02 / The missing relationship" description="A grid only spaces its direct children. An unstyled wrapper can leave two complete fields touching."><Button size="sm" onClick={() => setShowCrowding(!showCrowding)} aria-expanded={showCrowding}>{showCrowding ? 'Hide crowded comparison' : 'Show crowded comparison'}</Button>{showCrowding && <div className="comparison"><div><p>Unstyled wrapper · 0px between fields</p><div><Input label="Unavailable" disabled placeholder="An unavailable field" /><Input label="Needs attention" invalid description="Give this project a name." /></div></div><div><p>FieldGroup · 24px between fields</p><SpacingDensity value="comfortable"><FieldGroup><Input label="Unavailable" disabled placeholder="An unavailable field" /><Input label="Needs attention" invalid description="Give this project a name." /></FieldGroup></SpacingDensity></div></div>}</Section>
        <Section title="03 / Approved relationships" description="Default is the approved starting density; Compact and Comfortable are explicit alternatives. Existing field interiors, fonts, colors, surfaces and interactions come from the built package."><dl className="relationship-list"><div><dt>FieldGroup</dt><dd>18 / 21 / 24px · compact / default / comfortable · between complete fields</dd></div><div><dt>SectionStack</dt><dd>24 / 27 / 30px · compact / default / comfortable · between groups</dd></div><div><dt>Section</dt><dd>12 / 15 / 18px · compact / default / comfortable · intro to content; 6px title to description</dd></div><div><dt>InlineCluster / ActionRow</dt><dd>9px · wraps by available width</dd></div><div><dt>ResponsiveGrid / Inset</dt><dd>24px grid gap; 18 / 21 / 24px inset · compact / default / comfortable</dd></div></dl></Section>
        <Section id="review" title="Review notes" description="These relationships now come from the shared library. Select and copy further feedback back to the task. Notes are cleared on reload."><Stack><TextArea label="What should we keep or tighten?" value={note} onChange={e => setNote(e.target.value)} placeholder="Compare compact, default and comfortable, heading separation, long labels and narrow surfaces…" /></Stack></Section>
      </div>
      </TabsContent>
      <TabsContent value="studio" style={{ paddingTop: 0 }}><StudioIterations /></TabsContent>
      <TabsContent value="chat-ui-lab" style={{ paddingTop: 0 }}><ChatUILab /></TabsContent>
      </TabsRoot>
    </Surface>
  </CaelosProvider>;
}
createRoot(document.getElementById('root')!).render(<App />);
