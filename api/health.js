/**
 * Vercel Serverless Function - 健康检查
 * 路径：/api/health
 */

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    llmEnabled: !!process.env.DASHSCOPE_API_KEY,
    platform: 'Vercel Serverless'
  });
};
