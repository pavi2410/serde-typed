import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TsSerde',
      fileName: 'index',
      formats: ['es']
    },
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      output: {
        preserveModules: false,
        exports: 'named'
      }
    },
    target: 'es2022',
    outDir: 'dist'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  define: {
    'import.meta.vitest': 'undefined'
  }
})