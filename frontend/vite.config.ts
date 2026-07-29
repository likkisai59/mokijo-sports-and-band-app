import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      'next/link': path.resolve(__dirname, './src/shims/next-link.tsx'),
      'next/navigation': path.resolve(__dirname, './src/shims/next-navigation.tsx'),
      'next/image': path.resolve(__dirname, './src/shims/next-image.tsx'),
    },
  },
  server: {
    port: 3000,
  },
  define: {
    'process.env': {},
  },
});
