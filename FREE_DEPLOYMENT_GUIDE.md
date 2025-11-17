# 💰 完全免费部署方案 - 0元搭建血染钟楼AI助手

## 🎯 目标

**完全不花钱**完成以下功能：
- ✅ 后端服务部署
- ✅ 大模型AI分析
- ✅ 微信小程序上线
- ✅ HTTPS域名访问

**总成本：0元** 💰

---

## 📊 三种免费方案对比

| 方案 | 后端部署 | 大模型 | 难度 | 推荐指数 |
|------|----------|--------|------|----------|
| **方案A** | Vercel免费 | 通义千问免费额度 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **方案B** | 小程序云开发 | 通义千问免费额度 | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **方案C** | Railway免费 | 本地Ollama | ⭐⭐⭐⭐ | ⭐⭐⭐ |

**推荐：方案A**（最简单，5分钟部署完成）

---

## 🚀 方案A：Vercel免费部署（推荐）

### 优势
- ✅ 完全免费（包含HTTPS）
- ✅ 5分钟部署完成
- ✅ 自动CI/CD
- ✅ 提供免费域名
- ✅ 全球CDN加速

### 限制
- ❌ 每月100GB带宽限制
- ❌ 每月100GB-hours执行时间
- ❌ Serverless函数10秒超时

**适合**：个人使用、小规模测试（足够用）

### 部署步骤

#### 第1步：准备GitHub仓库（5分钟）

```bash
cd /home/mini/血染钟楼/botc-ai-assistant

# 初始化Git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit - BOTC AI Assistant"

# 创建GitHub仓库（在GitHub网站上操作）
# 1. 访问 https://github.com/new
# 2. 创建新仓库（可以是私有的）
# 3. 复制仓库地址

# 关联远程仓库
git remote add origin https://github.com/your-username/botc-ai-assistant.git

# 推送代码
git branch -M main
git push -u origin main
```

#### 第2步：部署到Vercel（3分钟）

1. **访问Vercel**
   - 打开 https://vercel.com
   - 使用GitHub账号登录（免费）

2. **导入项目**
   - 点击 "New Project"
   - 选择你的GitHub仓库 `botc-ai-assistant`
   - 点击 "Import"

3. **配置环境变量**
   - 在部署前，点击 "Environment Variables"
   - 添加：
     - Name: `DASHSCOPE_API_KEY`
     - Value: `sk-你的通义千问API-Key`
   - 点击 "Add"

4. **部署**
   - 点击 "Deploy"
   - 等待约2分钟
   - 完成！🎉

5. **获取部署地址**
   - 部署成功后会显示：`https://your-project.vercel.app`
   - 这就是你的免费API地址！

#### 第3步：测试部署（1分钟）

```bash
# 测试健康检查
curl https://your-project.vercel.app/api/health

# 应该返回
{
  "status": "ok",
  "llmEnabled": true,
  "platform": "Vercel Serverless"
}
```

#### 第4步：在小程序中使用

编辑 `miniprogram/api.js`：

```javascript
// 使用你的Vercel地址
const API_BASE_URL = 'https://your-project.vercel.app/api';
```

然后在微信公众平台配置服务器域名：
- 进入：开发 → 开发管理 → 开发设置 → 服务器域名
- 添加：`https://your-project.vercel.app`

完成！现在小程序可以调用你的免费API了！

### Vercel免费额度

| 项目 | 免费额度 | 说明 |
|------|----------|------|
| 带宽 | 100GB/月 | 足够10万次请求 |
| 执行时间 | 100GB-hours/月 | 约300万次函数调用 |
| 函数超时 | 10秒 | 通常2-5秒就能完成 |
| 域名 | 免费HTTPS域名 | 自动提供 |
| 部署 | 无限次 | 每次Git push自动部署 |

**足够个人使用和小规模测试！**

---

## 🎨 方案B：微信小程序云开发（完全在微信生态内）

### 优势
- ✅ 完全免费（腾讯提供）
- ✅ 不需要自己的服务器
- ✅ 不需要备案
- ✅ 与小程序深度集成
- ✅ 提供云函数、云数据库、云存储

### 免费额度
- 云函数：4万次调用/天
- 云数据库：2GB容量
- 云存储：5GB容量

### 部署步骤

#### 第1步：开通云开发

1. 打开微信开发者工具
2. 点击左侧"云开发"按钮
3. 开通云开发（免费）
4. 创建环境（选择"按量付费"，免费额度内不收费）

#### 第2步：创建云函数

在小程序项目中创建云函数目录：

```
cloudfunctions/
├── analyze/              # 分析函数
│   ├── index.js
│   └── package.json
├── quick/                # 快速分析
│   ├── index.js
│   └── package.json
└── chat/                 # 对话函数
    ├── index.js
    └── package.json
```

我来帮你创建云函数代码...

