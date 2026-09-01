import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/admin/api': 'http://localhost:5000',
      '/admin/login': 'http://localhost:5000',
      '/admin/status': 'http://localhost:5000',
      '/admin/logout': 'http://localhost:5000',
      '/admin/projects': 'http://localhost:5000',
      '/run': 'http://localhost:5000',
      '/visitor-count': 'http://localhost:5000',
      '/donation-stats': 'http://localhost:5000',
      '/create-order': 'http://localhost:5000',
      '/verify-payment': 'http://localhost:5000'
    }
  },
  build: { outDir: 'dist' }
})
