import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'framer-motion',
      '@radix-ui/react-portal',
      '@radix-ui/react-presence',
      '@radix-ui/react-focus-scope',
      '@radix-ui/react-dismissable-layer',
    ],
  },
});
