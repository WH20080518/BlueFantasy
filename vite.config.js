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
})
