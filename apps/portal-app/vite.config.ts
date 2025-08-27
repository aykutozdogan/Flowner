
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    host: '0.0.0.0',
    strictPort: true,
    hmr: {
      clientPort: 5175,
      host: '0.0.0.0'
    },
    allowedHosts: [
      'localhost',
      '.replit.dev',
      '.picard.replit.dev',
      '0305bf3e-a8a0-449c-adb5-192b49daa40b-00-35p3hpmvif7qt.picard.replit.dev'
    ],
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  },
  preview: {
    port: 5175,
    host: '0.0.0.0',
    strictPort: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared-ui': path.resolve(__dirname, '../../packages/shared-ui/src'),
      '@shared-core': path.resolve(__dirname, '../../packages/shared-core/src'),
    }
  },
  base: '/',
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
})
