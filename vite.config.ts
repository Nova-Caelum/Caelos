import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { foundryDevPlugin } from './vite-plugins/foundry-dev'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    foundryDevPlugin(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    // Dev stand-in for the same-origin /ops proxy (functions/ops/[[path]].ts). Enabled in the app by
    // VITE_OPS_PROXY=1. The bearer is read from the dev shell (CONSOLE_OPS_BEARER, no VITE_ prefix), so
    // it stays in the dev server process and never reaches the bundle.
    proxy: {
      '/ops': {
        target: process.env.OPS_API_URL || 'https://nova-caelum-ops-production.up.railway.app',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ops/, ''),
        headers: process.env.CONSOLE_OPS_BEARER ? { Authorization: `Bearer ${process.env.CONSOLE_OPS_BEARER}` } : {},
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
