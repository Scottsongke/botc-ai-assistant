/**
 * 通义千问 API 客户端
 * 文档: https://help.aliyun.com/zh/dashscope/developer-reference/api-details
 */

class QwenClient {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('通义千问 API Key 未配置！请在环境变量中设置 DASHSCOPE_API_KEY');
    }

    this.apiKey = apiKey;
    this.baseURL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
    this.model = 'qwen-plus'; // 或 qwen-turbo (更快更便宜)
  }

  /**
   * 调用通义千问进行游戏分析
   * @param {Object} gameState - 游戏状态
   * @param {Object} inferenceResult - 推理结果
   * @param {Object} probabilityResult - 概率结果
   * @returns {Object} 大模型分析结果
   */
  async analyzeGame(gameState, inferenceResult, probabilityResult) {
    const prompt = this.buildPrompt(gameState, inferenceResult, probabilityResult);

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-SSE': 'disable' // 禁用流式输出
        },
        body: JSON.stringify({
          model: this.model,
          input: {
            messages: [
              {
                role: 'system',
                content: this.getSystemPrompt()
              },
              {
                role: 'user',
                content: prompt
              }
            ]
          },
          parameters: {
            temperature: 0.7,
            top_p: 0.8,
            max_tokens: 1500,
            result_format: 'message'
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`通义千问API调用失败: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return this.parseResponse(data);

    } catch (error) {
      console.error('通义千问API调用错误:', error);
      throw error;
    }
  }

  /**
   * 系统Prompt - 定义AI的角色和能力
   */
  getSystemPrompt() {
    return `你是血染钟楼游戏的顶级分析专家，拥有以下能力：

1. 角色知识：精通所有剧本的角色能力和互动关系
2. 逻辑推理：能发现信息矛盾，构建推理链
3. 概率分析：基于证据计算身份概率
4. 策略规划：根据局势给出最优行动建议

分析原则：
- 考虑醉酒/下毒可能性
- 识别伪跳和真跳
- 评估信息来源可信度
- 权衡多种假设的可能性

输出要求：
- 简洁清晰，重点突出
- 分点列出，便于阅读
- 给出具体可执行的建议
- 标注关键信息和风险点`;
  }

  /**
   * 构建分析请求的Prompt
   */
  buildPrompt(gameState, inferenceResult, probabilityResult) {
    const myPlayer = gameState.players.find(p => p.isMe);
    const myRole = myPlayer ? myPlayer.myRole : null;
    const alivePlayers = gameState.players.filter(p => p.alive);
    const topSuspects = probabilityResult.mostLikelyDemon.topSuspects.slice(0, 3);

    // 构建简洁的Prompt
    let prompt = `# 游戏状态
- 剧本：暗流涌动
- 玩家数：${gameState.players.length}人
- 当前：第${gameState.currentDay || '未知'}天
- 存活：${alivePlayers.length}人

`;

    // 我的角色
    if (myRole) {
      prompt += `# 我的角色
${myRole.type}（${myRole.team === 'good' ? '善良阵营' : '邪恶阵营'}）

`;
    }

    // 玩家跳身份情况
    if (gameState.allClaims && gameState.allClaims.length > 0) {
      prompt += `# 玩家跳身份\n`;
      gameState.allClaims.forEach(claim => {
        const player = gameState.players.find(p => p.id === claim.player);
        if (player) {
          prompt += `- ${player.name}：跳${claim.claimedRole}\n`;
        }
      });
      prompt += '\n';
    }

    // 检测到的矛盾
    if (inferenceResult.contradictions && inferenceResult.contradictions.length > 0) {
      prompt += `# 检测到的矛盾\n`;
      inferenceResult.contradictions.slice(0, 5).forEach((c, i) => {
        prompt += `${i + 1}. ${c.message}\n`;
      });
      prompt += '\n';
    }

    // 恶魔嫌疑排名
    if (topSuspects && topSuspects.length > 0) {
      prompt += `# AI计算的恶魔嫌疑（基于概率）\n`;
      topSuspects.forEach((s, i) => {
        prompt += `${i + 1}. ${s.playerName} - ${(s.demonProbability * 100).toFixed(1)}%\n`;
      });
      prompt += '\n';
    }

    // 死亡记录
    if (gameState.nightDeaths && gameState.nightDeaths.length > 0) {
      prompt += `# 死亡记录\n`;
      gameState.nightDeaths.forEach(night => {
        if (night.players && night.players.length > 0) {
          prompt += `第${night.night}夜：${night.players.join('、')} 死亡\n`;
        }
      });
      prompt += '\n';
    }

    // 请求分析
    prompt += `请分析：

1. **局势评估**（1-2句话）：当前局势对善良/邪恶阵营是否有利？

2. **关键矛盾分析**（针对最重要的1-2个矛盾）：
   - 最可能的原因是什么？
   - 谁在说谎的概率更大？

3. **恶魔身份推断**：
   - 你认为谁是恶魔？
   - 概率是多少？
   - 主要理由是什么？（3条以内）

4. **行动建议**（针对我的角色${myRole ? myRole.type : ''}）：
   - 今晚能力使用建议
   - 明天发言/跳身份策略
   - 投票建议
   - 需要警惕的风险

请用中文回答，保持简洁，每部分不超过3-4行。`;

    return prompt;
  }

  /**
   * 解析通义千问的响应
   */
  parseResponse(data) {
    if (!data.output || !data.output.choices || data.output.choices.length === 0) {
      throw new Error('通义千问返回数据格式异常');
    }

    const message = data.output.choices[0].message;
    const content = message.content;

    // 提取使用的token数
    const tokensUsed = data.usage ? {
      inputTokens: data.usage.input_tokens || 0,
      outputTokens: data.usage.output_tokens || 0,
      totalTokens: data.usage.total_tokens || 0
    } : null;

    return {
      analysis: content,
      tokensUsed: tokensUsed,
      model: this.model,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 简化版分析（用于对话场景）
   */
  async simpleChat(userMessage, context = null) {
    try {
      const messages = [
        {
          role: 'system',
          content: '你是血染钟楼游戏助手，用简洁的中文回答玩家问题。'
        }
      ];

      if (context) {
        messages.push({
          role: 'system',
          content: `当前游戏背景：${JSON.stringify(context, null, 2)}`
        });
      }

      messages.push({
        role: 'user',
        content: userMessage
      });

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          input: { messages },
          parameters: {
            temperature: 0.7,
            max_tokens: 800
          }
        })
      });

      const data = await response.json();
      return this.parseResponse(data);

    } catch (error) {
      console.error('简单对话调用错误:', error);
      throw error;
    }
  }
}

// Node.js 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QwenClient;
}

// 浏览器环境导出
if (typeof window !== 'undefined') {
  window.QwenClient = QwenClient;
}
