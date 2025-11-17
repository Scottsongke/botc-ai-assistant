#!/bin/bash

# 🚀 一键部署脚本
# 快速部署到GitHub和Vercel
# 使用方法: bash scripts/quick-deploy.sh

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       🎭 血染钟楼AI助手 - 一键部署                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 配置
GITHUB_USERNAME="Scottsongke"
REPO_NAME="botc-ai-assistant"
REPO_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

echo "📋 部署配置:"
echo "  GitHub用户: $GITHUB_USERNAME"
echo "  仓库名称: $REPO_NAME"
echo "  仓库地址: $REPO_URL"
echo ""

# 步骤1: 检查Git状态
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 1/4: 检查Git状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -d ".git" ]; then
    echo "❌ 错误: 当前目录不是Git仓库"
    echo "请先运行: git init && git add . && git commit -m \"Initial commit\""
    exit 1
fi

COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "0")
if [ "$COMMIT_COUNT" -eq "0" ]; then
    echo "❌ 错误: 没有Git提交"
    echo "请先运行: git add . && git commit -m \"Initial commit\""
    exit 1
fi

echo "✅ Git状态正常"
echo "   提交数: $COMMIT_COUNT"
echo "   分支: $(git branch --show-current)"
echo ""

# 步骤2: 配置远程仓库
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 2/4: 配置远程仓库"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if git remote | grep -q "^origin$"; then
    echo "ℹ️  远程仓库已存在"
    EXISTING_URL=$(git remote get-url origin)
    if [ "$EXISTING_URL" != "$REPO_URL" ]; then
        echo "⚠️  当前URL: $EXISTING_URL"
        echo "   目标URL: $REPO_URL"
        echo ""
        read -p "是否更新远程仓库URL? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git remote set-url origin "$REPO_URL"
            echo "✅ 远程仓库URL已更新"
        fi
    else
        echo "✅ 远程仓库URL正确"
    fi
else
    git remote add origin "$REPO_URL"
    echo "✅ 已添加远程仓库"
fi
echo ""

# 确保分支是main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    git branch -M main
    echo "✅ 分支已重命名为main"
fi
echo ""

# 步骤3: 推送到GitHub
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 3/4: 推送到GitHub"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  注意事项:"
echo "  1. 如果仓库不存在，请先访问 https://github.com/new 创建"
echo "  2. 如需认证，请使用Personal Access Token"
echo "  3. Token获取: https://github.com/settings/tokens"
echo ""
echo "准备推送到: $REPO_URL"
echo ""

read -p "是否继续推送? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 取消推送"
    exit 1
fi

echo "🚀 开始推送..."
echo ""

if git push -u origin main 2>&1; then
    echo ""
    echo "✅ 代码已成功推送到GitHub！"
    echo ""
else
    echo ""
    echo "❌ 推送失败"
    echo ""
    echo "💡 可能的原因:"
    echo "  1. 仓库不存在 → 访问 https://github.com/new 创建"
    echo "  2. 需要认证 → 使用Personal Access Token"
    echo "  3. 权限不足 → 检查仓库访问权限"
    echo ""
    echo "手动推送命令:"
    echo "  git push -u origin main"
    echo ""
    exit 1
fi

# 步骤4: 部署到Vercel
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 4/4: 部署到Vercel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Vercel部署步骤:"
echo ""
echo "1️⃣  访问 Vercel"
echo "   https://vercel.com"
echo ""
echo "2️⃣  登录/注册"
echo "   使用GitHub账号登录"
echo ""
echo "3️⃣  导入项目"
echo "   New Project → 选择 $REPO_NAME"
echo ""
echo "4️⃣  配置环境变量（重要！）"
echo "   Name:  DASHSCOPE_API_KEY"
echo "   Value: sk-93c5d42145264a6bb95dc1611c01580a"
echo ""
echo "5️⃣  部署"
echo "   点击 Deploy → 等待2-3分钟"
echo ""
echo "6️⃣  测试"
echo "   部署完成后会显示API地址，例如:"
echo "   https://botc-ai-assistant.vercel.app"
echo ""

# 检查是否安装了vercel CLI
if command -v vercel &> /dev/null; then
    echo "ℹ️  检测到Vercel CLI已安装"
    echo ""
    read -p "是否使用CLI自动部署? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 开始Vercel CLI部署..."
        echo ""
        vercel --prod
        echo ""
        echo "✅ Vercel部署完成！"
    else
        echo "ℹ️  请手动在浏览器中完成部署"
    fi
else
    echo "💡 提示: 可以安装Vercel CLI进行自动部署"
    echo "   npm i -g vercel"
    echo ""
    read -p "按Enter键在浏览器中打开Vercel..."

    # 尝试打开浏览器
    if command -v xdg-open &> /dev/null; then
        xdg-open "https://vercel.com/new/clone?repository-url=$REPO_URL" &
    elif command -v open &> /dev/null; then
        open "https://vercel.com/new/clone?repository-url=$REPO_URL" &
    else
        echo "请手动访问: https://vercel.com"
    fi
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║       ✅ 部署流程完成！                                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 GitHub仓库:"
echo "   https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
echo ""
echo "🔗 下一步:"
echo "   1. 完成Vercel部署（如果还没有）"
echo "   2. 获取API地址"
echo "   3. 运行测试:"
echo "      bash test/test-production-api.sh https://your-api.vercel.app"
echo "   4. 配置微信小程序服务器域名"
echo ""
echo "📚 更多信息:"
echo "   查看: 部署到GitHub和Vercel完整指南.md"
echo ""
echo "🎉 恭喜！系统即将上线！"
echo ""
