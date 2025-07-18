import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },

  // --- 【重要】我们不再使用 optimizeDeps ---
  // ---   而是使用下面这个更强力的配置   ---

  build: {
    rollupOptions: {
      // 这个配置直接告诉最终打包器Rollup：
      // “遇到 @gradio/client 这个包，不要把它打包进去，
      //   保留 import { client } from '@gradio/client' 这行代码，
      //   让浏览器在运行时自己去处理它。”
      // 这能从根本上解决解析失败的问题。
      external: ['@gradio/client']
    }
  }
})
