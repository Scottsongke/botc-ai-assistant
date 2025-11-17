# 血染钟楼 AI 智能助手

> Blood on the Clocktower AI Assistant - 游戏分析和策略建议系统

## 📖 项目简介

这是一个为血染钟楼桌游设计的AI智能助手，可以根据游戏状态、玩家声称的角色、每晚/每天的信息，进行深度推理分析，给出最佳策略建议。

### 核心功能

- ✅ **逻辑推理引擎**: 自动检测信息矛盾、分析跳身份情况
- ✅ **概率计算系统**: 基于贝叶斯推理计算每个玩家的身份概率
- ✅ **策略建议生成**: 针对不同角色给出能力使用、发言、投票建议
- ✅ **完整数据库**: 暗流涌动剧本所有角色的完整数据

## 🚀 快速开始

### 安装

```bash
cd botc-ai-assistant
npm install
```

### 运行测试

```bash
npm test
# 或
node main.js --test
```

### 分析自定义游戏

```bash
node main.js ./my-game.json
```

## 📁 项目结构

```
botc-ai-assistant/
├── data/                           # 数据文件
│   ├── trouble-brewing-roles.json  # 暗流涌动角色数据库
│   └── game-setup-rules.json       # 游戏设置规则
├── engine/                         # 核心引擎
│   ├── inference-engine.js         # 推理引擎
│   ├── probability-calculator.js   # 概率计算器
│   └── strategy-advisor.js         # 策略顾问
├── test/                           # 测试文件
│   ├── test-game-scenario.json     # 测试场景
│   └── test-result.json            # 测试结果（自动生成）
├── main.js                         # 主程序入口
├── package.json                    # 项目配置
└── README.md                       # 项目文档
```

## 💡 使用示例

### 1. 创建游戏状态文件

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
      "name": "玩家1",
      "seatNumber": 0,
      "alive": true,
      "isMe": true,
      "myRole": {
        "type": "占卜师",
        "category": "townsfolk",
        "team": "good"
      }
    }
    // ... 其他玩家
  ],
  "allClaims": [
    // 玩家跳身份的记录
  ],
  "nightDeaths": [
    // 夜晚死亡记录
  ]
}
```

### 2. 运行分析

```bash
node main.js ./my-game.json
```

### 3. 查看结果

程序会输出：
- ⚠️ 发现的矛盾
- 🧠 推理结论
- 🎯 恶魔嫌疑排名
- 💡 AI 策略建议

## 🎮 支持的功能

### 推理分析

- [x] 同一角色多人跳检测
- [x] 占卜师信息矛盾检测
- [x] 共情者数字验证
- [x] 洗衣妇/图书馆员/调查员信息交叉验证
- [x] 死亡模式分析
- [x] 投票行为分析

### 概率计算

- [x] 初始概率分布
- [x] 基于跳身份更新概率
- [x] 基于矛盾更新概率
- [x] 基于行为模式更新概率
- [x] 恶魔概率排名

### 策略建议

- [x] 占卜师验人建议
- [x] 共情者分析建议
- [x] 僧侣保护建议
- [x] 猎手开枪时机
- [x] 市长胜利条件提醒
- [x] 投票建议
- [x] 发言策略

## 🔧 技术架构

### 核心算法

1. **推理引擎**: 基于规则的逻辑推理系统
   - 矛盾检测算法
   - 信息交叉验证
   - 行为模式分析

2. **概率计算**: 贝叶斯推理
   - 先验概率：基于游戏配置
   - 似然度：基于观察到的证据
   - 后验概率：动态更新

3. **策略系统**: 决策树+博弈论
   - 角色特定策略
   - 时机判断
   - 风险评估

### 数据结构

- 角色数据库：JSON格式，包含所有角色的完整信息
- 游戏状态：结构化数据，记录完整游戏进程
- 分析结果：分层输出，便于展示

## 📊 测试场景说明

`test/test-game-scenario.json` 包含一个经典的占卜师对撞场景：

- 7人局，第2天
- P1（我）是真占卜师
- P2也跳占卜师（假）
- P3（洗衣妇）第1夜被杀，生前说P1可能是占卜师
- P4（共情者）提供邻居信息
- 需要分析谁是真占卜师，谁是恶魔

运行 `npm test` 可以看到AI如何分析这个场景。

## 🛣️ 后续计划

### MVP阶段 ✅
- [x] 暗流涌动角色数据库
- [x] 推理引擎核心逻辑
- [x] 概率计算模块
- [x] 策略建议系统
- [x] 命令行测试工具

### 下一步开发
- [ ] 微信小程序前端
- [ ] 接入通义千问/DeepSeek大模型
- [ ] 可视化界面（概率图表）
- [ ] 语音输入支持
- [ ] 历史游戏回放

### 高级功能
- [ ] 支持更多剧本（坏月升起、暗黑集市）
- [ ] 强化学习优化策略
- [ ] 说书人辅助工具
- [ ] 自定义剧本支持

## 📝 开发指南

### 添加新角色

编辑 `data/trouble-brewing-roles.json`:

```json
{
  "id": "new_role",
  "name": "新角色",
  "category": "townsfolk",
  "team": "good",
  "ability": "角色能力描述",
  "firstNight": { ... },
  "otherNights": { ... }
}
```

### 自定义推理规则

编辑 `engine/inference-engine.js`，在 `analyze()` 方法中添加新的检测函数。

### 添加策略建议

编辑 `engine/strategy-advisor.js`，为新角色添加专门的建议函数。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- Blood on the Clocktower 官方
- 血染钟楼中文社区

---

**注意**: 本项目仅用于学习和辅助游戏，不应影响游戏公平性。请在征得所有玩家同意的情况下使用。
