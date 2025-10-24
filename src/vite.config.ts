import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `static/doubles_order/[name].js`,
        chunkFileNames: `static/doubles_order/[name].js`,
        assetFileNames: `static/doubles_order/[name][extname]`,
      },      
      input: {
        doubles_order:  resolve(__dirname, 'doubles_order.html'),
      }
    }
  }
})
