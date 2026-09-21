// Pure, local fixtures. Times are virtual milliseconds, never backend timestamps.
export type Lifecycle = 'waiting' | 'in-progress' | 'complete' | 'interrupted' | 'failed';
export type Kind = 'response' | 'thinking' | 'tool' | 'artifact' | 'attachment' | 'delegation' | 'approval' | 'question';
export type Stage = { at: number; state: Lifecycle; text: string; progress?: number; expanded?: boolean };
export type LabSource = { title: string; url: string; description: string };
export type LabItem = { id: string; kind: Kind; title: string; agent?: string; sources?: LabSource[]; preview?: boolean; stages: Stage[] };
export type Decision = { value: string };
export type Gate = { at: number; kind: 'approval' | 'question'; prompt: string; options?: string[] };
export type Scenario = { id: string; name: string; prompt: string; duration: number; sequence: string[]; items: LabItem[]; document?: string[]; gate?: Gate; unreadAfter?: number };
export const stateLabels: Record<Lifecycle, string> = { waiting: 'Waiting', 'in-progress': 'In progress', complete: 'Complete', interrupted: 'Interrupted', failed: 'Failed' };
const stage = (at: number, state: Lifecycle, text: string, extra: Partial<Stage> = {}): Stage => ({ at, state, text, ...extra });
const response = (stages: Stage[], agent = 'Hermes'): LabItem => ({ id: `response-${agent}`, kind: 'response', title: 'Response', agent, stages });
const document = [
  'Purpose: create a calm, useful place to review the next workspace release.',
  'Scope: confirm the message flow, document reading experience and handoff between collaborators.',
  'Review: start with the default layout. Compare a narrow pane, a long response and an expanded document.',
  'Acceptance: all actions are reachable by keyboard; the conversation stays readable while work is in progress.',
  'Next steps: collect observations here before choosing a component to redesign.',
];
const attachment = (failure: boolean): Scenario => ({
  id: failure ? 'upload-retry' : 'upload-success', name: failure ? 'Attachment · failure → retry' : 'Attachment · success',
  prompt: 'Attach the workspace brief and summarize it.', duration: failure ? 6500 : 4200,
  sequence: failure ? ['Attachment queued', 'Upload in progress', 'Simulated failure', 'Retry upload', 'Upload complete', 'Response'] : ['Attachment queued', 'Upload in progress', 'Upload complete', 'Response'],
  items: [{ id: 'upload', kind: 'attachment', title: 'workspace-brief.pdf · 2.4 MB', stages: [
    stage(0, 'waiting', 'Queued for simulated upload.', { progress: 0 }),
    stage(700, 'in-progress', 'Uploading fixture metadata only.', { progress: 45 }),
    ...(failure ? [stage(1900, 'failed', 'Simulated connection failure. The file is still available for retry.'), stage(3400, 'in-progress', 'Retrying fixture upload.', { progress: 70 })] : []),
    stage(failure ? 4800 : 2600, 'complete', 'Attachment ready. No file was transferred.', { progress: 100 }),
  ] }, response([stage(failure ? 5100 : 2900, 'in-progress', 'The brief describes a shared workspace review…'), stage(failure ? 6300 : 4000, 'complete', 'The brief covers scope, review steps and acceptance criteria for the workspace release.')])],
});
export const scenarios: Scenario[] = [
  { id: 'citations', name: 'Citations → inspect sources', prompt: 'Explain the review approach and include its sources.', duration: 4200,
    sequence: ['Response starts', 'Inline references arrive', 'Inspect a source with pointer or keyboard', 'Complete'], items: [
      { id: 'cited-response', kind: 'response', title: 'Review approach', sources: [
        { title: 'Workspace review brief', url: 'https://example.com/review-brief', description: 'Fixture source: scope, review steps and acceptance criteria for the release.' },
        { title: 'Accessibility checklist', url: 'https://example.com/accessibility', description: 'Fixture source: keyboard navigation, visible focus and reading order.' },
      ], stages: [stage(0, 'waiting', 'Preparing the response.'), stage(700, 'in-progress', 'Review conversation flow, tool activity and document reading. [1] Check keyboard navigation and visible focus. [2]'), stage(4000, 'complete', 'Review conversation flow, tool activity and document reading. [1] Check keyboard navigation and visible focus. [2]')] },
    ] },
  { id: 'web-preview', name: 'Web preview → navigation & expanded view', prompt: 'Create a small workspace review page and show me a preview.', duration: 5000,
    sequence: ['Preparing preview', 'Building local page', 'Preview ready', 'Explore two fixture pages, console and expanded view'], items: [
      { id: 'web-page', kind: 'artifact', title: 'Workspace review website', preview: true, stages: [stage(0, 'waiting', 'Preview queued.'), stage(700, 'in-progress', 'Building the local page fixture…'), stage(3000, 'complete', 'Website preview ready. Two local pages are available in Candidate.')] },
    ], document: ['Workspace review', 'Overview: review the conversation flow, tool activity and document reader.', 'Checklist: keyboard focus, narrow layouts and interruption recovery.'] },
  { id: 'questionnaire', name: 'Questionnaire → multiple questions', prompt: 'Ask me about review priorities and any extra context.', duration: 4000,
    gate: { at: 1000, kind: 'question', prompt: 'Which area should we prioritize?', options: ['Conversation flow', 'Tool activity', 'Document reading'] },
    sequence: ['Pause for review priorities', 'Choose or write a priority', 'Optional context in Candidate', 'Submit answers and continue'], items: [
      { id: 'questionnaire', kind: 'question', title: 'Review preferences', stages: [stage(1000, 'waiting', 'Tell us what matters for this review.'), stage(1100, 'complete', 'Answers recorded.')] },
      response([stage(3500, 'complete', 'The review plan follows your recorded preferences.')]),
    ] },
  { id: 'approval', name: 'Tool permission → allow or deny', prompt: 'Look up the weather for the workspace visit.', duration: 4000,
    gate: { at: 1000, kind: 'approval', prompt: 'Allow get_weather to look up weather for New York? This sends the city name to the simulated weather tool.' },
    sequence: ['Prepare tool call', 'Pause for permission at 1.0s', 'Allow → tool runs; Deny → tool skipped', 'Response follows the decision'], items: [
      { id: 'permission', kind: 'approval', title: 'Tool permission', stages: [stage(1000, 'waiting', 'Permission required before this tool can run.'), stage(1100, 'complete', 'Allowed · recorded decision.')] },
      { id: 'weather', kind: 'tool', title: 'get_weather · New York', stages: [stage(1100, 'in-progress', 'Looking up fixture weather…'), stage(2400, 'complete', 'Fixture result: 21°C, partly cloudy.')] },
      response([stage(0, 'in-progress', 'I’ll check the weather after you review the tool request.'), stage(1000, 'waiting', 'Waiting for your permission.'), stage(1100, 'in-progress', 'Continuing with your permission decision.'), stage(3200, 'complete', 'The simulated forecast is 21°C and partly cloudy.')]),
    ] },
  { id: 'question', name: 'User question → choice or text answer', prompt: 'Prepare a review plan, asking me which area to prioritize.', duration: 4000,
    gate: { at: 1000, kind: 'question', prompt: 'Which part of the workspace should we review first?', options: ['Conversation flow', 'Tool activity', 'Document reading'] },
    sequence: ['Agent asks a question', 'Pause for an answer at 1.0s', 'Choose an option, write an answer, or skip', 'Continue with the recorded answer'], items: [
      { id: 'question', kind: 'question', title: 'Question for you', stages: [stage(1000, 'waiting', 'Choose an option or write your own answer.'), stage(1100, 'complete', 'Answer: Conversation flow')] },
      response([stage(0, 'in-progress', 'I have one question before preparing the plan.'), stage(1000, 'waiting', 'Waiting for your answer.'), stage(1100, 'in-progress', 'Preparing the plan with your recorded answer.'), stage(3500, 'complete', 'We’ll start with Conversation flow, then review the remaining areas.')]),
    ] },
  { id: 'unread', name: 'Unread messages → return to latest', prompt: 'Keep the review updates coming while I read earlier messages.', duration: 5000, unreadAfter: 0,
    sequence: ['Reading earlier messages', 'One unread message at 1.6s', 'Two unread messages at 3.0s', 'Three unread messages at 4.4s', 'Jump to latest or scroll to the bottom to mark read'], items: [
      { id: 'history', kind: 'response', title: 'Earlier conversation', agent: 'Hermes', stages: [stage(0, 'complete', Array.from({ length: 10 }, (_, i) => `Earlier note ${i + 1}: review the workspace conversation and its supporting documents. New updates will arrive below while you read this context.`).join('\n\n'))] },
      { id: 'unread-a', kind: 'response', title: 'Review update', agent: 'Athena', stages: [stage(1600, 'complete', 'The conversation review is complete. I found two follow-up items.')] },
      { id: 'unread-b', kind: 'response', title: 'Document update', agent: 'Da Vinci', stages: [stage(3000, 'complete', 'The document checklist is ready for your review.')] },
      { id: 'unread-c', kind: 'response', title: 'Coordinator update', agent: 'Hermes', stages: [stage(4400, 'complete', 'Both reviews are ready. Return to the latest messages when you finish reading.')] },
    ] },
  { id: 'text', name: 'Text response → complete', prompt: 'Give me a short plan for today’s workspace review.', duration: 4200,
    sequence: ['Waiting', 'Response starts', 'Response grows', 'Complete'], items: [response([
      stage(0, 'waiting', 'Waiting for the simulated response.'), stage(700, 'in-progress', 'Start with the conversation flow.'),
      stage(2100, 'in-progress', 'Start with the conversation flow. Then review tools and documents in context.'),
      stage(4000, 'complete', 'Start with the conversation flow. Then review tools and documents in context. Record observations before changing any components.'),
    ])] },
  { id: 'tools', name: 'Thinking → tool → result → response', prompt: 'Find the workspace review notes and summarize the next steps.', duration: 7200,
    sequence: ['Waiting', 'Thinking', 'Tool call: search_notes', 'Search result', 'Response', 'Complete'], items: [
      { id: 'thinking', kind: 'thinking', title: 'Thinking', agent: 'Hermes', stages: [stage(0, 'waiting', 'Preparing the search.'), stage(600, 'in-progress', 'I’ll locate the review notes, then summarize the action items.'), stage(2200, 'complete', 'Search plan ready.')] },
      { id: 'search', kind: 'tool', title: 'search_notes', stages: [stage(2200, 'in-progress', 'Query: workspace review · limit: 3'), stage(4200, 'complete', '3 notes found: Conversation flow, Document reading, Team handoffs.')] },
      response([stage(4800, 'in-progress', 'The next review should cover three areas…'), stage(6900, 'complete', 'Review conversation flow, read an expanded document, and check the handoff between Hermes and the review agent.')]),
    ] },
  { id: 'artifact', name: 'Artifact → preview → expanded document', prompt: 'Create a workspace review brief.', duration: 6000, document,
    sequence: ['Artifact queued', 'Creating document', 'Inline preview', 'Expanded document', 'Complete'], items: [
      { id: 'brief', kind: 'artifact', title: 'Workspace review brief', stages: [stage(0, 'waiting', 'Document queued.'), stage(700, 'in-progress', 'Drafting the review brief…'), stage(2800, 'complete', document[0]), stage(4100, 'complete', document[0], { expanded: true })] },
      response([stage(5400, 'complete', 'The brief is ready. Open the expanded reader to review its full contents.')]),
    ] }, attachment(false), attachment(true),
  { id: 'delegation', name: 'Delegation → sub-agent → result', prompt: 'Ask the review agent to check the workspace brief.', duration: 6800,
    sequence: ['Delegation queued', 'Sub-agent working', 'Sub-agent result', 'Coordinator response'], items: [
      { id: 'delegation', kind: 'delegation', title: 'Review the brief', agent: 'Athena · Review agent', stages: [stage(0, 'waiting', 'Hermes delegated the brief review.'), stage(1100, 'in-progress', 'Checking scope and acceptance criteria.'), stage(4300, 'complete', 'The brief includes the scope and a usable review checklist.')] },
      response([stage(5200, 'in-progress', 'Athena completed the review.'), stage(6500, 'complete', 'Athena completed the review. The brief is ready for a walkthrough with the team.')]),
    ] },
  { id: 'interrupted', name: 'Interrupted response → recovery', prompt: 'Walk me through the review, then recover from an interruption.', duration: 6600,
    sequence: ['Waiting', 'Response starts', 'Interrupted', 'Recovery', 'Complete'], items: [response([
      stage(0, 'waiting', 'Waiting for the simulated response.'), stage(600, 'in-progress', 'First, check the conversation at a narrow width…'),
      stage(2300, 'interrupted', 'First, check the conversation at a narrow width…'), stage(3900, 'in-progress', 'Resuming. Next, open the document and test keyboard focus.'),
      stage(6300, 'complete', 'First, check the conversation at a narrow width. Next, open the document and test keyboard focus. The response recovered successfully.'),
    ])] },
  { id: 'empty', name: 'Empty conversation', prompt: 'Show the empty-conversation fixture.', duration: 0, sequence: ['Empty conversation; no messages or response'], items: [] },
  { id: 'stress', name: 'Stress · speakers, long content & overlapping tools', prompt: 'Prepare a comprehensive release review with parallel research and a large document.', duration: 8500,
    sequence: ['Long response', 'Two overlapping tools', 'Multiple speakers', 'Large artifact preview', 'Expanded document', 'Complete'],
    document: Array.from({ length: 40 }, (_, i) => `Section ${i + 1}. ${document[i % document.length]} Keep context visible across a long document and verify that scrolling, focus and return navigation remain predictable.`),
    items: [
      response([stage(0, 'in-progress', Array.from({ length: 8 }, (_, i) => `Review area ${i + 1}: check messages, tool activity and document reading without losing the conversation context.`).join('\n\n')), stage(7800, 'complete', 'The comprehensive review is ready. All simulated tasks have finished.')], 'Hermes · Workspace coordination and cross-project release planning'),
      { id: 'search-a', kind: 'tool', title: 'search_workspace_review_notes_and_historical_decisions', stages: [stage(800, 'in-progress', 'Searching 120 fixture notes…'), stage(4100, 'complete', '12 relevant notes found.')] },
      { id: 'search-b', kind: 'tool', title: 'inspect_artifact_accessibility_and_content_structure', stages: [stage(1300, 'in-progress', 'Inspecting the fixture document while search continues…'), stage(4800, 'complete', '40 sections checked.')] },
      { id: 'athena', kind: 'delegation', title: 'Independent review', agent: 'Athena · Accessibility and international workspace review', stages: [stage(1800, 'in-progress', 'Reviewing long labels and keyboard access.'), stage(5400, 'complete', 'Review recorded. Keep the full agent identity accessible.')] },
      response([stage(5500, 'complete', 'I’ve included the findings in the release brief. The full document is available below.')], 'Da Vinci · Document editor'),
      { id: 'large-document', kind: 'artifact', title: 'Comprehensive workspace release review with detailed findings and follow-up actions', stages: [stage(2000, 'in-progress', 'Assembling 40 sections…'), stage(5800, 'complete', '40 sections · simulated document'), stage(6900, 'complete', '40 sections · simulated document', { expanded: true })] },
    ] },
];
// The recorded branch is projected at a fixed virtual time, including on replay.
export function resolveScenario(scenario: Scenario, decision?: Decision): Scenario {
  if (!decision || !scenario.gate) return scenario;
  const denied = decision.value === 'deny';
  return { ...scenario, items: scenario.items.map(item => {
    if (item.kind === 'approval' || item.kind === 'question') return { ...item, stages: item.stages.map(s => s.state === 'complete' ? { ...s, text: item.kind === 'approval' ? `${denied ? 'Denied · tool skipped' : 'Allowed · tool permitted'} (simulation).` : `Answer: ${decision.value}` } : s) };
    if (scenario.gate?.kind === 'approval' && denied && item.kind === 'tool') return { ...item, stages: [stage(1100, 'complete', 'Skipped. Permission was denied; no tool was run.')] };
    if (item.kind === 'response') return { ...item, stages: item.stages.map(s => s.state !== 'complete' ? s : { ...s, text: scenario.gate?.kind === 'approval' ? denied ? 'The weather lookup was denied. I can continue without the forecast.' : s.text : decision.value === 'Skipped' ? 'Question skipped. I’ll use the default review order for this fixture.' : `We’ll prioritize “${decision.value}”, then review the remaining areas. This is a fixture response.` }) };
    return item;
  }) };
}
export function stageAt(item: LabItem, time: number): Stage | undefined {
  return item.stages.filter(s => s.at <= time).at(-1);
}
export function snapshots(item: LabItem) {
  const order: Lifecycle[] = ['waiting', 'in-progress', 'complete', 'interrupted', 'failed'];
  return order.flatMap(state => {
    const sample = item.stages.filter(s => s.state === state).at(-1);
    return sample ? [sample] : [];
  });
}
export function nextRecovery(item: LabItem, time: number) {
  return item.stages.find(s => s.at > time && (s.state === 'in-progress' || s.state === 'complete'))?.at;
}
