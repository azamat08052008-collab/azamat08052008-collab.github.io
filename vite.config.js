import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// Резюме + пять демо отдельными страницами: /demo/shop/, /demo/bot/, /demo/ai/, /demo/admin/, /demo/landing/
const page = (p) => resolve(import.meta.dirname, p)
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: page('index.html'),
        shop: page('demo/shop/index.html'),
        bot: page('demo/bot/index.html'),
        ai: page('demo/ai/index.html'),
        admin: page('demo/admin/index.html'),
        landing: page('demo/landing/index.html'),
      },
    },
  },
})
