import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    host: '0.0.0.0'
  },
  preview: {
    port: 5175,
    host: '0.0.0.0',
    allowedHosts: ['all']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared-ui': path.resolve(__dirname, '../../packages/shared-ui/src'),
      '@shared-core': path.resolve(__dirname, '../../packages/shared-core/src'),
    }
  }
})