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

  // --- 【重要】在这里添加以下配置来修复Vercel构建错误 ---
  // 这个配置告诉Vite在打包时，不要去尝试分析@gradio/client这个库的内部结构，
  // 从而绕过那个解析错误。
  optimizeDeps: {
    exclude: ['@gradio/client']
  }
})
