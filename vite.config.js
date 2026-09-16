import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from https://neilp211.github.io/recruiter-radar/. Override with BASE=/ for a root preview.
export default defineConfig({
  base: process.env.BASE ?? '/recruiter-radar/',
  plugins: [react()],
  build: { outDir: 'dist', assetsDir: 'assets' },
});
