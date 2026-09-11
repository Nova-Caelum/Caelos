import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],cacheDir:'.vite-atlas',resolve:{dedupe:['react','react-dom']},server:{fs:{allow:['.','/Users/danieleghdami/NovaCaelum_code/Caelos-console/node_modules']}},build:{outDir:'dist'}});
