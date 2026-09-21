import { createLucideIcon } from 'lucide-react';

/** Three Lucide Cloud outlines cascading from large to small. */
export const ThoughtBubble = createLucideIcon('ThoughtBubble', [
  ['path', { d: 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z', transform: 'translate(0 -4)', key: 'cloud' }],
  ['path', { d: 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z', transform: 'translate(4.2 12.9) scale(.26)', strokeWidth: '5', key: 'thought' }],
  ['path', { d: 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z', transform: 'translate(3.2 15.9) scale(.14)', strokeWidth: '8', key: 'origin' }],
]);
