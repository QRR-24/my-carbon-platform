import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  // 关键：配置基础路径，适配 Vercel 部署
  base: './', 
  plugins: [vue()],
  resolve: {
    // 解决路径别名问题（如果你的项目用了 @ 别名）
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  // 构建配置，确保输出到 dist 目录
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        // 明确指定入口文件路径
        main: path.resolve(__dirname, 'index.html')
      }
    }
  }
})