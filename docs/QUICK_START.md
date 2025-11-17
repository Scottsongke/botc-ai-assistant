# 🚀 快速开始指南

## 立即体验 (30秒)

```bash
# 1. 进入项目目录
cd /home/mini/血染钟楼/botc-ai-assistant

# 2. 运行测试场景
node main.js --test
```

你会看到AI分析一个7人局的完整输出！

## 📝 创建你自己的游戏分析

### 第1步: 准备游戏状态文件

创建 `my-game.json`:

```json
{
  "gameConfig": {
    "script": "trouble-brewing",
    "playerCount": 7,
    "currentDay": 2,
    "currentNight": 2
  },

  "players": [
    {
      "id": "P1",
      "name": "张三",
      "seatNumber": 0,
      "alive": true,
      "isMe": true,
      "myRole": {
        "type": "占卜师",
        "category": "townsfolk",
        "team": "good"
      }
    },
    {
      "id": "P2",
      "name": "李四",
      "seatNumber": 1,
      "alive": true,
      "claimedRole": "共情者"
    }
    // ... 添加其他玩家
  ],

  "allClaims": [
    {
      "player": "P2",
      "claimedRole": "共情者",
      "day": 1,
      "info": [
        {"night": 1, "evilCount": 1}
      ]
    }
    // ... 添加其他跳身份记录
  ],

  "nightDeaths": [
    {"night": 1, "players": ["P3"]}
  ],

  "myAbilityResults": [
    {
      "night": 1,
      "targets": ["P2", "P4"],
      "result": "no_demon"
    }
  ]
}
```

### 第2步: 运行分析

```bash
node main.js ./my-game.json
```

### 第3步: 查看结果

系统会输出：
- ⚠️ 矛盾检测
- 🧠 推理结论
- 🎯 恶魔嫌疑
- 💡 策略建议

## 🎮 实战示例

### 场景: 占卜师的困境

**游戏状态:**
- 第2天，7人局
- 你是占卜师，第1夜验了P2和P4，显示无恶魔
- 但P2也跳了占卜师！
- P2说他验了P5和P7，有恶魔
- P3（洗衣妇）说你可能是占卜师

**AI分析会告诉你:**
1. ⚠️ 矛盾：你和P2都跳占卜师，至少一人在说谎
2. 🧠 推理：P3支持你的身份，你是真占卜师概率高
3. 🎯 嫌疑：P2可能是伪跳，P5/P7中可能有恶魔
4. 💡 建议：
   - 今晚验P5和P7
   - 明天跳身份揭穿P2
   - 投票建议推P2或被验出的恶魔

## 📊 输出示例

```
╔════════════════════════════════════════════════════════════╗
║       血染钟楼 AI 助手 - 游戏分析                         ║
╚════════════════════════════════════════════════════════════╝

📊 游戏信息: 暗流涌动 | 7人局 | 第2天

⚠️  发现的矛盾:
  1. [high] 玩家1、玩家2 都跳占卜师，至少1人在说谎
     → 这些玩家中至少有一个是邪恶阵营

🧠 推理结论 (高可信度):
  1. [80%] 玩家3(洗衣妇)说玩家1可能是占卜师，支持玩家1

🎯 恶魔嫌疑排名:
  1. 玩家2 - 65.3% 概率
     证据: 与玩家1对撞占卜师; 跳占卜师
  2. 玩家5 - 45.8% 概率
     证据: 被玩家2验出可能是恶魔; 未跳身份

💡 AI 建议:

  【今晚能力使用】
  ✓ 今晚验 玩家5 和 玩家7
    理由: 玩家2说他们中有恶魔，需要验证

  【明天白天策略】
  ✓ 跳占卜师，公开你的验人信息
    理由: 与玩家2对抗，建立信任链
```

## 🔧 常见问题

### Q: 如何记录我的能力结果？

A: 在 `myAbilityResults` 数组中添加：

```json
{
  "night": 1,
  "targets": ["P2", "P4"],
  "result": "no_demon"  // 或 "has_demon"
}
```

### Q: 如何记录共情者的数字？

A: 在该玩家的 `allClaims` 中：

```json
{
  "player": "P2",
  "claimedRole": "共情者",
  "seatNumber": 1,
  "info": [
    {"night": 1, "evilCount": 1},
    {"night": 2, "evilCount": 0}
  ]
}
```

### Q: 如何记录死亡？

A: 在 `nightDeaths` 中：

```json
{
  "night": 1,
  "players": ["P3", "P5"]
}
```

### Q: 如何记录投票？

A: 在 `dayVotes` 中：

```json
{
  "day": 1,
  "nominations": [
    {
      "nominator": "P2",
      "nominee": "P5",
      "voters": ["P2", "P4", "P6"],
      "voteCount": 3,
      "executed": false
    }
  ]
}
```

## 💡 使用技巧

### 1. 逐步记录信息

每天游戏结束后，更新你的游戏状态文件：
- 添加新的跳身份
- 记录今晚死亡
- 记录今天投票
- 添加你的能力结果

### 2. 对比多个分析

可以保存不同时间点的游戏状态，看AI的分析如何变化。

### 3. 验证AI判断

AI给出恶魔嫌疑后，你可以：
- 如果你是占卜师，验证这些玩家
- 观察他们后续行为是否符合AI预测
- 游戏结束后对比真实身份

### 4. 学习推理技巧

阅读AI的推理过程，学习：
- 如何发现矛盾
- 如何交叉验证信息
- 如何评估可信度

## 🎯 下一步

1. **运行测试**: `node main.js --test`
2. **查看测试场景**: `test/test-game-scenario.json`
3. **修改测试场景**: 尝试改变跳身份、死亡等，看AI如何分析
4. **创建自己的游戏**: 基于真实游戏创建状态文件

## 📚 更多资源

- [完整文档](../README.md)
- [项目总结](./PROJECT_SUMMARY.md)
- [测试场景](../test/test-game-scenario.json)
- [暗流涌动角色数据](../data/trouble-brewing-roles.json)

---

**开始你的AI辅助血染钟楼之旅吧！** 🎭
