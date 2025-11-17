/**
 * 血染钟楼 AI 策略建议系统
 * 根据游戏状态和分析结果给出行动建议
 */

class StrategyAdvisor {
  constructor(rolesData, setupRules) {
    this.rolesData = rolesData;
    this.setupRules = setupRules;
  }

  /**
   * 生成完整策略建议
   * @param {Object} gameState - 游戏状态
   * @param {Object} myRole - 我的角色信息
   * @param {Object} analysisResult - 推理分析结果
   * @param {Object} probabilityResult - 概率计算结果
   * @returns {Object} 策略建议
   */
  generateAdvice(gameState, myRole, analysisResult, probabilityResult) {
    console.log('=== 生成策略建议 ===');

    const advice = {
      immediate: [], // 立即行动
      tonight: [],   // 今晚能力使用
      tomorrow: [],  // 明天白天策略
      longTerm: []   // 长期策略
    };

    // 根据我的角色生成建议
    if (myRole.team === 'good') {
      this.generateGoodAdvice(advice, gameState, myRole, analysisResult, probabilityResult);
    } else {
      this.generateEvilAdvice(advice, gameState, myRole, analysisResult, probabilityResult);
    }

    // 生成投票建议
    this.generateVotingAdvice(advice, gameState, probabilityResult);

    // 生成发言建议
    this.generateClaimAdvice(advice, gameState, myRole, analysisResult);

    return advice;
  }

  /**
   * 生成善良阵营建议
   */
  generateGoodAdvice(advice, gameState, myRole, analysisResult, probabilityResult) {
    const roleData = this.getRoleData(myRole.type);
    if (!roleData) return;

    switch (myRole.type) {
      case '占卜师':
        this.adviceForFortuneTeller(advice, gameState, probabilityResult);
        break;

      case '共情者':
        this.adviceForEmpath(advice, gameState, probabilityResult);
        break;

      case '调查员':
        this.adviceForInvestigator(advice, gameState, probabilityResult);
        break;

      case '洗衣妇':
        this.adviceForWasherwoman(advice, gameState, analysisResult);
        break;

      case '图书馆员':
        this.adviceForLibrarian(advice, gameState, analysisResult);
        break;

      case '僧侣':
        this.adviceForMonk(advice, gameState, probabilityResult);
        break;

      case '猎手':
        this.adviceForSlayer(advice, gameState, probabilityResult);
        break;

      case '市长':
        this.adviceForMayor(advice, gameState, probabilityResult);
        break;

      default:
        // 通用善良玩家建议
        this.adviceForGenericGood(advice, gameState, myRole, probabilityResult);
    }
  }

  /**
   * 占卜师建议
   */
  adviceForFortuneTeller(advice, gameState, probabilityResult) {
    const topSuspects = probabilityResult.mostLikelyDemon.topSuspects;

    if (topSuspects.length > 0) {
      advice.tonight.push({
        type: 'ability_use',
        priority: 'high',
        action: `今晚验 ${topSuspects[0].playerName} 和 ${topSuspects[1]?.playerName || '其他可疑玩家'}`,
        reason: `${topSuspects[0].playerName} 恶魔概率 ${(topSuspects[0].demonProbability * 100).toFixed(1)}%`,
        detail: '优先验证最可疑的玩家，建立信息链'
      });
    }

    // 跳身份建议
    if (gameState.currentDay <= 2) {
      advice.tomorrow.push({
        type: 'claim_strategy',
        priority: 'medium',
        action: '考虑跳占卜师',
        reason: '占卜师是强力信息位，早期跳身份可以引导场上信息流',
        warning: '跳身份后可能成为恶魔目标，要警惕被下毒'
      });
    }

    advice.longTerm.push({
      type: 'information_gathering',
      priority: 'high',
      action: '记录每晚验人结果，寻找红鲱鱼',
      reason: '找到红鲱鱼后，你的信息会非常准确',
      tip: '如果某个善良玩家总是显示为恶魔，他可能是红鲱鱼'
    });
  }

  /**
   * 共情者建议
   */
  adviceForEmpath(advice, gameState, probabilityResult) {
    const myPlayer = gameState.players.find(p => p.isMe);
    if (!myPlayer) return;

    const neighbors = this.getNeighbors(myPlayer.seatNumber, gameState, gameState.currentNight);

    advice.immediate.push({
      type: 'information_analysis',
      priority: 'high',
      action: '分析邻居身份',
      detail: `你的邻居是 ${neighbors.map(n => n.name).join(' 和 ')}`,
      reason: '共情者数字是判断邻居阵营的关键线索'
    });

    advice.tomorrow.push({
      type: 'claim_strategy',
      priority: 'medium',
      action: '适时跳共情者，公开数字信息',
      reason: '共情者信息可以帮助确认邻居身份，建立信任链',
      warning: '如果数字对邻居不利，要注意他们可能反水'
    });
  }

  /**
   * 调查员建议
   */
  adviceForInvestigator(advice, gameState, probabilityResult) {
    advice.immediate.push({
      type: 'information_sharing',
      priority: 'high',
      action: '谨慎分享调查员信息',
      reason: '调查员直指爪牙，信息非常敏感',
      warning: '过早公开可能被间谍利用或被投毒者针对'
    });

    advice.tomorrow.push({
      type: 'claim_strategy',
      priority: 'low',
      action: '不建议第一天跳调查员',
      reason: '调查员容易成为恶魔首要目标',
      tip: '可以先观察被指认的玩家行为，再决定是否公开'
    });
  }

  /**
   * 洗衣妇/图书馆员建议
   */
  adviceForWasherwoman(advice, gameState, analysisResult) {
    advice.tomorrow.push({
      type: 'claim_strategy',
      priority: 'high',
      action: '首日可以跳洗衣妇公开信息',
      reason: '洗衣妇信息可以帮助建立信任链，是相对安全的跳身份',
      warning: '要警惕被下毒或信息本身就是错误的（醉酒）'
    });

    advice.immediate.push({
      type: 'information_validation',
      priority: 'high',
      action: '验证洗衣妇信息的真实性',
      reason: '观察被指认的玩家是否跳相应角色',
      tip: '如果信息矛盾，可能你被醉酒或下毒，或对方在说谎'
    });
  }

  adviceForLibrarian(advice, gameState, analysisResult) {
    advice.immediate.push({
      type: 'setup_analysis',
      priority: 'high',
      action: '根据图书馆员信息推断场上配置',
      reason: '如果得到0，说明场上可能有男爵或没有外来者',
      tip: '外来者数量异常是识别男爵的关键线索'
    });
  }

  /**
   * 僧侣建议
   */
  adviceForMonk(advice, gameState, probabilityResult) {
    const goodPlayers = Object.values(probabilityResult.playerProbabilities)
      .filter(p => p.alive && p.good > 0.6)
      .sort((a, b) => b.good - a.good);

    if (goodPlayers.length > 0) {
      advice.tonight.push({
        type: 'ability_use',
        priority: 'high',
        action: `今晚保护 ${goodPlayers[0].playerName}`,
        reason: `${goodPlayers[0].playerName} 善良概率 ${(goodPlayers[0].good * 100).toFixed(1)}%，可能是关键信息位`,
        tip: '不要每晚保护同一个人，要根据场上局势调整'
      });
    }

    advice.longTerm.push({
      type: 'ability_strategy',
      priority: 'medium',
      action: '僧侣很难证明自己，不要急于跳身份',
      reason: '即使保护成功也不知道，跳僧侣无法自证',
      tip: '可以终局时跳僧侣配合其他信息'
    });
  }

  /**
   * 猎手建议
   */
  adviceForSlayer(advice, gameState, probabilityResult) {
    const mostLikelyDemon = probabilityResult.mostLikelyDemon.mostLikely;

    if (mostLikelyDemon && mostLikelyDemon.demonProbability > 0.7) {
      advice.immediate.push({
        type: 'ability_use',
        priority: 'critical',
        action: `考虑对 ${mostLikelyDemon.playerName} 使用猎手技能`,
        reason: `${mostLikelyDemon.playerName} 恶魔概率 ${(mostLikelyDemon.demonProbability * 100).toFixed(1)}%`,
        warning: '猎手只有一次机会，失败会暴露身份！',
        tip: '建议恶魔概率≥80%时再开枪'
      });
    } else {
      advice.longTerm.push({
        type: 'ability_strategy',
        priority: 'high',
        action: '耐心等待，不要轻易使用猎手技能',
        reason: '目前没有明确的恶魔目标',
        tip: '收集更多信息，等待恶魔暴露'
      });
    }
  }

  /**
   * 市长建议
   */
  adviceForMayor(advice, gameState, probabilityResult) {
    const aliveCount = gameState.players.filter(p => p.alive).length;

    if (aliveCount <= 4) {
      advice.immediate.push({
        type: 'victory_condition',
        priority: 'critical',
        action: '关注市长胜利条件',
        reason: `当前${aliveCount}人存活，接近3人终局`,
        tip: '剩余3人时，如果当天不处决，市长可以直接获胜'
      });

      advice.tomorrow.push({
        type: 'voting_strategy',
        priority: 'critical',
        action: '如果剩3人，考虑不投票触发市长胜利',
        warning: '前提是确认自己还活着且没有被醉酒/下毒',
        tip: '邪恶阵营知道有市长时，会强推处决，要小心'
      });
    }

    advice.longTerm.push({
      type: 'claim_strategy',
      priority: 'low',
      action: '不要轻易跳市长',
      reason: '跳市长会让邪恶阵营警惕，终局一定会推人',
      tip: '市长是终局翻盘利器，要保密'
    });
  }

  /**
   * 通用善良玩家建议
   */
  adviceForGenericGood(advice, gameState, myRole, probabilityResult) {
    advice.immediate.push({
      type: 'general',
      priority: 'medium',
      action: '积极参与讨论，分享观察',
      reason: '即使没有能力，行为分析也能帮助好人阵营',
      tip: '观察谁在推动投票，谁在保护可疑玩家'
    });

    if (!gameState.allClaims.find(c => c.player === gameState.players.find(p => p.isMe)?.id)) {
      advice.tomorrow.push({
        type: 'claim_strategy',
        priority: 'low',
        action: '考虑跳身份或保持沉默',
        reason: '根据场上情况决定是否跳身份',
        tip: '如果有好的信息支撑，跳身份可以建立信任'
      });
    }
  }

  /**
   * 生成邪恶阵营建议
   */
  generateEvilAdvice(advice, gameState, myRole, analysisResult, probabilityResult) {
    // 邪恶阵营建议（暂时简化）
    advice.immediate.push({
      type: 'evil_strategy',
      priority: 'critical',
      action: '伪装成善良玩家',
      reason: '邪恶阵营的核心是隐藏和欺骗',
      tip: '选择一个镇民角色伪跳，编造合理的信息'
    });

    if (myRole.category === 'demon') {
      advice.tonight.push({
        type: 'demon_kill',
        priority: 'critical',
        action: '选择击杀目标',
        reason: '优先击杀强力信息位（占卜师、调查员等）',
        warning: '避免击中士兵或被僧侣保护的目标'
      });
    }
  }

  /**
   * 生成投票建议
   */
  generateVotingAdvice(advice, gameState, probabilityResult) {
    const mostLikelyDemon = probabilityResult.mostLikelyDemon.mostLikely;

    if (mostLikelyDemon) {
      advice.tomorrow.push({
        type: 'voting',
        priority: 'high',
        action: `建议投票给 ${mostLikelyDemon.playerName}`,
        reason: `根据分析，${mostLikelyDemon.playerName} 是恶魔概率最高（${(mostLikelyDemon.demonProbability * 100).toFixed(1)}%）`,
        confidence: mostLikelyDemon.demonProbability > 0.6 ? '高' : '中'
      });
    }

    // 终局投票建议
    const aliveCount = gameState.players.filter(p => p.alive).length;
    if (aliveCount <= 4) {
      advice.tomorrow.push({
        type: 'voting',
        priority: 'critical',
        action: '终局投票要慎重',
        reason: '剩余人数少，一次错误的投票可能导致失败',
        tip: '确认目标是恶魔后再投票，或考虑市长胜利条件'
      });
    }
  }

  /**
   * 生成发言建议
   */
  generateClaimAdvice(advice, gameState, myRole, analysisResult) {
    const contradictions = analysisResult.contradictions;
    const myId = gameState.players.find(p => p.isMe)?.id;

    // 如果我涉及矛盾，需要解释
    const myContradictions = contradictions.filter(c =>
      c.players && c.players.includes(myId)
    );

    if (myContradictions.length > 0) {
      advice.immediate.push({
        type: 'claim_defense',
        priority: 'critical',
        action: '需要解释信息矛盾',
        reason: '你涉及以下矛盾：' + myContradictions.map(c => c.message).join('; '),
        tip: '可以说自己被下毒/醉酒，或质疑对方'
      });
    }

    // 发言时机建议
    if (gameState.currentDay === 1) {
      advice.tomorrow.push({
        type: 'speaking',
        priority: 'medium',
        action: '首日发言要谨慎',
        reason: '首日信息有限，不要过早暴露关键信息',
        tip: '可以先听其他人发言，观察场上局势'
      });
    }
  }

  /**
   * 辅助方法
   */
  getRoleData(roleName) {
    for (const category of ['townsfolk', 'outsiders', 'minions', 'demons']) {
      const role = this.rolesData.roles[category].find(r => r.name === roleName);
      if (role) return role;
    }
    return null;
  }

  getNeighbors(seatNumber, gameState, night) {
    const totalSeats = gameState.players.length;
    const leftSeat = (seatNumber - 1 + totalSeats) % totalSeats;
    const rightSeat = (seatNumber + 1) % totalSeats;

    return gameState.players.filter(p =>
      (p.seatNumber === leftSeat || p.seatNumber === rightSeat) &&
      (!p.deathNight || p.deathNight > night)
    );
  }

  /**
   * 格式化建议输出
   */
  formatAdvice(advice) {
    const formatted = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };

    ['immediate', 'tonight', 'tomorrow', 'longTerm'].forEach(category => {
      advice[category].forEach(item => {
        const priority = item.priority || 'medium';
        formatted[priority].push({
          category: category,
          ...item
        });
      });
    });

    return formatted;
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StrategyAdvisor;
}
