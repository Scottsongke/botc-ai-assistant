/**
 * 微信小程序云函数 - 游戏分析
 * 使用方法：wx.cloud.callFunction({ name: 'analyze', data: gameState })
 */

// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 导入分析引擎（需要上传到云函数目录）
// 注意：需要把 engine/ 和 data/ 目录也上传到云函数
const InferenceEngine = require('./engine/inference-engine.js');
const ProbabilityCalculator = require('./engine/probability-calculator.js');
const StrategyAdvisor = require('./engine/strategy-advisor.js');

const rolesData = require('./data/trouble-brewing-roles.json');
const setupRules = require('./data/game-setup-rules.json');

// 初始化引擎
const inferenceEngine = new InferenceEngine(rolesData, setupRules);
const probabilityCalculator = new ProbabilityCalculator(rolesData, setupRules);
const strategyAdvisor = new StrategyAdvisor(rolesData, setupRules);

// 云函数入口函数
exports.main = async (event, context) => {
  const gameState = event;

  try {
    // 第1步：规则引擎分析
    const inferenceResult = inferenceEngine.analyze(gameState);

    // 第2步：概率计算
    const probabilityResult = probabilityCalculator.calculateProbabilities(
      gameState,
      inferenceResult
    );

    // 第3步：策略建议
    const myPlayer = gameState.players.find(p => p.isMe);
    const myRole = myPlayer ? myPlayer.myRole : null;

    let strategyAdvice = null;
    if (myRole) {
      strategyAdvice = strategyAdvisor.generateAdvice(
        gameState,
        myRole,
        inferenceResult,
        probabilityResult
      );
    }

    // 第4步：调用通义千问（可选）
    // 注意：需要在云函数环境变量中配置 DASHSCOPE_API_KEY
    let llmAnalysis = null;
    if (process.env.DASHSCOPE_API_KEY) {
      try {
        // 这里调用通义千问API
        // 因为云函数环境，直接使用 HTTP 请求
        const https = require('https');
        const options = {
          hostname: 'dashscope.aliyuncs.com',
          port: 443,
          path: '/api/v1/services/aigc/text-generation/generation',
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        };

        // 简化的Prompt
        const prompt = buildSimplePrompt(gameState, inferenceResult, probabilityResult);

        llmAnalysis = await callQwen(options, {
          model: 'qwen-plus',
          input: {
            messages: [
              { role: 'system', content: '你是血染钟楼分析专家' },
              { role: 'user', content: prompt }
            ]
          },
          parameters: {
            temperature: 0.7,
            max_tokens: 1000
          }
        });
      } catch (error) {
        console.error('大模型调用失败:', error);
        llmAnalysis = { error: error.message };
      }
    }

    // 返回结果
    return {
      success: true,
      data: {
        inference: inferenceResult,
        probability: probabilityResult,
        strategy: strategyAdvice,
        llmAnalysis: llmAnalysis,
        summary: {
          contradictionsCount: inferenceResult.contradictions.length,
          deductionsCount: inferenceResult.deductions.length,
          topDemonSuspect: probabilityResult.mostLikelyDemon.mostLikely
        }
      },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('分析错误:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 辅助函数：构建简化Prompt
function buildSimplePrompt(gameState, inferenceResult, probabilityResult) {
  const topSuspects = probabilityResult.mostLikelyDemon.topSuspects.slice(0, 3);

  let prompt = `分析血染钟楼游戏状态：
${gameState.players.length}人局，第${gameState.currentDay || '?'}天

矛盾：${inferenceResult.contradictions.slice(0, 2).map(c => c.message).join('; ')}

恶魔嫌疑：${topSuspects.map(s => `${s.playerName}(${(s.demonProbability * 100).toFixed(0)}%)`).join(', ')}

请简要分析并给出建议（100字以内）。`;

  return prompt;
}

// 辅助函数：调用通义千问
function callQwen(options, data) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.output && result.output.choices) {
            resolve({
              analysis: result.output.choices[0].message.content,
              tokensUsed: result.usage
            });
          } else {
            reject(new Error('API返回格式异常'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}
