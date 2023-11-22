import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(), cesium()],
    resolve: {
        alias: {
            'assets': '@/assets',
        }
    },
    server: {
        hmr: {
            protocol: 'ws',
            host: 'localhost',
        },

        base: './',
        proxy: {
            '/api': {
                target: 'http://192.168.1.107:5125/', // 代理目标地址
                ws: true,  // 是否开启websocket支持
                changeOrigin: true, // 是否允许跨域
                rewrite: (path) => path.replace(/^\/api/, ''), //路径重写规则
            }
        }
    }
})