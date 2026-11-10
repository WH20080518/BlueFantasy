# Cloudflare Pages 备用镜像

主站是 GitHub Pages。本文档记录 Cloudflare Pages 备用镜像的接入方式。

> 当前状态：已接入并上线。

## 正式地址

- 主站：https://wh20080518.github.io/BlueFantasy/
- 备用：https://bluefantasy.pages.dev

## 方案 A：Dashboard 连接 Git（已采用）

1. 登录 Cloudflare Dashboard
2. 左侧 **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. 选择 GitHub 仓库 `WH20080518/BlueFantasy`
4. 构建设置：
   - Framework preset：`Vite`
   - Build command：`npm run build`
   - Build output directory：`dist`
5. 项目名填 `bluefantasy`
6. **Save and Deploy**

完成后地址：

```
https://bluefantasy.pages.dev
```

之后每次推 `main`，Cloudflare 会自动构建。

## 方案 B：CLI + API Token

1. Cloudflare Dashboard → My Profile → API Tokens → Create Token
2. 权限选 **Cloudflare Pages : Edit**
3. 保存 token 和 Account ID

```bash
export CLOUDFLARE_API_TOKEN="<token>"
export CLOUDFLARE_ACCOUNT_ID="<account-id>"

npx wrangler pages project create bluefantasy --production-branch main
npm run build
npx wrangler pages deploy dist --project-name bluefantasy
```

## 注意事项

- Cloudflare Pages 免费，支持公开和私有仓库
- 不需要 ICP 备案
- 大陆访问速度不稳定，免费版可能绕美国节点；只作为备用链接
- 自定义域名可在 Pages 项目的 **Custom domains** 里绑定
- 如果绑定了自定义域名，`vite.config.js` 的 `base` 仍保持 `/BlueFantasy/` 只影响 GitHub Pages 项目页；Cloudflare 从根路径提供服务，需要在 Cloudflare 构建时覆盖 `base` 为 `/`

### base 路径冲突的处理

GitHub Pages 项目页需要 `base: '/BlueFantasy/'`，Cloudflare Pages 根路径需要 `base: '/'`。两种做法：

1. Cloudflare 构建命令改为：`npm run build -- --base=/`
2. 或用环境变量在 `vite.config.js` 里判断：

```js
export default defineConfig({
  base: process.env.CF_PAGES ? '/' : '/BlueFantasy/',
})
```

推荐第 2 种，Cloudflare 会自动注入 `CF_PAGES` 环境变量。

## 提交材料写法

```
主链接：https://wh20080518.github.io/BlueFantasy/
备用链接：https://bluefantasy.pages.dev
```

已验证：两个地址均返回 200，Cloudflare 节点为 HKG，JS/CSS 资源无 404。

## 验收

- 两个链接都能打开
- 手机 4G/5G 至少一个能打开
- 页面资源无 404，控制台无报错
