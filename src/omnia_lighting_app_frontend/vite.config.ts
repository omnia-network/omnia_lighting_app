import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import EnvironmentPlugin from 'vite-plugin-environment';
import { config } from 'dotenv';

config({
  path: "../../.env",
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    EnvironmentPlugin('all', {
      prefix: 'CANISTER',
    }),
    EnvironmentPlugin('all', {
      prefix: 'DFX',
    }),
    EnvironmentPlugin('all', {
      prefix: 'INTERNET_IDENTITY',
    }),
  ],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:4943",
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: "globalThis",
      },
    },
  },
});
