# 🚀 通义千问大模型接入 - 完整部署指南

## 📋 目录

1. [准备工作](#准备工作)
2. [获取通义千问API Key](#获取api-key)
3. [本地开发测试](#本地开发测试)
4. [部署到服务器](#部署到服务器)
5. [微信小程序接入](#微信小程序接入)
6. [常见问题](#常见问题)

---

## 准备工作

### 系统要求

- Node.js >= 14.0.0
- npm 或 yarn

### 安装依赖

```bash
cd /home/mini/血染钟楼/botc-ai-assistant
npm install
```

---

## 获取API Key

### 第1步：注册阿里云账号

访问：https://dashscope.aliyun.com/

<details>
<summary>注册步骤（点击展开）</summary>

1. 访问 https://dashscope.aliyun.com/
2. 点击右上角"免费开通"
3. 使用手机号注册阿里云账号
4. 完成实名认证（个人认证即可）

</details>

### 第2步：创建API Key

1. 登录后，进入控制台
2. 在左侧菜单找到"API-KEY管理"
3. 点击"创建新的API-KEY"
4. 复制生成的API Key（类似：`sk-xxxxxxxxxxxxxx`）

⚠️ **重要**：API Key只会显示一次，务必保存好！

### 第3步：确认免费额度

- 免费额度：**500万 tokens/天**
- 模型：qwen-plus、qwen-turbo
- 足够日常使用（1次完整分析约1000-2000 tokens）

---

## 本地开发测试

### 第1步：配置API Key

```bash
# 复制配置文件
cp .env.example .env

# 编辑 .env 文件
nano .env
```

在 `.env` 文件中填入你的API Key：

```env
DASHSCOPE_API_KEY=sk-your-actual-api-key-here
PORT=3000
NODE_ENV=development
```

### 第2步：启动后端服务

```bash
npm run server

# 或者使用开发模式（自动重启）
npm run server:dev
```

看到以下输出说明启动成功：

```
╔════════════════════════════════════════════════════════════╗
║       血染钟楼 AI 助手 - 后端服务                         ║
╚════════════════════════════════════════════════════════════╝

🚀 服务已启动: http://localhost:3000
📊 健康检查: http://localhost:3000/api/health
🧠 大模型状态: ✅ 已启用
```

### 第3步：测试API

#### 测试健康检查

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

#### 测试完整分析

```bash
# 使用测试数据
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d @test/test-game-scenario.json
```

如果成功，会返回完整的分析结果，包括大模型的分析。

---

## 部署到服务器

### 方案A：腾讯云轻量应用服务器（推荐）

#### 第1步：购买服务器

- 配置：1核2GB内存即可
- 地域：就近选择
- 系统：Ubuntu 20.04
- 费用：约50元/月

#### 第2步：安装Node.js

```bash
# SSH连接到服务器后

# 安装nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# 安装Node.js
nvm install 18
nvm use 18

# 验证
node -v  # 应显示 v18.x.x
npm -v   # 应显示 9.x.x
```

#### 第3步：部署代码

```bash
# 克隆或上传代码到服务器
cd /home
git clone <your-repo-url>
# 或使用 scp 上传

cd botc-ai-assistant

# 安装依赖
npm install --production

# 配置环境变量
nano .env
# 填入你的API Key
```

#### 第4步：使用PM2守护进程

```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start backend/server.js --name botc-api

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs botc-api

# 查看状态
pm2 status
```

#### 第5步：配置Nginx反向代理

```bash
# 安装Nginx
sudo apt update
sudo apt install nginx

# 配置
sudo nano /etc/nginx/sites-available/botc-api
```

写入配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 改成你的域名

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/botc-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 第6步：配置HTTPS（推荐）

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取免费SSL证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

现在你的API可以通过 `https://your-domain.com/api/` 访问了！

### 方案B：Serverless部署（Vercel/Railway）

#### 使用Vercel（推荐）

1. 注册 https://vercel.com
2. 连接GitHub仓库
3. 在环境变量中配置 `DASHSCOPE_API_KEY`
4. 部署

**注意**：Vercel免费版有请求限制，适合轻量使用。

---

## 微信小程序接入

### 第1步：配置服务器域名

在微信公众平台设置：

1. 登录 https://mp.weixin.qq.com
2. 进入"开发" -> "开发管理" -> "开发设置"
3. 在"服务器域名"中添加你的后端地址：
   - request合法域名：`https://your-domain.com`

⚠️ **重要**：微信小程序只支持HTTPS，必须配置SSL证书！

### 第2步：修改API地址

编辑 `miniprogram/api.js`：

```javascript
// 开发环境（本地测试）
// const API_BASE_URL = 'http://localhost:3000/api';

// 生产环境（部署后的服务器）
const API_BASE_URL = 'https://your-domain.com/api';
```

### 第3步：测试小程序

1. 使用微信开发者工具打开小程序项目
2. 复制 `miniprogram` 目录下的代码到小程序项目
3. 在模拟器或真机测试

---

## 常见问题

### Q1: 提示"API Key未配置"

**A**: 检查 `.env` 文件是否存在，API Key是否正确填写。

```bash
# 查看环境变量
cat .env

# 重启服务
pm2 restart botc-api
```

### Q2: 调用大模型失败

**A**: 可能的原因：

1. API Key无效或过期
2. 超过免费额度
3. 网络问题

**排查步骤**：

```bash
# 查看服务日志
pm2 logs botc-api

# 测试API连通性
curl -H "Authorization: Bearer sk-your-api-key" \
  https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation
```

### Q3: 微信小程序请求失败

**A**: 检查清单：

- [ ] 服务器域名是否配置
- [ ] 是否使用HTTPS
- [ ] 后端CORS是否配置
- [ ] 是否在小程序"不校验合法域名"调试

### Q4: Token消耗太快

**A**: 优化建议：

1. 使用 `/api/analyze/quick` 接口（不调用大模型）
2. 缩短Prompt长度
3. 使用 `qwen-turbo` 模型（更便宜）

修改 `utils/qwen-client.js`：

```javascript
this.model = 'qwen-turbo'; // 改为turbo模型
```

### Q5: 服务器重启后服务挂了

**A**: 使用PM2确保服务持久运行：

```bash
# 查看PM2状态
pm2 status

# 如果服务停了，重启
pm2 restart botc-api

# 设置开机自启
pm2 startup
pm2 save
```

---

## 成本估算

### 通义千问免费额度

- 每天：500万tokens
- 单次分析：约1000-2000 tokens
- 每天可分析：2500-5000次

### 服务器成本（按月）

| 方案 | 配置 | 费用 |
|------|------|------|
| 腾讯云轻量 | 1核2GB | 50元/月 |
| 阿里云ECS | 1核2GB | 60元/月 |
| Vercel | Serverless | 免费（有限额） |

### 总成本

- **开发测试**: 0元（免费额度够用）
- **小规模运营**: 50-60元/月（服务器）
- **大规模运营**: 按需升级服务器

---

## 监控和优化

### 添加请求日志

编辑 `backend/server.js`，添加日志中间件：

```javascript
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});
```

### Token使用统计

在每次大模型调用后记录：

```javascript
const result = await qwenClient.analyzeGame(...);
console.log(`Tokens used: ${result.tokensUsed.totalTokens}`);

// 可以保存到数据库，做统计分析
```

### 性能优化

1. **缓存分析结果**（相同游戏状态不重复分析）
2. **限流**（防止滥用）
3. **异步处理**（大模型调用放入队列）

---

## 下一步

✅ 本地测试通过
✅ 服务器部署完成
✅ 微信小程序接入

接下来可以：

1. 开发完整的小程序界面
2. 添加用户系统
3. 增加历史记录功能
4. 优化Prompt提升分析质量

---

## 技术支持

遇到问题？

1. 查看日志：`pm2 logs botc-api`
2. 查看文档：`docs/` 目录
3. 测试API：使用Postman或curl

祝你部署顺利！🎉
