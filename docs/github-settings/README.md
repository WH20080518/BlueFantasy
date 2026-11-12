# GitHub 仓库保护设置

三个目标：**删不掉、改不乱、合并要有人看过。**

## 文件

| 文件 | 作用 | 导入位置 |
|---|---|---|
| `ruleset-main.json` | 保护默认分支：禁止删除、禁止强推、合并需 1 人 approve | Settings → Rules → Rulesets |
| `ruleset-tags.json` | 保护 `v*` 标签：禁止删除、禁止移动 | 同上 |
| `repo-settings.json` | 合并方式、自动删分支、关闭 wiki | PATCH `/repos/{owner}/{repo}` |
| `actions-permissions.json` | 默认 workflow token 只读，禁止 Actions 自己批 PR | PUT `/actions/permissions/workflow` |

## 一条命令导入

```bash
gh api -X POST repos/WH20080518/BlueFantasy/rulesets --input docs/github-settings/ruleset-main.json
gh api -X POST repos/WH20080518/BlueFantasy/rulesets --input docs/github-settings/ruleset-tags.json
gh api -X PATCH repos/WH20080518/BlueFantasy --input docs/github-settings/repo-settings.json
gh api -X PUT repos/WH20080518/BlueFantasy/actions/permissions/workflow --input docs/github-settings/actions-permissions.json
```

网页导入：Settings → Rules → Rulesets → **New ruleset** → 右上角 **Import a ruleset**，选 JSON。

## 每个规则在防什么

**`deletion`**：默认分支不能被删。有人误点 “Delete branch” 会被拒。

**`non_fast_forward`**：禁止 force push。历史不能被改写，已推的提交不会消失。

**`pull_request`**：
- `required_approving_review_count: 1` —— 至少一人 approve 才能合
- `dismiss_stale_reviews_on_push: true` —— 批准后又推新提交，旧批准作废，必须重新看
- `required_review_thread_resolution: true` —— 行内评论必须 resolve 才能合
- `allowed_merge_methods: merge, squash` —— 不允许 rebase 合并（会改写提交）

**`bypass_actors`（RepositoryRole 5 = admin）**：管理员可以紧急绕过。**如果你要“任何人都不能绕过”，把这一段删掉再导入。** 删掉后连你自己也得等别人 approve。

## 仓库被删这件事，只能做到这一步

`deletion` 规则保护的是**分支**，不是仓库本身。GitHub 没有“锁定仓库不允许删除”的开关，能做的只有：

1. **转成组织仓库**，在组织设置里关掉 members 的删除权限（唯一真正的技术手段）
2. 保持 2FA，删库需要输入仓库全名确认
3. 保留一份镜像（本地 clone 或另一个 remote），删了还能恢复
4. 重要 release 打 tag，tag 受 `ruleset-tags.json` 保护

个人账号下的公开仓库，**没有任何 API 可以禁止删除**。谁拿到 admin 权限谁就能删。这一点必须说清楚，别以为导入了 JSON 就万无一失。

## 相对自由在哪

- 分支随便建，PR 随便开
- 合并方式保留 merge 和 squash 两种
- 自动删已合并分支（`delete_branch_on_merge`），省得堆一堆死分支
- 只对默认分支和 `v*` 标签设限，feature 分支不受约束
- wiki 关掉（文档都在 `docs/`，免得两处漂移）
- 管理员保留 bypass，出事能自救

## 免费版能不能用

仓库是 public，Repository Rulesets 免费可用。私有仓库的 rulesets 需要 Pro/Team/Enterprise。
