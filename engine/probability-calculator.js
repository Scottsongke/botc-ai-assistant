/**
 * 血染钟楼 AI 概率计算模块
 * 基于贝叶斯推理计算玩家身份概率
 */

class ProbabilityCalculator {
  constructor(rolesData, setupRules) {
    this.rolesData = rolesData;
    this.setupRules = setupRules;
  }

  /**
   * 计算所有玩家的身份概率
   * @param {Object} gameState - 游戏状态
   * @param {Object} inferenceResult - 推理引擎结果
   * @returns {Object} 概率分析结果
   */
  calculateProbabilities(gameState, inferenceResult) {
    console.log('=== 开始概率计算 ===');

    // 1. 初始化概率分布
    const playerProbabilities = this.initializeProbabilities(gameState);

    // 2. 根据跳身份更新概率
    this.updateByIdentityClaims(playerProbabilities, gameState);

    // 3. 根据矛盾更新概率
    this.updateByContradictions(playerProbabilities, inferenceResult.contradictions);

    // 4. 根据行为模式更新概率
    this.updateByBehavior(playerProbabilities, gameState);

    // 5. 根据信息验证更新概率
    this.updateByInformationValidation(playerProbabilities, gameState);

    // 6. 归一化概率
    this.normalizeProbabilities(playerProbabilities);

    // 7. 计算阵营概率
    const teamProbabilities = this.calculateTeamProbabilities(playerProbabilities);

    // 8. 识别最可能的恶魔
    const mostLikelyDemon = this.identifyMostLikelyDemon(playerProbabilities, gameState);

    return {
      playerProbabilities,
      teamProbabilities,
      mostLikelyDemon,
      confidence: this.calculateOverallConfidence(playerProbabilities)
    };
  }

  /**
   * 初始化概率分布（均匀分布）
   */
  initializeProbabilities(gameState) {
    const playerCount = gameState.players.length;
    const config = this.setupRules.gameSetupRules.playerCountConfig[playerCount];

    if (!config) {
      console.error('无效的玩家数量');
      return {};
    }

    const probabilities = {};

    gameState.players.forEach(player => {
      // 根据游戏配置初始化概率
      const baseGoodProb = (config.townsfolk + config.outsiders) / playerCount;
      const baseEvilProb = (config.minions + config.demons) / playerCount;

      probabilities[player.id] = {
        playerId: player.id,
        playerName: player.name,
        seatNumber: player.seatNumber,
        alive: player.alive,

        // 阵营概率
        good: baseGoodProb,
        evil: baseEvilProb,

        // 具体角色概率（初始均匀分布）
        roles: this.initializeRoleProbabilities(config, playerCount),

        // 证据列表
        evidence: [],

        // 可信度
        credibility: 0.5
      };
    });

    return probabilities;
  }

  /**
   * 初始化角色概率
   */
  initializeRoleProbabilities(config, playerCount) {
    const roles = {};

    // 镇民概率
    const townsfolkProb = config.townsfolk / playerCount;
    this.rolesData.roles.townsfolk.forEach(role => {
      roles[role.name] = townsfolkProb / this.rolesData.roles.townsfolk.length;
    });

    // 外来者概率
    const outsiderProb = config.outsiders / playerCount;
    if (outsiderProb > 0) {
      this.rolesData.roles.outsiders.forEach(role => {
        roles[role.name] = outsiderProb / this.rolesData.roles.outsiders.length;
      });
    }

    // 爪牙概率
    const minionProb = config.minions / playerCount;
    if (minionProb > 0) {
      this.rolesData.roles.minions.forEach(role => {
        roles[role.name] = minionProb / this.rolesData.roles.minions.length;
      });
    }

    // 恶魔概率
    const demonProb = config.demons / playerCount;
    this.rolesData.roles.demons.forEach(role => {
      roles[role.name] = demonProb;
    });

    return roles;
  }

  /**
   * 根据跳身份更新概率
   */
  updateByIdentityClaims(playerProbabilities, gameState) {
    gameState.allClaims.forEach(claim => {
      const playerId = claim.player;
      const claimedRole = claim.claimedRole;

      if (!playerProbabilities[playerId]) return;

      const roleData = this.getRoleData(claimedRole);
      if (!roleData) return;

      // 跳某个角色，该角色概率大幅提升
      const currentProb = playerProbabilities[playerId].roles[claimedRole] || 0;
      playerProbabilities[playerId].roles[claimedRole] = Math.min(currentProb * 5, 0.8);

      // 同时更新阵营概率
      if (roleData.team === 'good') {
        playerProbabilities[playerId].good *= 1.5;
        playerProbabilities[playerId].evil *= 0.7;
      } else {
        // 很少有人会跳邪恶角色
        playerProbabilities[playerId].evil *= 1.2;
        playerProbabilities[playerId].good *= 0.8;
      }

      playerProbabilities[playerId].evidence.push({
        type: 'identity_claim',
        description: `跳了${claimedRole}`,
        impact: '+30% 该角色概率'
      });
    });
  }

  /**
   * 根据矛盾更新概率
   */
  updateByContradictions(playerProbabilities, contradictions) {
    contradictions.forEach(contra => {
      if (!contra.players) return;

      contra.players.forEach(playerId => {
        if (!playerProbabilities[playerId]) return;

        // 涉及矛盾的玩家，邪恶概率提升
        playerProbabilities[playerId].evil *= 1.4;
        playerProbabilities[playerId].good *= 0.7;

        playerProbabilities[playerId].evidence.push({
          type: 'contradiction',
          description: contra.message,
          impact: '+20% 邪恶概率'
        });
      });
    });
  }

  /**
   * 根据行为模式更新概率
   */
  updateByBehavior(playerProbabilities, gameState) {
    // 分析投票行为
    if (gameState.dayVotes && gameState.dayVotes.length > 0) {
      gameState.dayVotes.forEach(dayVote => {
        dayVote.nominations.forEach(nom => {
          const { nominator, nominee, voters, executed } = nom;

          // 如果处决了善良玩家，投票者中可能有恶魔
          if (executed) {
            const executedPlayer = gameState.players.find(p => p.id === nominee);
            if (executedPlayer && executedPlayer.claimedRole) {
              const roleData = this.getRoleData(executedPlayer.claimedRole);

              if (roleData && roleData.team === 'good' && roleData.category === 'townsfolk') {
                // 投票推掉强力镇民的人，邪恶概率略微提升
                voters.forEach(voterId => {
                  if (playerProbabilities[voterId]) {
                    playerProbabilities[voterId].evil *= 1.1;
                    playerProbabilities[voterId].good *= 0.95;
                  }
                });
              }
            }
          }
        });
      });
    }

    // 未跳身份的玩家
    const unclaimed = gameState.players.filter(p =>
      !gameState.allClaims.find(c => c.player === p.id)
    );

    unclaimed.forEach(player => {
      if (playerProbabilities[player.id]) {
        // 未跳身份可能是在隐藏（略微提升邪恶概率）
        playerProbabilities[player.id].evil *= 1.15;
        playerProbabilities[player.id].good *= 0.9;

        playerProbabilities[player.id].evidence.push({
          type: 'unclaimed',
          description: '未跳身份',
          impact: '+10% 邪恶概率'
        });
      }
    });
  }

  /**
   * 根据信息验证更新概率
   */
  updateByInformationValidation(playerProbabilities, gameState) {
    // 验证占卜师信息
    const fortuneTellers = gameState.allClaims.filter(c => c.claimedRole === '占卜师');

    fortuneTellers.forEach(ft => {
      if (!ft.info) return;

      let correctPredictions = 0;
      let totalPredictions = ft.info.length;

      ft.info.forEach(check => {
        // 验证占卜师的预测是否合理
        // 这里简化处理：如果占卜师验出的人后来行为可疑，则预测可能正确
        if (check.result === 'has_demon') {
          check.targets.forEach(targetId => {
            if (playerProbabilities[targetId] && playerProbabilities[targetId].evil > 0.6) {
              correctPredictions++;
            }
          });
        }
      });

      // 如果占卜师预测准确率高，提升其可信度
      if (totalPredictions > 0) {
        const accuracy = correctPredictions / totalPredictions;

        if (playerProbabilities[ft.player]) {
          if (accuracy > 0.5) {
            playerProbabilities[ft.player].good *= 1.3;
            playerProbabilities[ft.player].evil *= 0.7;
            playerProbabilities[ft.player].credibility = Math.min(accuracy, 0.9);
          } else {
            playerProbabilities[ft.player].good *= 0.8;
            playerProbabilities[ft.player].evil *= 1.2;
          }
        }
      }
    });
  }

  /**
   * 归一化概率（确保概率和为1）
   */
  normalizeProbabilities(playerProbabilities) {
    Object.keys(playerProbabilities).forEach(playerId => {
      const player = playerProbabilities[playerId];

      // 归一化阵营概率
      const total = player.good + player.evil;
      if (total > 0) {
        player.good /= total;
        player.evil /= total;
      }

      // 归一化角色概率
      const roleTotal = Object.values(player.roles).reduce((sum, prob) => sum + prob, 0);
      if (roleTotal > 0) {
        Object.keys(player.roles).forEach(role => {
          player.roles[role] /= roleTotal;
        });
      }
    });
  }

  /**
   * 计算阵营概率汇总
   */
  calculateTeamProbabilities(playerProbabilities) {
    const alivePlayers = Object.values(playerProbabilities).filter(p => p.alive);

    const expectedGood = alivePlayers.reduce((sum, p) => sum + p.good, 0);
    const expectedEvil = alivePlayers.reduce((sum, p) => sum + p.evil, 0);

    return {
      expectedGoodCount: expectedGood,
      expectedEvilCount: expectedEvil,
      confidence: this.calculateTeamConfidence(alivePlayers)
    };
  }

  /**
   * 识别最可能的恶魔
   */
  identifyMostLikelyDemon(playerProbabilities, gameState) {
    const demonProbabilities = [];

    Object.values(playerProbabilities).forEach(player => {
      if (!player.alive) return;

      // 计算该玩家是恶魔的总概率
      let demonProb = 0;
      this.rolesData.roles.demons.forEach(demon => {
        demonProb += player.roles[demon.name] || 0;
      });

      demonProbabilities.push({
        playerId: player.playerId,
        playerName: player.playerName,
        seatNumber: player.seatNumber,
        demonProbability: demonProb * player.evil,
        evidence: player.evidence
      });
    });

    // 按恶魔概率排序
    demonProbabilities.sort((a, b) => b.demonProbability - a.demonProbability);

    return {
      topSuspects: demonProbabilities.slice(0, 3),
      mostLikely: demonProbabilities[0]
    };
  }

  /**
   * 计算整体置信度
   */
  calculateOverallConfidence(playerProbabilities) {
    const confidenceScores = Object.values(playerProbabilities).map(p => {
      // 置信度基于概率的极化程度
      const polarization = Math.abs(p.good - 0.5) + Math.abs(p.evil - 0.5);
      return polarization;
    });

    const avgConfidence = confidenceScores.reduce((sum, c) => sum + c, 0) / confidenceScores.length;

    return {
      overall: avgConfidence,
      interpretation: this.interpretConfidence(avgConfidence)
    };
  }

  /**
   * 计算阵营判断置信度
   */
  calculateTeamConfidence(alivePlayers) {
    const highConfidencePlayers = alivePlayers.filter(p =>
      Math.abs(p.good - 0.5) > 0.3
    );

    return highConfidencePlayers.length / alivePlayers.length;
  }

  /**
   * 解释置信度
   */
  interpretConfidence(confidence) {
    if (confidence > 0.7) return '高 - 有明确证据支持判断';
    if (confidence > 0.4) return '中 - 有一定证据但不完全确定';
    return '低 - 信息不足，需要更多证据';
  }

  /**
   * 辅助方法：获取角色数据
   */
  getRoleData(roleName) {
    for (const category of ['townsfolk', 'outsiders', 'minions', 'demons']) {
      const role = this.rolesData.roles[category].find(r => r.name === roleName);
      if (role) return role;
    }
    return null;
  }

  /**
   * 生成概率报告（用于前端展示）
   */
  generateProbabilityReport(probabilities) {
    const report = {
      summary: `分析了${Object.keys(probabilities.playerProbabilities).length}名玩家`,
      topDemonSuspects: probabilities.mostLikelyDemon.topSuspects.map(s => ({
        player: s.playerName,
        probability: (s.demonProbability * 100).toFixed(1) + '%',
        keyEvidence: s.evidence.slice(0, 3).map(e => e.description)
      })),
      teamBalance: {
        expectedGood: probabilities.teamProbabilities.expectedGoodCount.toFixed(1),
        expectedEvil: probabilities.teamProbabilities.expectedEvilCount.toFixed(1)
      },
      confidence: probabilities.confidence.interpretation
    };

    return report;
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProbabilityCalculator;
}
