import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Load .env from repo root (one level up from frontend/)
  envDir: path.resolve(__dirname, '..'),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
