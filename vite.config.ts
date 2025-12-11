import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // CRITICAL: Set base to './' to ensure assets load correctly in
  // subdirectory deployments or cloud IDE proxies (like Cloud Shell/IDX).
  base: './',
});