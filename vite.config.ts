import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Archive-OmniDash-2/',  // GitHub Pages base path
  server: {
    port: 3001,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'charts': ['recharts'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['xlsx'],
  },
});
