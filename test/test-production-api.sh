#!/bin/bash

# 🧪 测试生产环境API
# 使用方法: bash test/test-production-api.sh [API_BASE_URL]
# 示例: bash test/test-production-api.sh https://botc-ai-assistant.vercel.app

set -e

# 获取API地址
if [ -z "$1" ]; then
    echo "❌ 错误: 请提供API地址"
    echo "使用方法: bash test/test-production-api.sh https://your-api.vercel.app"
    exit 1
fi

API_BASE_URL="$1"
API_URL="${API_BASE_URL}/api"

echo "======================================"
echo "  🧪 测试生产环境API"
echo "======================================"
echo ""
echo "API地址: $API_URL"
echo ""

# 测试计数
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
test_api() {
    local test_name="$1"
    local endpoint="$2"
    local method="${3:-GET}"
    local data="$4"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo "【测试$TOTAL_TESTS】$test_name"
    echo "  方法: $method"
    echo "  端点: $endpoint"

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    echo "  状态码: $http_code"

    if [ "$http_code" = "200" ]; then
        echo "  ✅ 测试通过"
        PASSED_TESTS=$((PASSED_TESTS + 1))

        # 显示响应（截取前200字符）
        if command -v jq &> /dev/null; then
            echo "$body" | jq -C '.' 2>/dev/null | head -20 || echo "$body" | head -5
        else
            echo "  响应: ${body:0:200}..."
        fi
    else
        echo "  ❌ 测试失败"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo "  错误: $body"
    fi

    echo ""
}

# 测试1: 健康检查
test_api "健康检查" "/health"

# 测试2: 快速分析
test_data_quick='{
  "players": [
    {"id": 1, "name": "玩家1", "alive": true, "isMe": true, "myRole": {"type": "占卜师", "team": "good"}},
    {"id": 2, "name": "玩家2", "alive": true},
    {"id": 3, "name": "玩家3", "alive": false},
    {"id": 4, "name": "玩家4", "alive": true},
    {"id": 5, "name": "玩家5", "alive": true}
  ],
  "currentDay": 2,
  "allClaims": [
    {"player": 1, "claimedRole": "占卜师"},
    {"player": 2, "claimedRole": "占卜师"}
  ],
  "nightDeaths": []
}'

test_api "快速分析（仅规则引擎）" "/analyze/quick" "POST" "$test_data_quick"

# 测试3: 获取角色数据
test_api "获取角色数据" "/roles/trouble-brewing"

# 测试4: 获取游戏规则
test_api "获取游戏规则" "/setup-rules"

# 测试5: 完整分析（含AI）
echo "【测试5】完整分析（含AI）"
echo "  ⚠️  此测试需要15-20秒，请耐心等待..."
echo ""

start_time=$(date +%s)

response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/analyze" \
    -H "Content-Type: application/json" \
    -d "$test_data_quick")

end_time=$(date +%s)
duration=$((end_time - start_time))

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo "  状态码: $http_code"
echo "  耗时: ${duration}秒"

if [ "$http_code" = "200" ]; then
    echo "  ✅ 测试通过"
    PASSED_TESTS=$((PASSED_TESTS + 1))

    # 提取AI分析结果
    if command -v jq &> /dev/null; then
        echo ""
        echo "  --- AI分析摘要 ---"
        echo "$body" | jq -r '.data.llmAnalysis.analysis // "无AI分析"' 2>/dev/null | head -10
        echo ""
        echo "  --- Token使用 ---"
        echo "$body" | jq -C '.data.llmAnalysis.tokensUsed' 2>/dev/null || echo "  无Token信息"
    else
        echo "  响应: ${body:0:300}..."
    fi
else
    echo "  ❌ 测试失败"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo "  错误: $body"
fi

echo ""

# 测试总结
echo "======================================"
echo "  📊 测试总结"
echo "======================================"
echo ""
echo "总测试数: $TOTAL_TESTS"
echo "✅ 通过: $PASSED_TESTS"
echo "❌ 失败: $FAILED_TESTS"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo "🎉 所有测试通过！API运行正常！"
    echo ""
    echo "📍 API地址: $API_BASE_URL"
    echo ""
    echo "🔗 可用接口:"
    echo "  GET  $API_URL/health"
    echo "  POST $API_URL/analyze"
    echo "  POST $API_URL/analyze/quick"
    echo "  POST $API_URL/chat"
    echo "  GET  $API_URL/roles/trouble-brewing"
    echo "  GET  $API_URL/setup-rules"
    echo ""
    echo "💡 下一步:"
    echo "  1. 在微信小程序中配置此API地址"
    echo "  2. 在微信公众平台添加服务器域名"
    echo "  3. 开始使用！"
    echo ""
    exit 0
else
    echo "⚠️  部分测试失败，请检查:"
    echo "  1. API地址是否正确"
    echo "  2. Vercel环境变量是否配置: DASHSCOPE_API_KEY"
    echo "  3. 查看Vercel部署日志"
    echo ""
    exit 1
fi
