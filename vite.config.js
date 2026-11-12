import { defineConfig } from 'vite'

// GitHub Pages 项目页：https://wh20080518.github.io/BlueFantasy/
// Cloudflare Pages 根路径：https://bluefantasy.pages.dev
// Cloudflare 构建时自动注入 CF_PAGES，用它切换 base
export default defineConfig({
  base: process.env.CF_PAGES ? '/' : '/BlueFantasy/',
  server: {
    // WSL 下 /mnt/d 的 inotify 不触发，轮询才能让改动生效
    watch: { usePolling: true, interval: 400 },
  },
  build: {
    // three 单独成 chunk 后本身约 600 kB（gzip 156 kB），这是可接受的固定成本，
    // 阈值上调避免每次构建都报一条无意义警告。
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // three 单独切出去：主包小、three 不随业务代码变更而失效，首屏可并行下载
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
})
