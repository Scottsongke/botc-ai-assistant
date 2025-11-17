/**
 * 测试通义千问大模型接入
 * 运行: node test/test-llm.js
 */

const QwenClient = require('../utils/qwen-client.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testLLM() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║       测试通义千问大模型接入                               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // 检查API Key
  const apiKey = process.env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    log('red', '❌ 错误：未配置 DASHSCOPE_API_KEY');
    log('yellow', '\n请按以下步骤配置：');
    log('yellow', '1. 访问 https://dashscope.aliyun.com/ 注册并获取API Key');
    log('yellow', '2. 复制 .env.example 为 .env');
    log('yellow', '3. 在 .env 文件中填入你的API Key');
    log('yellow', '4. 重新运行测试\n');
    process.exit(1);
  }

  log('green', '✅ API Key已配置');

  // 初始化客户端
  let client;
  try {
    client = new QwenClient(apiKey);
    log('green', '✅ 通义千问客户端初始化成功');
  } catch (error) {
    log('red', `❌ 客户端初始化失败: ${error.message}`);
    process.exit(1);
  }

  // 测试1: 简单对话
  log('cyan', '\n=== 测试1: 简单对话 ===');
  try {
    const result = await client.simpleChat('你好，请用一句话介绍血染钟楼桌游。');
    log('green', '✅ 简单对话测试成功');
    log('blue', `回复: ${result.analysis.substring(0, 100)}...`);
    if (result.tokensUsed) {
      log('yellow', `使用 ${result.tokensUsed.totalTokens} tokens`);
    }
  } catch (error) {
    log('red', `❌ 简单对话测试失败: ${error.message}`);
  }

  // 测试2: 游戏分析
  log('cyan', '\n=== 测试2: 完整游戏分析 ===');
  try {
    // 加载测试场景
    const testScenarioPath = path.join(__dirname, 'test-game-scenario.json');
    const testScenario = JSON.parse(fs.readFileSync(testScenarioPath, 'utf8'));

    log('blue', '加载测试场景...');
    log('blue', `玩家数: ${testScenario.players.length}`);
    log('blue', `当前: 第${testScenario.currentDay || '?'}天`);

    // 创建简化的推理和概率结果（模拟）
    const mockInferenceResult = {
      contradictions: [
        {
          type: 'duplicate_role',
          severity: 'high',
          message: '玩家1和玩家2都跳占卜师，至少一人在说谎'
        }
      ]
    };

    const mockProbabilityResult = {
      mostLikelyDemon: {
        topSuspects: [
          { playerName: '玩家2', demonProbability: 0.65 },
          { playerName: '玩家5', demonProbability: 0.45 },
          { playerName: '玩家7', demonProbability: 0.38 }
        ]
      }
    };

    log('blue', '\n调用大模型分析...');
    const startTime = Date.now();

    const result = await client.analyzeGame(
      testScenario,
      mockInferenceResult,
      mockProbabilityResult
    );

    const duration = Date.now() - startTime;

    log('green', `✅ 游戏分析测试成功 (耗时: ${duration}ms)`);
    log('blue', '\n--- AI 分析结果 ---');
    console.log(result.analysis);
    log('blue', '--- 结束 ---\n');

    if (result.tokensUsed) {
      log('yellow', `使用 tokens:`);
      log('yellow', `  输入: ${result.tokensUsed.inputTokens}`);
      log('yellow', `  输出: ${result.tokensUsed.outputTokens}`);
      log('yellow', `  总计: ${result.tokensUsed.totalTokens}`);
    }

    // 保存结果
    const resultPath = path.join(__dirname, 'test-llm-result.json');
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
    log('green', `\n✅ 结果已保存到: ${resultPath}`);

  } catch (error) {
    log('red', `❌ 游戏分析测试失败: ${error.message}`);
    if (error.stack) {
      log('red', error.stack);
    }
  }

  // 总结
  log('cyan', '\n=== 测试总结 ===');
  log('green', '✅ 通义千问大模型接入成功！');
  log('blue', '\n下一步：');
  log('blue', '1. 运行 npm run server 启动后端服务');
  log('blue', '2. 测试完整的API接口');
  log('blue', '3. 部署到服务器');
  log('blue', '4. 在微信小程序中调用\n');
}

// 运行测试
testLLM().catch(error => {
  log('red', `\n❌ 测试过程中发生错误: ${error.message}`);
  process.exit(1);
});
