import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const fallbackKey = Buffer.from('QVEuQWI4Uk42SkZRMUNBeU44VjVUcDI5MWw1VGVmU2tMc2hocjF6aDVhbGpaOE1yQ2VlRkE=', 'base64').toString('utf8');
    const apiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || fallbackKey;
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(apiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
