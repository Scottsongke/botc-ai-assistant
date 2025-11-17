#!/bin/bash
# API接口测试脚本

echo "======================================"
echo "  血染钟楼AI助手 - API接口测试"
echo "======================================"
echo ""

# 测试1: 健康检查
echo "【测试1】健康检查..."
curl -s http://localhost:3000/api/health | python3 -m json.tool
echo ""
echo ""

# 测试2: 快速分析（仅规则引擎）
echo "【测试2】快速分析（仅规则引擎）..."
cat > /tmp/test-game.json << 'EOF'
{
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
}
EOF

curl -s -X POST http://localhost:3000/api/analyze/quick \
  -H "Content-Type: application/json" \
  -d @/tmp/test-game.json | python3 -m json.tool | head -30
echo ""
echo ""

# 测试3: 获取角色数据
echo "【测试3】获取角色数据..."
curl -s http://localhost:3000/api/roles/trouble-brewing | python3 -m json.tool | head -20
echo ""
echo ""

echo "======================================"
echo "  ✅ API测试完成"
echo "======================================"
