/**
 * Vercel Serverless Function - 游戏分析
 * 路径：/api/analyze
 */

const InferenceEngine = require('../engine/inference-engine.js');
const ProbabilityCalculator = require('../engine/probability-calculator.js');
const StrategyAdvisor = require('../engine/strategy-advisor.js');
const QwenClient = require('../utils/qwen-client.js');

const rolesData = require('../data/trouble-brewing-roles.json');
const setupRules = require('../data/game-setup-rules.json');

// 初始化引擎（全局复用）
const inferenceEngine = new InferenceEngine(rolesData, setupRules);
const probabilityCalculator = new ProbabilityCalculator(rolesData, setupRules);
const strategyAdvisor = new StrategyAdvisor(rolesData, setupRules);

// 初始化大模型客户端
let qwenClient = null;
if (process.env.DASHSCOPE_API_KEY) {
  qwenClient = new QwenClient(process.env.DASHSCOPE_API_KEY);
}

module.exports = async (req, res) => {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const gameState = req.body;

    if (!gameState || !gameState.players) {
      return res.status(400).json({
        error: '无效的游戏状态数据',
        message: '请提供完整的 gameState 对象'
      });
    }

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

    // 第4步：大模型深度分析（如果配置了API Key）
    let llmAnalysis = null;
    if (qwenClient) {
      try {
        llmAnalysis = await qwenClient.analyzeGame(
          gameState,
          inferenceResult,
          probabilityResult
        );
      } catch (llmError) {
        console.error('大模型调用失败:', llmError.message);
        llmAnalysis = {
          error: '大模型分析失败',
          message: llmError.message
        };
      }
    }

    // 返回结果
    res.status(200).json({
      success: true,
      data: {
        inference: inferenceResult,
        probability: probabilityResult,
        strategy: strategyAdvice,
        llmAnalysis: llmAnalysis,
        summary: {
          contradictionsCount: inferenceResult.contradictions.length,
          deductionsCount: inferenceResult.deductions.length,
          topDemonSuspect: probabilityResult.mostLikelyDemon.mostLikely,
          confidence: probabilityResult.confidence
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('分析错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      message: error.message
    });
  }
};
