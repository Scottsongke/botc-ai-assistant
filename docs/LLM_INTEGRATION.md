# 🤖 大模型接入指南

## 概述

血染钟楼AI助手采用**混合架构**:
- **规则引擎** (已完成): 处理确定性逻辑推理
- **大模型** (待接入): 处理复杂推理和自然语言生成

## 为什么需要大模型？

### 规则引擎的局限

✅ 规则引擎擅长:
- 检测明显矛盾
- 计算基础概率
- 给出标准建议

❌ 规则引擎不擅长:
- 理解复杂的语义
- 处理模糊的情况
- 生成流畅的自然语言
- 综合多维度信息进行复杂推理

### 大模型的优势

✅ 大模型可以:
- 理解玩家发言的真实意图
- 综合分析复杂场景
- 给出更细致的策略建议
- 生成流畅的中文分析报告

## 免费开源大模型方案

### 方案1: 通义千问 Qwen (⭐推荐)

**优势:**
- ✅ 免费额度：500万tokens/天
- ✅ 中文能力强，适合血染钟楼
- ✅ 响应速度快
- ✅ API稳定

**注册地址:** https://dashscope.aliyun.com/

#### 快速接入代码

```javascript
// utils/llm-client.js

class QwenClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://dashscope.aliyuncs.com/api/v1';
  }

  async analyze(gameState, inferenceResult, probabilityResult) {
    const prompt = this.buildPrompt(gameState, inferenceResult, probabilityResult);

    const response = await fetch(`${this.baseURL}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        input: {
          messages: [
            {
              role: 'system',
              content: '你是血染钟楼游戏的顶级分析专家，精通逻辑推理和策略分析。'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        parameters: {
          temperature: 0.7,
          max_tokens: 2000
        }
      })
    });

    const data = await response.json();
    return this.parseResponse(data);
  }

  buildPrompt(gameState, inferenceResult, probabilityResult) {
    const topSuspects = probabilityResult.mostLikelyDemon.topSuspects.slice(0, 3);

    return `
# 游戏状态
- 剧本: ${gameState.gameConfig.script}
- 玩家数: ${gameState.players.length}
- 当前: 第${gameState.currentDay}天

# 存活玩家
${gameState.players.filter(p => p.alive).map(p =>
  `${p.name}(${p.seatNumber}号位) - ${p.claimedRole || '未跳身份'}`
).join('\n')}

# 已检测到的矛盾
${inferenceResult.contradictions.map((c, i) =>
  `${i+1}. ${c.message}`
).join('\n')}

# 恶魔嫌疑排名
${topSuspects.map((s, i) =>
  `${i+1}. ${s.playerName} - ${(s.demonProbability * 100).toFixed(1)}%`
).join('\n')}

# 我的角色
${gameState.players.find(p => p.isMe)?.myRole.type}

请分析:
1. 综合评估场上局势
2. 分析每个矛盾的可能原因
3. 给出恶魔最可能是谁，以及理由
4. 针对我的角色，给出今晚和明天的具体建议

请用中文回答，保持简洁清晰。
`;
  }

  parseResponse(data) {
    if (data.output && data.output.text) {
      return {
        analysis: data.output.text,
        tokensUsed: data.usage.total_tokens
      };
    }
    throw new Error('解析大模型响应失败');
  }
}

module.exports = QwenClient;
```

#### 使用示例

```javascript
// main.js 中集成

const QwenClient = require('./utils/llm-client.js');

class BOTCAssistant {
  constructor() {
    // ... 原有代码

    // 初始化大模型客户端
    const apiKey = process.env.QWEN_API_KEY;
    if (apiKey) {
      this.llmClient = new QwenClient(apiKey);
    }
  }

  async analyze(gameState) {
    // ... 原有分析代码

    // 如果有大模型，进行深度分析
    let llmAnalysis = null;
    if (this.llmClient) {
      console.log('🤖 步骤4: 大模型深度分析...');
      llmAnalysis = await this.llmClient.analyze(
        gameState,
        inferenceResult,
        probabilityResult
      );
    }

    return {
      inference: inferenceResult,
      probability: probabilityResult,
      strategy: strategyAdvice,
      llmAnalysis: llmAnalysis,  // 新增
      summary: this.generateSummary(...)
    };
  }
}
```

### 方案2: DeepSeek

**优势:**
- ✅ 新用户500万tokens免费
- ✅ 推理能力强
- ✅ API兼容OpenAI格式

**注册地址:** https://www.deepseek.com/

#### 接入代码

```javascript
class DeepSeekClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.deepseek.com/v1';
  }

  async analyze(gameState, inferenceResult, probabilityResult) {
    const prompt = this.buildPrompt(gameState, inferenceResult, probabilityResult);

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是血染钟楼游戏的分析专家。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    return {
      analysis: data.choices[0].message.content,
      tokensUsed: data.usage.total_tokens
    };
  }

  // buildPrompt 方法与Qwen相同
}
```

### 方案3: 本地部署 Ollama (完全免费)

**优势:**
- ✅ 完全免费，无限调用
- ✅ 数据隐私安全
- ✅ 无网络延迟

**劣势:**
- ❌ 需要服务器有足够资源（推荐8GB+ RAM）
- ❌ 模型质量可能略低于云端

#### 安装步骤

```bash
# 1. 安装 Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. 下载模型（推荐Qwen2.5-7B）
ollama pull qwen2.5:7b

# 3. 启动服务
ollama serve
```

#### 接入代码

```javascript
class OllamaClient {
  constructor() {
    this.baseURL = 'http://localhost:11434';
  }

  async analyze(gameState, inferenceResult, probabilityResult) {
    const prompt = this.buildPrompt(gameState, inferenceResult, probabilityResult);

    const response = await fetch(`${this.baseURL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen2.5:7b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7
        }
      })
    });

    const data = await response.json();
    return {
      analysis: data.response,
      tokensUsed: data.eval_count
    };
  }
}
```

## 混合架构设计

### 最佳实践：规则引擎 + 大模型

```javascript
class HybridAnalysisEngine {
  constructor() {
    this.ruleEngine = new InferenceEngine(...);
    this.probabilityCalc = new ProbabilityCalculator(...);
    this.strategyAdvisor = new StrategyAdvisor(...);
    this.llmClient = new QwenClient(apiKey);
  }

  async analyze(gameState) {
    // 第1层：规则引擎快速分析（免费+快速）
    const ruleAnalysis = this.ruleEngine.analyze(gameState);
    const probabilities = this.probabilityCalc.calculate(gameState, ruleAnalysis);

    // 第2层：判断是否需要大模型
    const needsDeepAnalysis = this.shouldUseLL M(ruleAnalysis, probabilities);

    if (!needsDeepAnalysis) {
      // 简单场景：只用规则引擎
      return {
        type: 'rule_based',
        analysis: ruleAnalysis,
        probabilities: probabilities,
        cost: 0
      };
    }

    // 第3层：复杂场景调用大模型
    const llmAnalysis = await this.llmClient.analyze(
      gameState,
      ruleAnalysis,
      probabilities
    );

    return {
      type: 'hybrid',
      ruleAnalysis: ruleAnalysis,
      probabilities: probabilities,
      llmAnalysis: llmAnalysis,
      cost: llmAnalysis.tokensUsed
    };
  }

  shouldUseLLM(ruleAnalysis, probabilities) {
    // 条件1：有高置信度矛盾
    if (ruleAnalysis.contradictions.filter(c => c.severity === 'high').length > 0) {
      return true;
    }

    // 条件2：恶魔嫌疑不明确（top3概率接近）
    const top3 = probabilities.mostLikelyDemon.topSuspects.slice(0, 3);
    if (top3[0].probability - top3[2].probability < 0.2) {
      return true;
    }

    // 条件3：游戏进入终局
    const aliveCount = gameState.players.filter(p => p.alive).length;
    if (aliveCount <= 4) {
      return true;
    }

    return false;
  }
}
```

### Token 使用优化

```javascript
class PromptOptimizer {
  // 增量式Prompt：只发送变化的信息
  buildIncrementalPrompt(gameState, lastAnalysis) {
    const changes = this.detectChanges(gameState, lastAnalysis);

    return `
基于上次分析，新增变化：

# 新的死亡
${changes.newDeaths.join(', ')}

# 新的跳身份
${changes.newClaims.map(c => `${c.player}跳${c.role}`).join(', ')}

# 新的矛盾
${changes.newContradictions.join(', ')}

请基于这些新信息，更新你的判断。
    `;
  }

  // 信息压缩：只保留关键信息
  compressGameState(gameState) {
    return {
      key_events: gameState.events.filter(e => e.importance > 7),
      contradictions: gameState.contradictions,
      top_suspects: gameState.suspects.slice(0, 3)
    };
  }
}
```

## Prompt 工程

### 系统Prompt模板

```
你是血染钟楼游戏的顶级分析专家，拥有以下能力：

1. 角色知识：精通所有剧本的角色能力和互动关系
2. 逻辑推理：能发现信息矛盾，构建推理链
3. 概率分析：基于贝叶斯定理计算身份概率
4. 策略规划：根据局势给出最优行动建议

分析原则：
- 考虑醉酒/下毒可能性
- 识别伪跳和真跳
- 评估信息来源可信度
- 权衡多种假设的可能性

输出格式：
1. 局势综述（2-3句话）
2. 关键矛盾分析
3. 恶魔身份推断（含概率和理由）
4. 具体行动建议

要求：简洁、清晰、可执行
```

### 分析请求Prompt模板

```
游戏状态：
- 剧本：${script}
- 玩家：${playerCount}人
- 当前：第${day}天

我的角色：${myRole}
我的信息：${myInfo}

已知跳身份：
${claims}

检测到的矛盾：
${contradictions}

恶魔嫌疑（规则引擎计算）：
${suspects}

请分析：
1. 综合评估：当前局势对善良/邪恶阵营是否有利？
2. 矛盾解释：每个矛盾最可能的原因是什么？
3. 恶魔推断：你认为谁是恶魔？概率多少？理由是什么？
4. 行动建议：
   - 今晚我应该如何使用能力？
   - 明天我应该如何发言/投票？
   - 需要注意什么风险？
```

## 成本估算

### 通义千问

- 模型：qwen-plus
- 价格：免费额度500万tokens/天
- 单次分析：约1000-2000 tokens
- 每天可分析：2500-5000次游戏

### DeepSeek

- 模型：deepseek-chat
- 价格：0.001元/1000 tokens
- 单次分析成本：约0.001-0.002元
- 100次游戏：约0.1-0.2元

### 本地Ollama

- 成本：硬件成本（服务器）
- 使用成本：0
- 适合：大量使用场景

## 下一步实施

### Phase 1: 基础接入（1周）

1. [ ] 注册通义千问账号，获取API Key
2. [ ] 创建 `utils/llm-client.js`
3. [ ] 在 `main.js` 中集成
4. [ ] 测试基本调用

### Phase 2: Prompt优化（1周）

1. [ ] 设计系统Prompt
2. [ ] 优化分析请求Prompt
3. [ ] 实现增量式Prompt
4. [ ] 测试不同场景的效果

### Phase 3: 混合架构（1周）

1. [ ] 实现判断逻辑（何时调用大模型）
2. [ ] 优化Token使用
3. [ ] 添加缓存机制
4. [ ] 性能测试

### Phase 4: 生产化（1周）

1. [ ] 错误处理
2. [ ] 限流保护
3. [ ] 日志记录
4. [ ] 监控告警

## 总结

**推荐方案：**
1. **开发阶段**: Ollama本地部署（免费，方便调试）
2. **测试阶段**: DeepSeek（便宜，性能好）
3. **生产阶段**: 通义千问（免费额度大，稳定）

**混合架构优势：**
- 80%场景用规则引擎（免费+快速）
- 20%复杂场景用大模型（精准+深度）
- 成本可控，性能最优

开始接入吧！🚀
