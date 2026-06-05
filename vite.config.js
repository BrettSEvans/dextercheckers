import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    base: process.env.GITHUB_PAGES === 'true' ? '/dexter-project/' : '/',
    plugins: [react()],
    test: {
          environment: 'jsdom',
          setupFiles: ['./src/test-setup.js'],
          globals: true,
    },
});
