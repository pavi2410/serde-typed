import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        safe: resolve(__dirname, 'src/safe.ts')
      },
      name: 'TsSerde',
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