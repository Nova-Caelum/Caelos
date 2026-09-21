// Iter 4 · four open studies. Numbers match Iter 2/3 (04, 05, 06, 07).
// Atlas-local proposals. Nothing here is approved or promoted.
export type Tone = 'gold' | 'blue' | 'indigo' | 'cream' | 'none';
export type Option4 = { key: string; label: string; note: string; tone?: Tone; glow?: boolean; edge?: 'tone' | 'system' };
export type Study4 = {
  id: 'preview' | 'workspace' | 'permission' | 'questions';
  number: number;
  title: string;
  brief: string;
  decision: string;
  status: 'new' | 'carried';
  motion: boolean;
  states: readonly string[];
  start: string;
  options: readonly Option4[];
};

export const studies4: readonly Study4[] = [
  {
    id: 'preview', number: 4, title: 'One preview family', status: 'carried', motion: true,
    brief: 'Carried forward from Iter 3 unchanged so the four open studies sit together. The rework lands in the next pass.',
    decision: 'Not yet reworked. Shown for reference only.',
    states: ['Artifact', 'Agent session', 'Web page'], start: 'Artifact',
    options: [
      { key: 'a', label: 'Divided glass preview', note: 'Iter 3 specimen, unchanged.' },
      { key: 'b', label: 'Inset excerpt', note: 'Iter 3 specimen, unchanged.' },
    ],
  },
  {
    id: 'workspace', number: 5, title: 'Expanded workspace', status: 'carried', motion: false,
    brief: 'Carried forward from Iter 3 unchanged so the four open studies sit together. The rework lands in the next pass.',
    decision: 'Not yet reworked. Shown for reference only.',
    states: ['Document', 'Agent session'], start: 'Document',
    options: [
      { key: 'a', label: 'Thin reading border', note: 'Iter 3 specimen, unchanged.' },
      { key: 'b', label: 'Glass inset frame', note: 'Iter 3 specimen, unchanged.' },
    ],
  },
  {
    id: 'permission', number: 6, title: 'Permission alert', status: 'new', motion: false,
    brief: 'A temporary alert, not an info card. Tonal-button material at card scale: a diagonal wash and a soft symmetric glow from one existing token set, inside the system’s neutral edge. Leading key icon, body aligned to the title, actions on the same axis. Clarify still focuses the composer.',
    decision: 'LOCKED by the user, September 20: option A. Gold fill and token glow inside the system’s neutral edge. B, C and D stay as references.',
    states: ['Pending request'], start: 'Pending request',
    options: [
      { key: 'a', label: 'Peach gold · system edge', note: 'Gold fill and token-strength gold glow. The edge is the system’s own neutral hairline (--il-edge), the same one the composer and every card use.', tone: 'gold', glow: true, edge: 'system' },
      { key: 'b', label: 'Peach gold · gold edge', note: 'Reference. Same fill and glow with the gold line token as the edge, which read as two edges.', tone: 'gold', glow: true, edge: 'tone' },
      { key: 'c', label: 'Blue · system edge', note: 'The same formula in the accent set, to keep the tone comparison honest.', tone: 'blue', glow: true, edge: 'system' },
      { key: 'd', label: 'Peach gold · gold edge, no glow', note: 'Reference. Edge line only.', tone: 'gold', glow: false, edge: 'tone' },
    ],
  },
  {
    id: 'questions', number: 7, title: 'Question alert', status: 'new', motion: false,
    brief: 'The same alert anatomy in glass. A question claims no state, so it carries no semantic colour. Choice clicks answer immediately; Other focuses the composer.',
    decision: 'LOCKED by the user, September 20: option A. Plain package glass, cream ink, answer rows centred in the card with labels on the title axis. B stays as a reference.',
    states: ['Two questions'], start: 'Two questions',
    options: [
      { key: 'a', label: 'Glass · cream ink', note: 'The maintained glass surface as it is. Cream lives in the icon and text only.', tone: 'none' },
      { key: 'b', label: 'Glass · cream wash', note: 'A faint cream wash, edge and glow mixed from the primary text token. Derived starting values, not a new palette colour.', tone: 'cream', glow: true },
    ],
  },
];
