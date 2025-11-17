/**
 * 分析页面 - 微信小程序示例
 * 展示如何调用后端API进行游戏分析
 */

import { analyzeGame, quickAnalyze } from '../../api.js';

Page({
  data: {
    // 游戏状态
    gameState: null,

    // 分析结果
    analysisResult: null,

    // 加载状态
    loading: false,

    // 是否使用大模型
    useLLM: true,

    // 错误信息
    error: null
  },

  onLoad() {
    // 页面加载时，可以从上一页传入游戏状态
    // 或者从本地存储读取
    this.loadGameState();
  },

  /**
   * 加载游戏状态
   */
  loadGameState() {
    // 从本地存储读取
    const savedState = wx.getStorageSync('currentGame');
    if (savedState) {
      this.setData({ gameState: savedState });
    } else {
      // 如果没有，可以使用测试数据
      this.loadTestData();
    }
  },

  /**
   * 加载测试数据（用于演示）
   */
  loadTestData() {
    const testData = {
      gameConfig: {
        script: 'trouble-brewing',
        playerCount: 7,
        currentDay: 2,
        currentNight: 2
      },
      players: [
        {
          id: 'P1',
          name: '玩家1',
          seatNumber: 0,
          alive: true,
          isMe: true,
          myRole: {
            type: '占卜师',
            category: 'townsfolk',
            team: 'good'
          }
        },
        {
          id: 'P2',
          name: '玩家2',
          seatNumber: 1,
          alive: true,
          claimedRole: '占卜师'
        }
        // ... 更多玩家
      ],
      allClaims: [
        {
          player: 'P2',
          claimedRole: '占卜师',
          day: 1
        }
      ],
      nightDeaths: [
        { night: 1, players: ['P3'] }
      ]
    };

    this.setData({ gameState: testData });
  },

  /**
   * 切换是否使用大模型
   */
  toggleLLM(e) {
    this.setData({
      useLLM: e.detail.value
    });
  },

  /**
   * 开始分析
   */
  async startAnalysis() {
    const { gameState, useLLM } = this.data;

    if (!gameState) {
      wx.showToast({
        title: '请先录入游戏信息',
        icon: 'none'
      });
      return;
    }

    // 显示加载状态
    this.setData({
      loading: true,
      error: null,
      analysisResult: null
    });

    wx.showLoading({
      title: useLLM ? 'AI分析中...' : '快速分析中...'
    });

    try {
      let result;

      if (useLLM) {
        // 完整分析（规则引擎 + 大模型）
        result = await analyzeGame(gameState);
      } else {
        // 快速分析（仅规则引擎）
        result = await quickAnalyze(gameState);
      }

      // 分析成功
      if (result.success) {
        this.setData({
          analysisResult: result.data,
          loading: false
        });

        wx.hideLoading();
        wx.showToast({
          title: '分析完成',
          icon: 'success'
        });

        // 保存分析结果到本地
        wx.setStorageSync('lastAnalysis', result.data);
      } else {
        throw new Error(result.message || '分析失败');
      }

    } catch (error) {
      console.error('分析失败:', error);

      this.setData({
        loading: false,
        error: error.message || '分析失败，请重试'
      });

      wx.hideLoading();
      wx.showToast({
        title: error.message || '分析失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 复制分析结果
   */
  copyResult() {
    const { analysisResult } = this.data;

    if (!analysisResult) return;

    // 格式化结果为文本
    let text = '=== 血染钟楼 AI 分析结果 ===\n\n';

    // 矛盾信息
    if (analysisResult.inference?.contradictions?.length > 0) {
      text += '⚠️ 发现的矛盾:\n';
      analysisResult.inference.contradictions.forEach((c, i) => {
        text += `${i + 1}. ${c.message}\n`;
      });
      text += '\n';
    }

    // 恶魔嫌疑
    if (analysisResult.probability?.mostLikelyDemon) {
      text += '🎯 恶魔嫌疑排名:\n';
      const suspects = analysisResult.probability.mostLikelyDemon.topSuspects;
      suspects.slice(0, 3).forEach((s, i) => {
        text += `${i + 1}. ${s.playerName} - ${(s.demonProbability * 100).toFixed(1)}%\n`;
      });
      text += '\n';
    }

    // 大模型分析
    if (analysisResult.llmAnalysis?.analysis) {
      text += '🤖 AI 深度分析:\n';
      text += analysisResult.llmAnalysis.analysis;
      text += '\n';
    }

    // 复制到剪贴板
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        });
      }
    });
  },

  /**
   * 分享分析结果
   */
  onShareAppMessage() {
    return {
      title: '血染钟楼 AI 助手 - 分析结果',
      path: '/pages/analyze/analyze',
      imageUrl: '/images/share.png'
    };
  }
});
