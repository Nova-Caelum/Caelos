import React, { useState } from "react";
import { toast } from "sonner";
import { Badge, Button, Card, Checkbox, Heading, Input, LinkButton, Loading, Popover, PopoverTrigger, PopoverContent, PopoverClose, Progress, Range, ResizeHandle, Separator, Surface, Text } from "../dist/index.js";

/** Shared-package example only: no network, application records, or persistence. */
export function Foundations() {
  const [amount, setAmount] = useState(35);
  const [checked, setChecked] = useState(false);
  const [width, setWidth] = useState(200);
  return <section data-foundations aria-label="Shared foundations">
    <Heading>Shared foundations</Heading>
    <Text as="p" tone="muted">Typography, anchored forms, native controls, progress, and resizable surfaces.</Text>
    <Card>
      <Heading as="h3" size="title">A consistent starting point</Heading>
      <Text as="p">Body text stays readable as the container narrows.</Text>
      <Text as="p" variant="mono">packages/ui · shared source</Text>
      <Separator style={{ margin: "16px 0" }} />
      <div className="line">
        <Popover><PopoverTrigger asChild><Button>Open sample panel</Button></PopoverTrigger>
          <PopoverContent aria-label="Sample panel">
            <Heading as="h3" size="title">An anchored form</Heading>
            <Input label="Sample note" placeholder="A local draft" />
            <PopoverClose asChild><Button>Close sample panel</Button></PopoverClose>
          </PopoverContent>
        </Popover>
        <LinkButton href="#composer">Go to composer</LinkButton>
        <Button onClick={() => toast("Sample notification", { id: "foundation-demo" })}>Show sample notification</Button>
        <Badge variant="dot" tone="ready" aria-label="Ready" />
      </div>
      <label style={{ display: "block", margin: "16px 0" }}><Text>Completion {amount}%</Text><Range aria-label="Completion" min={0} max={100} step={5} value={amount} onChange={e => setAmount(Number(e.target.value))} /></label>
      <label className="line"><Checkbox checked={checked} onChange={e => setChecked(e.target.checked)} /><Text>Include completed items</Text></label>
      <Progress label="Sample completion" value={amount} style={{ margin: "16px 0" }} />
      <Loading>Waiting for an application action…</Loading>
    </Card>
    <div style={{ display: "flex", width: "100%", marginTop: 16, minWidth: 0 }}>
      <Surface texture="graph" style={{ width, maxWidth: "80%", padding: 16 }}><Text>Graph surface</Text></Surface>
      <ResizeHandle label="Sample pane width" value={width} min={120} max={320} onValueChange={setWidth} style={{ width: 8, flexShrink: 0 }} />
      <Surface layer="chrome" style={{ flex: 1, padding: 16 }}><Text>Chrome surface</Text></Surface>
    </div>
  </section>;
}
