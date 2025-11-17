/**
 * Vercel Serverless Function - 快速分析（不调用大模型）
 * 路径：/api/quick
 */

const InferenceEngine = require('../engine/inference-engine.js');
const ProbabilityCalculator = require('../engine/probability-calculator.js');

const rolesData = require('../data/trouble-brewing-roles.json');
const setupRules = require('../data/game-setup-rules.json');

const inferenceEngine = new InferenceEngine(rolesData, setupRules);
const probabilityCalculator = new ProbabilityCalculator(rolesData, setupRules);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const gameState = req.body;

    const inferenceResult = inferenceEngine.analyze(gameState);
    const probabilityResult = probabilityCalculator.calculateProbabilities(
      gameState,
      inferenceResult
    );

    res.status(200).json({
      success: true,
      data: {
        inference: inferenceResult,
        probability: probabilityResult
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
