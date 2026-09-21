export const documentId = 'atlas3-fixture-document';
export const documentTitle = 'Workspace review brief';
export const documentText = `# Workspace review brief\n\nA clear conversation should preserve the relationship between the speaker, the work, and its supporting document.\n\n## Review priorities\n\n- Keep the conversation open and readable.\n- Give thinking and tool activity a quiet supporting surface.\n- Separate the expanded document from the graph-paper ground.\n\n## Acceptance criteria\n\nReview the same component at a narrow and a wide viewport. Inspect keyboard focus, long text, and the transition from work in progress to a completed result.\n\n| Surface | Purpose |\n| --- | --- |\n| Ground | Shared conversation space |\n| Raised | Supporting activity |\n| Reading plane | Focused document editing |\n\n## Next steps\n\nRecord observations in Studio before promoting any changes.\n\n${Array.from({ length: 5 }, (_, i) => `### Review note ${i + 1}\n\nUse consistent identity and deliberate spacing to make this work easier to follow.`).join('\n\n')}`;
let documents = [{ id: documentId, title: documentTitle, content: documentText, kind: 'text', userId: 'atlas-fixture', createdAt: '2026-09-19T12:00:00Z' }];
const votes: Record<string, unknown>[] = [];
export const fixtureRequests: { method: string; path: string; handled: boolean }[] = [];
export function installFixtureNetwork() {
  // No forwarding. This interceptor is installed before app modules are imported.
  // CSP also blocks real fetch/XHR/WebSocket/EventSource traffic in the frame.
  window.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input), location.href);
    const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const path = url.pathname;
    const handled = url.origin === location.origin && ['/api/document', '/api/vote', '/api/suggestions', '/api/auth/session', '/api/models'].includes(path);
    fixtureRequests.push({ method, path, handled });
    window.dispatchEvent(new CustomEvent('studio-fixture-request'));
    const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
    if (!handled) return json({ error: `Studio blocked an unconfigured request: ${method} ${path}` }, 503);
    if (path === '/api/document') {
      if (method === 'POST') { const body = JSON.parse(String(init?.body || '{}')); documents = [...documents, { ...documents.at(-1)!, ...body, id: documentId, createdAt: new Date().toISOString() }]; }
      if (method === 'DELETE') documents = documents.slice(0, 1);
      return json(documents);
    }
    if (path === '/api/vote') { if (method === 'PATCH') votes.push(JSON.parse(String(init?.body || '{}'))); return json(votes); }
    if (path === '/api/suggestions') return json([]);
    if (path === '/api/models') return json({ capabilities: {} });
    return json({ user: { id: 'atlas-fixture', name: 'Studio reviewer', email: 'fixture@example.invalid', type: 'regular' }, expires: '2099-01-01T00:00:00Z' });
  };
}
