#!/usr/bin/env bash
# 导入《榫合》仓库保护设置。需要 gh 已登录且有 admin 权限。
# 用法：bash docs/github-settings/apply.sh [owner/repo]
set -euo pipefail

REPO="${1:-WH20080518/BlueFantasy}"
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> 目标仓库：$REPO"
gh api "repos/$REPO" --jq '.full_name + "  default_branch=" + .default_branch'

echo "==> 1/4 默认分支保护规则"
gh api -X POST "repos/$REPO/rulesets" --input "$DIR/ruleset-main.json" --jq '.name + " -> " + .enforcement'

echo "==> 2/4 标签保护规则"
gh api -X POST "repos/$REPO/rulesets" --input "$DIR/ruleset-tags.json" --jq '.name + " -> " + .enforcement'

echo "==> 3/4 仓库合并设置"
gh api -X PATCH "repos/$REPO" --input "$DIR/repo-settings.json" \
  --jq '"squash=" + (.allow_squash_merge|tostring) + " merge=" + (.allow_merge_commit|tostring) + " rebase=" + (.allow_rebase_merge|tostring)'

echo "==> 4/4 Actions 权限"
gh api -X PUT "repos/$REPO/actions/permissions/workflow" --input "$DIR/actions-permissions.json" \
  --jq '"default=" + .default_workflow_permissions + " can_approve_pr=" + (.can_approve_pull_request_reviews|tostring)'

echo
echo "完成。检查：gh api repos/$REPO/rulesets --jq '.[] | .name'"
