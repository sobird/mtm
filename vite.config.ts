import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },

  resolve: {
    alias: {
      '@': '/src'
    }
  },

  css: {
    preprocessorOptions: {
      less: {
        modifyVars: {
          '@primary-color': '#4377FE',//设置antd主题色
          '@ant-prefix': 'mtm',
        },
      }
    }
  }
})
