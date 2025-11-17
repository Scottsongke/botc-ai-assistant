/**
 * 微信小程序 API 封装
 * 用于调用后端服务
 */

// 配置你的后端服务地址
// 开发环境：本地地址
// 生产环境：部署后的服务器地址
const API_BASE_URL = 'http://localhost:3000/api';

// 生产环境请改为你的服务器地址
// const API_BASE_URL = 'https://your-domain.com/api';

/**
 * 通用请求方法
 */
function request(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}${url}`,
      method: method,
      data: data,
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject({
            code: res.statusCode,
            message: res.data.message || '请求失败'
          });
        }
      },
      fail: (err) => {
        reject({
          code: -1,
          message: '网络错误',
          error: err
        });
      }
    });
  });
}

/**
 * 完整游戏分析（规则引擎 + 大模型）
 * @param {Object} gameState - 游戏状态
 */
export function analyzeGame(gameState) {
  return request('/analyze', 'POST', gameState);
}

/**
 * 快速分析（仅规则引擎，不调用大模型）
 * @param {Object} gameState - 游戏状态
 */
export function quickAnalyze(gameState) {
  return request('/analyze/quick', 'POST', gameState);
}

/**
 * 对话接口（自由提问）
 * @param {String} message - 用户问题
 * @param {Object} context - 游戏上下文（可选）
 */
export function chat(message, context = null) {
  return request('/chat', 'POST', { message, context });
}

/**
 * 获取角色数据
 * @param {String} script - 剧本名称，如 'trouble-brewing'
 */
export function getRoles(script) {
  return request(`/roles/${script}`, 'GET');
}

/**
 * 获取游戏设置规则
 */
export function getSetupRules() {
  return request('/setup-rules', 'GET');
}

/**
 * 健康检查
 */
export function healthCheck() {
  return request('/health', 'GET');
}
