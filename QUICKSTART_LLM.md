# 🚀 快速开始 - 通义千问大模型接入

## 5分钟快速测试

### 第1步：获取API Key（2分钟）

1. 访问：https://dashscope.aliyun.com/
2. 注册/登录阿里云账号
3. 进入"API-KEY管理"
4. 创建新的API Key
5. 复制API Key（格式：`sk-xxxxxx`）

⚠️ **免费额度**：500万tokens/天，足够日常使用！

### 第2步：配置API Key（30秒）

```bash
cd /home/mini/血染钟楼/botc-ai-assistant

# 复制配置文件
cp .env.example .env

# 编辑配置文件，填入你的API Key
nano .env
```

在 `.env` 文件中填入：

```env
DASHSCOPE_API_KEY=sk-你的实际API-Key
```

保存并退出（Ctrl+O, Enter, Ctrl+X）

### 第3步：安装依赖（1分钟）

```bash
npm install
```

### 第4步：测试大模型（1分钟）

```bash
node test/test-llm.js
```

如果成功，会看到：

```
╔════════════════════════════════════════════════════════════╗
║       测试通义千问大模型接入                               ║
╚════════════════════════════════════════════════════════════╝

✅ API Key已配置
✅ 通义千问客户端初始化成功

=== 测试1: 简单对话 ===
✅ 简单对话测试成功
回复: 血染钟楼是一款社交推理桌游...

=== 测试2: 完整游戏分析 ===
✅ 游戏分析测试成功 (耗时: 2345ms)

--- AI 分析结果 ---
（这里会显示完整的AI分析）
--- 结束 ---

使用 tokens:
  输入: 856
  输出: 432
  总计: 1288

✅ 结果已保存到: test/test-llm-result.json
```

### 第5步：启动后端服务（30秒）

```bash
npm run server
```

看到以下输出说明成功：

```
╔════════════════════════════════════════════════════════════╗
║       血染钟楼 AI 助手 - 后端服务                         ║
╚════════════════════════════════════════════════════════════╝

🚀 服务已启动: http://localhost:3000
🧠 大模型状态: ✅ 已启用
```

### 第6步：测试API接口（可选）

打开新终端，测试健康检查：

```bash
curl http://localhost:3000/api/health
```

应该返回：

```json
{
  "status": "ok",
  "timestamp": "2025-11-17T...",
  "llmEnabled": true
}
```

测试完整分析：

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d @test/test-game-scenario.json \
  | json_pp
```

---

## 🎯 接下来做什么？

### 方案A: 继续本地开发

1. 修改 `miniprogram/api.js` 中的API地址为 `http://localhost:3000/api`
2. 使用微信开发者工具测试小程序
3. 完善小程序界面

### 方案B: 部署到服务器

查看详细部署指南：`docs/LLM_DEPLOYMENT_GUIDE.md`

简要步骤：
1. 购买服务器（推荐腾讯云轻量，50元/月）
2. 安装Node.js
3. 上传代码
4. 使用PM2守护进程
5. 配置Nginx反向代理
6. 配置HTTPS证书
7. 在微信小程序中配置服务器域名

### 方案C: 使用Vercel免费部署

1. 推送代码到GitHub
2. 在Vercel导入仓库
3. 配置环境变量 `DASHSCOPE_API_KEY`
4. 一键部署

⚠️ **注意**：Vercel免费版有请求限制，适合测试和轻量使用。

---

## 📱 微信小程序快速接入

### 前置条件

- 已注册微信小程序
- 后端服务已部署（有HTTPS域名）

### 步骤

1. **配置服务器域名**

   在微信公众平台：
   - 进入"开发" -> "开发管理" -> "开发设置"
   - 在"服务器域名"添加：`https://your-domain.com`

2. **复制小程序代码**

   ```bash
   # 复制以下文件到你的小程序项目
   miniprogram/api.js
   miniprogram/pages/analyze/*
   ```

3. **修改API地址**

   编辑 `api.js`：
   ```javascript
   const API_BASE_URL = 'https://your-domain.com/api';
   ```

4. **在小程序中调用**

   ```javascript
   import { analyzeGame } from '../../api.js';

   // 调用分析
   const result = await analyzeGame(gameState);
   ```

---

## ❓ 常见问题

### Q: 提示"API Key未配置"

A: 检查 `.env` 文件是否存在，API Key是否正确。

```bash
# 查看配置
cat .env

# 应该显示
DASHSCOPE_API_KEY=sk-你的Key
```

### Q: 测试失败，提示网络错误

A: 可能的原因：

1. 没有安装依赖：`npm install`
2. API Key无效：检查是否正确复制
3. 网络问题：检查能否访问阿里云

### Q: Token消耗速度

A: 单次完整分析约1000-2000 tokens，免费额度500万/天，可以分析2500-5000次。

节省Token的方法：
- 使用 `/api/analyze/quick` 接口（不调用大模型）
- 切换到 `qwen-turbo` 模型（更便宜）
- 缩短Prompt内容

### Q: 微信小程序调用失败

A: 检查清单：

- [ ] 后端服务是否使用HTTPS（必须）
- [ ] 是否在微信公众平台配置了服务器域名
- [ ] API地址是否正确
- [ ] 是否开启了"不校验合法域名"（仅开发调试）

---

## 📊 成本估算

| 项目 | 成本 |
|------|------|
| 通义千问API | 免费（500万tokens/天） |
| 服务器（可选） | 0-50元/月 |
| 域名（可选） | 50元/年 |
| SSL证书 | 免费（Let's Encrypt） |

**总计**：可以完全免费使用（本地开发+Vercel部署）

---

## 🎉 完成！

现在你已经成功接入了通义千问大模型！

**系统架构**：

```
微信小程序
    ↓
你的后端服务 (Express)
    ↓
规则引擎 + 概率计算 + 策略建议
    ↓
通义千问大模型（深度分析）
    ↓
返回完整分析结果
```

**能力**：
- ✅ 逻辑矛盾检测
- ✅ 概率计算
- ✅ 策略建议
- ✅ AI深度分析（新增）

享受AI辅助的血染钟楼之旅吧！🎭
