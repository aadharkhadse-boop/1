import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Stamped at build time. Every data or code change triggers a rebuild/redeploy,
// so this doubles as the dashboard's "last updated" timestamp.
const buildDate = new Date().toISOString()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
})
