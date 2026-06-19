import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-oxc' // Diubah ke OXC sesuai rekomendasi Vite

export default defineConfig({
  plugins: [react()],
})
