import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Garante que o process.env não quebre o build se alguma lib antiga tentar acessá-lo
    'process.env': {}
  }
});