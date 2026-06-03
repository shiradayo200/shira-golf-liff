import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path must match the GitHub repository name
export default defineConfig({
  plugins: [react()],
  base: '/shira-golf-liff/',
  build: { outDir: 'dist' }
})
