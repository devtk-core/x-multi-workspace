import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    ...(command === 'serve' ? [{
      name: 'development-csp',
      transformIndexHtml: (html: string) => html.replace(
        "connect-src 'self'",
        "connect-src 'self' http://127.0.0.1:5173 ws://127.0.0.1:5173"
      )
    }] : [])
  ],
  base: './',
  build: { outDir: 'dist/renderer', emptyOutDir: true }
}));
