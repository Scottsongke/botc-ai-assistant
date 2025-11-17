/**
 * 血染钟楼 AI 助手 - 后端服务
 * 为微信小程序提供API接口
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// 导入核心模块
const InferenceEngine = require('../engine/inference-engine.js');
const ProbabilityCalculator = require('../engine/probability-calculator.js');
const StrategyAdvisor = require('../engine/strategy-advisor.js');
const QwenClient = require('../utils/qwen-client.js');

// 导入数据
const rolesData = require('../data/trouble-brewing-roles.json');
const setupRules = require('../data/game-setup-rules.json');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors()); // 允许跨域
app.use(express.json({ limit: '10mb' })); // 解析JSON请求体

// 初始化引擎
const inferenceEngine = new InferenceEngine(rolesData, setupRules);
const probabilityCalculator = new ProbabilityCalculator(rolesData, setupRules);
const strategyAdvisor = new StrategyAdvisor(rolesData, setupRules);

// 初始化大模型客户端
let qwenClient = null;
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;

if (DASHSCOPE_API_KEY) {
  qwenClient = new QwenClient(DASHSCOPE_API_KEY);
  console.log('✅ 通义千问API已配置');
} else {
  console.warn('⚠️  未配置通义千问API Key，大模型功能将不可用');
  console.warn('   请在 .env 文件中设置 DASHSCOPE_API_KEY');
}

// ==================== API 路由 ====================

/**
 * 健康检查
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    llmEnabled: !!qwenClient
  });
});

/**
 * 完整游戏分析 (规则引擎 + 大模型)
 * POST /api/analyze
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const gameState = req.body;

    // 验证请求数据
    if (!gameState || !gameState.players) {
      return res.status(400).json({
        error: '无效的游戏状态数据',
        message: '请提供完整的 gameState 对象'
      });
    }

    console.log(`[分析请求] ${gameState.players.length}人局, 第${gameState.currentDay || '?'}天`);

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

    // 第4步：大模型深度分析（可选）
    let llmAnalysis = null;
    if (qwenClient) {
      try {
        console.log('[大模型] 开始调用通义千问...');
        llmAnalysis = await qwenClient.analyzeGame(
          gameState,
          inferenceResult,
          probabilityResult
        );
        console.log(`[大模型] 分析完成，使用${llmAnalysis.tokensUsed?.totalTokens || 0} tokens`);
      } catch (llmError) {
        console.error('[大模型] 调用失败:', llmError.message);
        llmAnalysis = {
          error: '大模型分析失败',
          message: llmError.message
        };
      }
    }

    // 返回完整结果
    res.json({
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
    console.error('[分析错误]', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      message: error.message
    });
  }
});

/**
 * 仅规则引擎分析 (不调用大模型，更快)
 * POST /api/analyze/quick
 */
app.post('/api/analyze/quick', async (req, res) => {
  try {
    const gameState = req.body;

    const inferenceResult = inferenceEngine.analyze(gameState);
    const probabilityResult = probabilityCalculator.calculateProbabilities(
      gameState,
      inferenceResult
    );

    res.json({
      success: true,
      data: {
        inference: inferenceResult,
        probability: probabilityResult
      }
    });

  } catch (error) {
    console.error('[快速分析错误]', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 对话接口 (用户自由提问)
 * POST /api/chat
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({
        error: '缺少 message 参数'
      });
    }

    if (!qwenClient) {
      return res.status(503).json({
        error: '大模型服务未配置',
        message: '请联系管理员配置通义千问API Key'
      });
    }

    console.log(`[对话请求] ${message.substring(0, 50)}...`);

    const result = await qwenClient.simpleChat(message, context);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[对话错误]', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取角色数据
 * GET /api/roles/:script
 */
app.get('/api/roles/:script', (req, res) => {
  const script = req.params.script;

  if (script === 'trouble-brewing') {
    res.json({
      success: true,
      data: rolesData
    });
  } else {
    res.status(404).json({
      success: false,
      error: '剧本未找到',
      message: `暂不支持 ${script} 剧本`
    });
  }
});

/**
 * 获取游戏设置规则
 * GET /api/setup-rules
 */
app.get('/api/setup-rules', (req, res) => {
  res.json({
    success: true,
    data: setupRules
  });
});

// ==================== 错误处理 ====================

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    path: req.path
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('全局错误:', err);
  res.status(500).json({
    success: false,
    error: '服务器错误',
    message: err.message
  });
});

// ==================== 启动服务 ====================

app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║       血染钟楼 AI 助手 - 后端服务                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`🚀 服务已启动: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`🧠 大模型状态: ${qwenClient ? '✅ 已启用' : '❌ 未配置'}`);
  console.log('\n可用接口:');
  console.log('  POST /api/analyze       - 完整分析（规则引擎+大模型）');
  console.log('  POST /api/analyze/quick - 快速分析（仅规则引擎）');
  console.log('  POST /api/chat          - 对话接口');
  console.log('  GET  /api/roles/:script - 获取角色数据');
  console.log('  GET  /api/setup-rules   - 获取设置规则\n');
});

module.exports = app;
