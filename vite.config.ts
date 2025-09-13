import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isDev = mode === 'development';

    return {
      // GitHub Pages deployment base path
      base: mode === 'production' ? '/Image-Expand/' : '/',
      define: {
        'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Enhanced logging configuration
      logLevel: isDev ? 'info' : 'warn',
      server: {
        // Auto-open browser when server starts
        open: true,
        port: 5173,
        // More verbose server logging
        hmr: {
          overlay: true,
        },
      },
      build: {
        // Show detailed build information
        reportCompressedSize: true,
        chunkSizeWarningLimit: 1000,
        // GitHub Pages compatibility
        outDir: 'dist',
        sourcemap: false,
      }
    };
});
