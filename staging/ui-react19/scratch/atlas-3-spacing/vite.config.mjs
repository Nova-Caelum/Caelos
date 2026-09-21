import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
const root = fileURLToPath(new URL('.', import.meta.url));
const app = fileURLToPath(new URL('../../../..', import.meta.url));
export default defineConfig({
  root, cacheDir: '.vite',
  css: { postcss: { plugins: [tailwindcss({ base: app })] } },
  plugins: [react(), { name: 'studio-server-boundary', enforce: 'pre', load(id) {
    if (/^(server\/|lib\/db\/(queries|utils)|lib\/ai\/providers|artifacts\/[^/]+\/server\.)/.test(relative(app, id))) throw new Error(`Server-only import blocked in Studio: ${id}`);
  } }],
  resolve: { dedupe: ['react', 'react-dom'], alias: [
    { find: '@/hooks/use-active-chat', replacement: `${root}/studio/context-adapter.tsx` },
    { find: '@', replacement: app },
  ] },
  server: { host: '127.0.0.1', port: 5187, strictPort: true },
  preview: { host: '127.0.0.1', port: 5187, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true, rollupOptions: { input: { atlas: `${root}/index.html`, specimen: `${root}/specimen.html` } } },
});
