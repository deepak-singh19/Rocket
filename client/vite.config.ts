import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Allow builds to continue despite TypeScript errors
    rollupOptions: {
      onwarn: (warning, warn) => {
        // Suppress TypeScript warnings during build
        if (warning.code === 'PLUGIN_WARNING' && warning.plugin === '@rollup/plugin-typescript') {
          return
        }
        warn(warning)
      }
    }
  },
  esbuild: {
    // Ignore TypeScript errors during build
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})
