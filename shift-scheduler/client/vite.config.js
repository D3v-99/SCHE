import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/apps/schedule/',
  server: {
    port: 3000,
    proxy: {
      '/apps/schedule/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/apps\/schedule\/api/, '/api')
      }
    }
  }
})
