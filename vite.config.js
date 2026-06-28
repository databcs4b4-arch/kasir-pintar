import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Konfigurasi standar tanpa properti "jsx" manual yang memicu warning
export default defineConfig({
  plugins: [react()],
})
