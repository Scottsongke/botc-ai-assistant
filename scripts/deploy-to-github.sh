#!/bin/bash

# 🚀 自动部署到GitHub脚本
# 使用方法: bash scripts/deploy-to-github.sh

set -e  # 遇到错误立即退出

echo "=================================="
echo "  🚀 部署到GitHub"
echo "=================================="
echo ""

# 配置
GITHUB_USERNAME="Scottsongke"
REPO_NAME="botc-ai-assistant"
REPO_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

# 检查Git状态
echo "📋 检查Git状态..."
if [ ! -d ".git" ]; then
    echo "❌ 错误: 当前目录不是Git仓库"
    exit 1
fi

# 检查是否有提交
COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "0")
if [ "$COMMIT_COUNT" -eq "0" ]; then
    echo "❌ 错误: 没有提交记录，请先执行 git commit"
    exit 1
fi

echo "✅ Git状态正常"
echo "   提交数: $COMMIT_COUNT"
echo ""

# 检查远程仓库
echo "📋 检查远程仓库..."
if git remote | grep -q "^origin$"; then
    EXISTING_URL=$(git remote get-url origin)
    echo "⚠️  远程仓库已存在: $EXISTING_URL"
    read -p "是否要更新为 $REPO_URL? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote set-url origin "$REPO_URL"
        echo "✅ 远程仓库URL已更新"
    fi
else
    git remote add origin "$REPO_URL"
    echo "✅ 已添加远程仓库: $REPO_URL"
fi
echo ""

# 重命名分支为main
echo "📋 检查分支..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "🔄 重命名分支 $CURRENT_BRANCH -> main"
    git branch -M main
fi
echo "✅ 当前分支: main"
echo ""

# 推送到GitHub
echo "🚀 推送到GitHub..."
echo "   仓库: $REPO_URL"
echo "   分支: main"
echo ""
echo "⚠️  注意: 如果需要认证，请使用Personal Access Token而不是密码"
echo "   获取Token: https://github.com/settings/tokens"
echo ""

# 尝试推送
if git push -u origin main; then
    echo ""
    echo "=================================="
    echo "  ✅ 推送成功！"
    echo "=================================="
    echo ""
    echo "🎉 代码已成功推送到GitHub！"
    echo ""
    echo "📍 仓库地址:"
    echo "   https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
    echo ""
    echo "🔗 下一步:"
    echo "   1. 访问 https://vercel.com"
    echo "   2. 导入仓库: ${REPO_NAME}"
    echo "   3. 配置环境变量: DASHSCOPE_API_KEY"
    echo "   4. 部署！"
    echo ""
else
    echo ""
    echo "=================================="
    echo "  ❌ 推送失败"
    echo "=================================="
    echo ""
    echo "可能的原因:"
    echo "  1. 仓库不存在，请先在GitHub创建:"
    echo "     https://github.com/new"
    echo ""
    echo "  2. 需要认证，请使用Personal Access Token:"
    echo "     https://github.com/settings/tokens"
    echo ""
    echo "  3. 权限不足，请检查仓库访问权限"
    echo ""
    echo "手动推送命令:"
    echo "  git remote add origin $REPO_URL"
    echo "  git branch -M main"
    echo "  git push -u origin main"
    echo ""
    exit 1
fi
