import { defineConfig, Plugin } from 'vite'
import { createVuePlugin } from 'vite-plugin-vue2'
import { resolve } from 'path'

// Plugin to stub out core-js imports (polyfills handled by consuming app)
function stubCoreJs (): Plugin {
  return {
    name: 'stub-core-js',
    resolveId (id) {
      if (id.startsWith('core-js')) {
        return id
      }
      return null
    },
    load (id) {
      if (id.startsWith('core-js')) {
        return 'export default {}'
      }
      return null
    }
  }
}

export default defineConfig(({ command }) => {
  const isLibBuild = process.env.BUILD_LIB === 'true'

  return {
    plugins: [
      stubCoreJs(),
      createVuePlugin()
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    // Exclude core-js from optimization
    optimizeDeps: {
      exclude: ['core-js']
    },
    // Dev server configuration
    server: {
      port: 8080,
      open: true
    },
    // Use public folder for dev, disable for lib build
    publicDir: isLibBuild ? false : 'public',
    build: isLibBuild ? {
      // Library build configuration
      lib: {
        entry: resolve(__dirname, 'src/lib.ts'),
        name: 'VuePdfSigner',
        formats: ['es', 'cjs', 'umd'],
        fileName: (format) => {
          if (format === 'es') return 'vue-pdf-signer.es.js'
          if (format === 'cjs') return 'vue-pdf-signer.cjs.js'
          return 'vue-pdf-signer.umd.js'
        }
      },
      rollupOptions: {
        external: ['vue'],
        output: {
          globals: {
            vue: 'Vue'
          },
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'style.css') return 'vue-pdf-signer.css'
            return assetInfo.name || 'assets/[name]-[hash][extname]'
          },
          exports: 'named'
        }
      },
      sourcemap: true,
      outDir: 'dist',
      emptyOutDir: true,
      minify: 'esbuild',
      target: 'es2018'
    } : {
      // App build configuration (for testing)
      outDir: 'dist-app',
      emptyOutDir: true
    }
  }
})
