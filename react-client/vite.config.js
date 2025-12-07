import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Set React development server to run on port 3000
  server: {
    port: 3000, 
  }
})
