/**
 * 血染钟楼 AI 推理引擎核心模块
 * 负责逻辑推理、矛盾检测、信息验证
 */

class InferenceEngine {
  constructor(rolesData, setupRules) {
    this.rolesData = rolesData;
    this.setupRules = setupRules;
    this.contradictions = [];
    this.deductions = [];
  }

  /**
   * 主分析入口
   * @param {Object} gameState - 完整游戏状态
   * @returns {Object} 分析结果
   */
  analyze(gameState) {
    console.log('=== 开始推理分析 ===');

    // 1. 清空之前的推理结果
    this.contradictions = [];
    this.deductions = [];

    // 2. 验证游戏设置
    this.validateGameSetup(gameState);

    // 3. 检测信息矛盾
    this.detectContradictions(gameState);

    // 4. 分析跳身份情况
    this.analyzeIdentityClaims(gameState);

    // 5. 分析死亡模式
    this.analyzeDeathPattern(gameState);

    // 6. 分析投票行为
    this.analyzeVotingBehavior(gameState);

    // 7. 生成推理结论
    const deductions = this.generateDeductions(gameState);

    return {
      contradictions: this.contradictions,
      deductions: deductions,
      suspiciousPlayers: this.identifySuspiciousPlayers(gameState),
      keyInsights: this.generateKeyInsights(gameState)
    };
  }

  /**
   * 验证游戏设置是否合理
   */
  validateGameSetup(gameState) {
    const playerCount = gameState.players.length;
    const expectedConfig = this.setupRules.gameSetupRules.playerCountConfig[playerCount];

    if (!expectedConfig) {
      this.contradictions.push({
        type: 'setup_invalid',
        severity: 'high',
        message: `玩家数量 ${playerCount} 不在标准配置范围内`
      });
      return;
    }

    // 检查外来者数量是否异常
    const outsiderClaims = gameState.allClaims.filter(c => {
      const role = this.getRoleData(c.claimedRole);
      return role && role.category === 'outsider';
    });

    if (outsiderClaims.length > expectedConfig.outsiders + 2) {
      this.deductions.push({
        type: 'baron_likely',
        confidence: 0.8,
        message: `场上外来者数量异常多，很可能有男爵在场`,
        evidence: `预期外来者${expectedConfig.outsiders}人，实际跳身份${outsiderClaims.length}人`
      });
    }
  }

  /**
   * 检测信息矛盾
   */
  detectContradictions(gameState) {
    const claims = gameState.allClaims;

    // 检测1: 同一角色多人跳
    this.detectRoleDuplicates(claims);

    // 检测2: 信息内容矛盾
    this.detectInfoContradictions(gameState);

    // 检测3: 占卜师信息矛盾
    this.detectFortuneTellerContradictions(gameState);

    // 检测4: 共情者数字矛盾
    this.detectEmpathContradictions(gameState);
  }

  /**
   * 检测同一角色多人跳
   */
  detectRoleDuplicates(claims) {
    const roleCounts = {};

    claims.forEach(claim => {
      if (!roleCounts[claim.claimedRole]) {
        roleCounts[claim.claimedRole] = [];
      }
      roleCounts[claim.claimedRole].push(claim.player);
    });

    Object.keys(roleCounts).forEach(role => {
      if (roleCounts[role].length > 1) {
        const roleData = this.getRoleData(role);

        // 外来者可能因为男爵而有多个，其他角色不行
        if (roleData && roleData.category !== 'outsider') {
          this.contradictions.push({
            type: 'duplicate_role',
            severity: 'high',
            role: role,
            players: roleCounts[role],
            message: `${roleCounts[role].join('、')} 都跳${role}，至少${roleCounts[role].length - 1}人在说谎`,
            implication: '这些玩家中至少有一个是邪恶阵营'
          });

          this.deductions.push({
            type: 'evil_in_group',
            confidence: 0.95,
            message: `${roleCounts[role].join('、')}中至少有${roleCounts[role].length - 1}人是邪恶阵营`,
            evidence: `同一角色只能有1个（除非醉酒/下毒）`
          });
        }
      }
    });
  }

  /**
   * 检测占卜师信息矛盾
   */
  detectFortuneTellerContradictions(gameState) {
    const ftClaims = gameState.allClaims.filter(c => c.claimedRole === '占卜师');

    if (ftClaims.length === 0) return;

    // 如果有多个占卜师，交叉验证他们的信息
    ftClaims.forEach((ft1, i) => {
      ftClaims.slice(i + 1).forEach(ft2 => {
        // 检查是否验过相同的两人组合
        if (ft1.info && ft2.info) {
          const overlaps = this.findOverlappingChecks(ft1.info, ft2.info);
          overlaps.forEach(overlap => {
            if (overlap.result1 !== overlap.result2) {
              this.contradictions.push({
                type: 'fortune_teller_conflict',
                severity: 'high',
                players: [ft1.player, ft2.player],
                message: `${ft1.player}和${ft2.player}的占卜师信息矛盾`,
                detail: `关于${overlap.targets}的验人结果不一致`,
                implication: '至少一人在说谎、被下毒或被醉酒'
              });
            }
          });
        }
      });
    });

    // 检查占卜师验出的恶魔是否还活着
    ftClaims.forEach(ft => {
      if (ft.info) {
        ft.info.forEach(check => {
          if (check.result === 'has_demon') {
            const targets = check.targets;
            const deadTargets = targets.filter(t => {
              const player = gameState.players.find(p => p.id === t);
              return player && !player.alive;
            });

            if (deadTargets.length === targets.length) {
              this.contradictions.push({
                type: 'demon_already_dead',
                severity: 'medium',
                message: `${ft.player}声称${targets.join('或')}中有恶魔，但他们都已死亡`,
                implication: `${ft.player}可能是假占卜师、被下毒，或验出的是红鲱鱼`
              });
            }
          }
        });
      }
    });
  }

  /**
   * 检测共情者数字矛盾
   */
  detectEmpathContradictions(gameState) {
    const empathClaims = gameState.allClaims.filter(c => c.claimedRole === '共情者');

    empathClaims.forEach(empath => {
      if (!empath.info || !empath.seatNumber) return;

      empath.info.forEach(nightInfo => {
        const night = nightInfo.night;
        const evilCount = nightInfo.evilCount;

        // 获取该夜共情者的邻居
        const neighbors = this.getNeighbors(empath.seatNumber, gameState, night);

        if (neighbors.length < 2) {
          this.contradictions.push({
            type: 'empath_insufficient_neighbors',
            severity: 'low',
            message: `${empath.player}在第${night}夜邻居不足2人，共情者信息异常`,
            implication: '可能是假共情者或记录错误'
          });
        }

        // 检查数字是否在合理范围
        if (evilCount < 0 || evilCount > 2) {
          this.contradictions.push({
            type: 'empath_invalid_number',
            severity: 'high',
            message: `${empath.player}声称第${night}夜共情者数字是${evilCount}，但只能是0、1或2`,
            implication: '明显的逻辑错误'
          });
        }
      });
    });
  }

  /**
   * 分析跳身份情况
   */
  analyzeIdentityClaims(gameState) {
    const claims = gameState.allClaims;
    const alivePlayers = gameState.players.filter(p => p.alive);

    // 统计跳身份的类型分布
    const categoryCount = {
      townsfolk: 0,
      outsider: 0,
      minion: 0,
      demon: 0,
      unclaimed: alivePlayers.length
    };

    claims.forEach(claim => {
      const role = this.getRoleData(claim.claimedRole);
      if (role) {
        categoryCount[role.category]++;
        categoryCount.unclaimed--;
      }
    });

    // 如果未跳身份的人很少，可能隐藏着恶魔
    if (categoryCount.unclaimed <= 2 && categoryCount.demon === 0) {
      this.deductions.push({
        type: 'demon_hiding',
        confidence: 0.7,
        message: `大部分玩家已跳身份，但无人跳恶魔相关强势镇民`,
        evidence: `${categoryCount.unclaimed}人未跳身份，恶魔可能在其中`
      });
    }

    // 如果跳镇民的人过多
    const expectedTownsfolk = this.setupRules.gameSetupRules.playerCountConfig[gameState.players.length].townsfolk;
    if (categoryCount.townsfolk > expectedTownsfolk + 2) {
      this.deductions.push({
        type: 'excessive_townsfolk_claims',
        confidence: 0.8,
        message: `跳镇民的人数(${categoryCount.townsfolk})超过预期(${expectedTownsfolk})`,
        evidence: '邪恶阵营可能在伪跳镇民'
      });
    }
  }

  /**
   * 分析死亡模式
   */
  analyzeDeathPattern(gameState) {
    const deaths = gameState.nightDeaths;

    if (deaths.length === 0) return;

    // 分析每夜死亡人数
    deaths.forEach((nightDeath, index) => {
      const night = index + 1;
      const deathCount = nightDeath.players.length;

      if (deathCount === 0) {
        this.deductions.push({
          type: 'no_death_night',
          confidence: 0.6,
          night: night,
          message: `第${night}夜无人死亡`,
          possibilities: [
            '僧侣保护成功',
            '恶魔击中士兵',
            '特殊情况（恶魔自杀传承）'
          ]
        });
      } else if (deathCount > 1) {
        this.deductions.push({
          type: 'multiple_deaths',
          confidence: 0.7,
          night: night,
          message: `第${night}夜有${deathCount}人死亡`,
          possibilities: [
            '可能有其他击杀机制',
            '可能是处决+夜晚击杀',
            '守鸦人等特殊角色'
          ]
        });
      }
    });

    // 分析死亡的角色类型
    const deadRoles = gameState.players
      .filter(p => !p.alive && p.deathNight)
      .map(p => p.knownRole)
      .filter(r => r);

    const hasStrongTownsfolk = deadRoles.some(role =>
      ['占卜师', '调查员', '洗衣妇'].includes(role)
    );

    if (hasStrongTownsfolk) {
      this.deductions.push({
        type: 'strong_roles_targeted',
        confidence: 0.6,
        message: '强力镇民被优先击杀',
        implication: '恶魔在针对性清除信息位'
      });
    }
  }

  /**
   * 分析投票行为
   */
  analyzeVotingBehavior(gameState) {
    const votes = gameState.dayVotes;

    if (!votes || votes.length === 0) return;

    votes.forEach(voteRecord => {
      const { day, nominations } = voteRecord;

      nominations.forEach(nom => {
        const { nominator, nominee, voters, executed } = nom;

        // 分析谁没投票
        const nonVoters = gameState.players
          .filter(p => p.alive || p.votesRemaining > 0)
          .filter(p => !voters.includes(p.id))
          .map(p => p.id);

        if (nonVoters.length > 0 && voters.length >= gameState.players.filter(p => p.alive).length / 2) {
          this.deductions.push({
            type: 'suspicious_non_voters',
            confidence: 0.4,
            day: day,
            message: `${nonVoters.join('、')}在关键投票中未投票`,
            nominee: nominee,
            implication: '可能是保护队友或策略性保留票数'
          });
        }

        // 如果被处决玩家是强势镇民
        if (executed) {
          const executedPlayer = gameState.players.find(p => p.id === nominee);
          if (executedPlayer && executedPlayer.claimedRole) {
            const role = this.getRoleData(executedPlayer.claimedRole);
            if (role && role.category === 'townsfolk' &&
                ['占卜师', '调查员', '共情者'].includes(executedPlayer.claimedRole)) {
              this.deductions.push({
                type: 'strong_townsfolk_executed',
                confidence: 0.6,
                day: day,
                message: `第${day}天处决了${nominee}（${executedPlayer.claimedRole}）`,
                voters: voters,
                implication: '投票者中可能有邪恶玩家推波助澜'
              });
            }
          }
        }
      });
    });
  }

  /**
   * 生成推理结论
   */
  generateDeductions(gameState) {
    // 已经在各个分析函数中添加了推理结论
    return this.deductions;
  }

  /**
   * 识别可疑玩家
   */
  identifySuspiciousPlayers(gameState) {
    const suspicionScores = {};

    gameState.players.forEach(player => {
      suspicionScores[player.id] = {
        player: player.id,
        name: player.name,
        score: 0,
        reasons: []
      };
    });

    // 根据矛盾增加可疑度
    this.contradictions.forEach(contra => {
      if (contra.players) {
        contra.players.forEach(playerId => {
          if (suspicionScores[playerId]) {
            suspicionScores[playerId].score += 20;
            suspicionScores[playerId].reasons.push(contra.message);
          }
        });
      }
    });

    // 未跳身份的玩家轻微可疑
    const unclaimed = gameState.players.filter(p =>
      !gameState.allClaims.find(c => c.player === p.id)
    );
    unclaimed.forEach(p => {
      suspicionScores[p.id].score += 5;
      suspicionScores[p.id].reasons.push('未跳身份');
    });

    // 按可疑度排序
    const sorted = Object.values(suspicionScores)
      .sort((a, b) => b.score - a.score)
      .filter(s => s.score > 0);

    return sorted;
  }

  /**
   * 生成关键洞察
   */
  generateKeyInsights(gameState) {
    const insights = [];

    // 洞察1: 场上配置
    const playerCount = gameState.players.length;
    const config = this.setupRules.gameSetupRules.playerCountConfig[playerCount];
    if (config) {
      insights.push({
        type: 'game_setup',
        message: `${playerCount}人局标准配置：${config.townsfolk}镇民 + ${config.outsiders}外来者 + ${config.minions}爪牙 + ${config.demons}恶魔`
      });
    }

    // 洞察2: 矛盾总数
    if (this.contradictions.length > 0) {
      insights.push({
        type: 'contradictions_summary',
        message: `发现${this.contradictions.length}处信息矛盾，需要重点关注`
      });
    }

    // 洞察3: 推理结论总数
    if (this.deductions.length > 0) {
      const highConfidence = this.deductions.filter(d => d.confidence >= 0.7);
      insights.push({
        type: 'deductions_summary',
        message: `生成${this.deductions.length}条推理，其中${highConfidence.length}条高可信度`
      });
    }

    return insights;
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
   * 辅助方法：获取邻居
   */
  getNeighbors(seatNumber, gameState, night) {
    const alivePlayers = gameState.players.filter(p => {
      // 检查该玩家在指定夜晚是否存活
      return !p.deathNight || p.deathNight > night;
    });

    const totalSeats = gameState.players.length;
    const leftSeat = (seatNumber - 1 + totalSeats) % totalSeats;
    const rightSeat = (seatNumber + 1) % totalSeats;

    return alivePlayers.filter(p =>
      p.seatNumber === leftSeat || p.seatNumber === rightSeat
    );
  }

  /**
   * 辅助方法：查找占卜师重叠验人
   */
  findOverlappingChecks(info1, info2) {
    const overlaps = [];

    info1.forEach(check1 => {
      info2.forEach(check2 => {
        if (check1.night === check2.night) {
          const targets1 = check1.targets.sort().join(',');
          const targets2 = check2.targets.sort().join(',');

          if (targets1 === targets2) {
            overlaps.push({
              night: check1.night,
              targets: check1.targets,
              result1: check1.result,
              result2: check2.result
            });
          }
        }
      });
    });

    return overlaps;
  }

  /**
   * 辅助方法：检测信息内容矛盾
   */
  detectInfoContradictions(gameState) {
    // TODO: 实现更复杂的信息交叉验证逻辑
    // 例如：洗衣妇说P1是占卜师，但P1跳了共情者
    const claims = gameState.allClaims;

    claims.forEach(claim => {
      if (claim.info && claim.info.about) {
        // 洗衣妇/图书馆员/调查员给出的信息
        claim.info.about.forEach(info => {
          const targetPlayer = info.player;
          const claimedRoleByInfo = info.possibleRole;

          // 查找目标玩家的自述身份
          const targetClaim = claims.find(c => c.player === targetPlayer);
          if (targetClaim && targetClaim.claimedRole !== claimedRoleByInfo) {
            this.contradictions.push({
              type: 'info_claim_mismatch',
              severity: 'high',
              message: `${claim.player}(${claim.claimedRole})说${targetPlayer}可能是${claimedRoleByInfo}，但${targetPlayer}跳了${targetClaim.claimedRole}`,
              implication: '至少一方在说谎或被醉酒/下毒'
            });
          }
        });
      }
    });
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InferenceEngine;
}
