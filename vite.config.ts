import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const fullCalendarPackages = [
  '@fullcalendar/core',
  '@fullcalendar/react',
  '@fullcalendar/resource',
  '@fullcalendar/resource-timeline',
  '@fullcalendar/interaction',
  '@fullcalendar/timeline',
  '@fullcalendar/scrollgrid',
  '@fullcalendar/premium-common',
]

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['@fullcalendar/core'],
  },
  optimizeDeps: {
    include: fullCalendarPackages,
  },
})
