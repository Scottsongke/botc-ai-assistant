#!/usr/bin/env node

/**
 * 血染钟楼 AI 助手 - 主程序入口
 */

const fs = require('fs');
const path = require('path');

// 导入模块
const InferenceEngine = require('./engine/inference-engine.js');
const ProbabilityCalculator = require('./engine/probability-calculator.js');
const StrategyAdvisor = require('./engine/strategy-advisor.js');

class BOTCAssistant {
  constructor() {
    // 加载数据
    this.rolesData = this.loadJSON('./data/trouble-brewing-roles.json');
    this.setupRules = this.loadJSON('./data/game-setup-rules.json');

    // 初始化引擎
    this.inferenceEngine = new InferenceEngine(this.rolesData, this.setupRules);
    this.probabilityCalculator = new ProbabilityCalculator(this.rolesData, this.setupRules);
    this.strategyAdvisor = new StrategyAdvisor(this.rolesData, this.setupRules);
  }

  loadJSON(filePath) {
    try {
      const fullPath = path.join(__dirname, filePath);
      const data = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`加载文件失败: ${filePath}`, error.message);
      process.exit(1);
    }
  }

  /**
   * 分析游戏状态并生成建议
   * @param {Object} gameState - 游戏状态
   * @returns {Object} 完整分析结果
   */
  analyze(gameState) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║       血染钟楼 AI 助手 - 游戏分析                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`📊 游戏信息: ${this.rolesData.scriptName} | ${gameState.players.length}人局 | 第${gameState.currentDay}天\n`);

    // 步骤1: 推理分析
    console.log('🔍 步骤1: 逻辑推理分析...');
    const inferenceResult = this.inferenceEngine.analyze(gameState);

    // 步骤2: 概率计算
    console.log('📈 步骤2: 概率计算...');
    const probabilityResult = this.probabilityCalculator.calculateProbabilities(
      gameState,
      inferenceResult
    );

    // 步骤3: 策略建议
    console.log('💡 步骤3: 生成策略建议...');
    const myPlayer = gameState.players.find(p => p.isMe);
    const myRole = myPlayer ? myPlayer.myRole : null;

    let strategyAdvice = null;
    if (myRole) {
      strategyAdvice = this.strategyAdvisor.generateAdvice(
        gameState,
        myRole,
        inferenceResult,
        probabilityResult
      );
    }

    // 整合结果
    const result = {
      inference: inferenceResult,
      probability: probabilityResult,
      strategy: strategyAdvice,
      summary: this.generateSummary(inferenceResult, probabilityResult, strategyAdvice)
    };

    return result;
  }

  /**
   * 生成分析摘要
   */
  generateSummary(inferenceResult, probabilityResult, strategyAdvice) {
    return {
      contradictionsCount: inferenceResult.contradictions.length,
      deductionsCount: inferenceResult.deductions.length,
      topDemonSuspect: probabilityResult.mostLikelyDemon.mostLikely,
      confidence: probabilityResult.confidence,
      criticalAdvice: strategyAdvice ? strategyAdvice.immediate.filter(a => a.priority === 'critical') : []
    };
  }

  /**
   * 打印分析结果
   */
  printAnalysis(result) {
    console.log('\n' + '='.repeat(60));
    console.log('📋 分析结果摘要');
    console.log('='.repeat(60) + '\n');

    // 矛盾信息
    if (result.inference.contradictions.length > 0) {
      console.log('⚠️  发现的矛盾:');
      result.inference.contradictions.forEach((c, i) => {
        console.log(`  ${i + 1}. [${c.severity}] ${c.message}`);
        if (c.implication) {
          console.log(`     → ${c.implication}`);
        }
      });
      console.log('');
    }

    // 推理结论
    if (result.inference.deductions.length > 0) {
      console.log('🧠 推理结论 (高可信度):');
      const highConfidence = result.inference.deductions.filter(d => d.confidence >= 0.7);
      highConfidence.slice(0, 5).forEach((d, i) => {
        console.log(`  ${i + 1}. [${(d.confidence * 100).toFixed(0)}%] ${d.message}`);
      });
      console.log('');
    }

    // 恶魔嫌疑
    console.log('🎯 恶魔嫌疑排名:');
    result.probability.mostLikelyDemon.topSuspects.slice(0, 3).forEach((suspect, i) => {
      console.log(`  ${i + 1}. ${suspect.playerName} - ${(suspect.demonProbability * 100).toFixed(1)}% 概率`);
      if (suspect.evidence && suspect.evidence.length > 0) {
        console.log(`     证据: ${suspect.evidence.slice(0, 2).map(e => e.description).join('; ')}`);
      }
    });
    console.log('');

    // 策略建议
    if (result.strategy) {
      console.log('💡 AI 建议:');

      if (result.strategy.immediate.length > 0) {
        console.log('\n  【立即行动】');
        result.strategy.immediate.forEach(advice => {
          console.log(`  ✓ ${advice.action}`);
          if (advice.reason) console.log(`    理由: ${advice.reason}`);
        });
      }

      if (result.strategy.tonight.length > 0) {
        console.log('\n  【今晚能力使用】');
        result.strategy.tonight.forEach(advice => {
          console.log(`  ✓ ${advice.action}`);
          if (advice.reason) console.log(`    理由: ${advice.reason}`);
        });
      }

      if (result.strategy.tomorrow.length > 0) {
        console.log('\n  【明天白天策略】');
        result.strategy.tomorrow.slice(0, 3).forEach(advice => {
          console.log(`  ✓ ${advice.action}`);
          if (advice.reason) console.log(`    理由: ${advice.reason}`);
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 整体置信度: ${result.probability.confidence.interpretation}`);
    console.log('='.repeat(60) + '\n');
  }

  /**
   * 运行测试场景
   */
  runTest() {
    console.log('🧪 运行测试场景...\n');

    const testScenario = this.loadJSON('./test/test-game-scenario.json');

    // 分析测试场景
    const result = this.analyze(testScenario);

    // 打印结果
    this.printAnalysis(result);

    // 保存结果
    this.saveResult(result, './test/test-result.json');

    console.log('✅ 测试完成！结果已保存到 test/test-result.json\n');
  }

  /**
   * 保存结果到文件
   */
  saveResult(result, filePath) {
    try {
      const fullPath = path.join(__dirname, filePath);
      fs.writeFileSync(fullPath, JSON.stringify(result, null, 2), 'utf8');
    } catch (error) {
      console.error('保存结果失败:', error.message);
    }
  }
}

// 主程序
if (require.main === module) {
  const assistant = new BOTCAssistant();

  // 检查命令行参数
  const args = process.argv.slice(2);

  if (args.includes('--test')) {
    // 运行测试
    assistant.runTest();
  } else if (args.includes('--help')) {
    // 显示帮助
    console.log(`
血染钟楼 AI 助手

用法:
  node main.js --test           运行测试场景
  node main.js --help           显示帮助信息
  node main.js <game-file.json> 分析指定的游戏状态文件

示例:
  node main.js --test
  node main.js ./test/my-game.json
    `);
  } else if (args.length > 0) {
    // 分析指定文件
    const gameFile = args[0];
    const gameState = assistant.loadJSON(gameFile);
    const result = assistant.analyze(gameState);
    assistant.printAnalysis(result);
  } else {
    // 默认运行测试
    assistant.runTest();
  }
}

module.exports = BOTCAssistant;
