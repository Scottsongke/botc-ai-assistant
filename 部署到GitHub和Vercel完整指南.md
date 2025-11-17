# 🚀 部署到GitHub和Vercel - 完整指南

**状态**: ✅ Git已初始化，代码已提交，随时可以推送！

---

## 📋 当前进度

✅ **已完成**:
- Git仓库已初始化
- 所有34个文件已提交（8531行代码）
- Git用户已配置: Scottsongke

⏭️ **待完成**:
- 在GitHub创建仓库
- 推送代码到GitHub
- 部署到Vercel

---

## 🎯 方案A：自动化脚本（推荐）

我已经为您准备了自动化脚本。执行以下命令即可：

### 步骤1: 创建GitHub仓库并推送

```bash
# 方法1: 使用自动化脚本（如果有GitHub Token）
bash scripts/deploy-to-github.sh

# 方法2: 手动创建仓库后推送
# （请先在 https://github.com/new 创建仓库，仓库名: botc-ai-assistant）
git remote add origin https://github.com/Scottsongke/botc-ai-assistant.git
git branch -M main
git push -u origin main
```

### 步骤2: 部署到Vercel

```bash
# 使用自动化脚本
bash scripts/deploy-to-vercel.sh

# 或者访问 Vercel 手动部署
```

---

## 🎯 方案B：完全手动部署（最可靠）

### 第1步：在GitHub创建仓库（2分钟）

1. 访问: https://github.com/new
2. 登录账号: **Scottsongke**
3. 填写仓库信息:
   - Repository name: `botc-ai-assistant`
   - Description: `Blood on the Clocktower AI Assistant - 血染钟楼AI智能助手`
   - Visibility:
     - ✅ Public（推荐，免费部署）
     - ⚪ Private（也可以，Vercel支持）
4. **不要**勾选 "Add a README file"
5. **不要**勾选 "Add .gitignore"
6. **不要**选择 License
7. 点击 "Create repository"

### 第2步：推送代码到GitHub（1分钟）

GitHub会显示推送命令，直接复制执行：

```bash
# 设置远程仓库
git remote add origin https://github.com/Scottsongke/botc-ai-assistant.git

# 重命名分支为main
git branch -M main

# 推送代码
git push -u origin main
```

**如果需要认证**，GitHub会提示：
- 用户名: `Scottsongke`
- 密码: 使用 **Personal Access Token**（不是GitHub密码）

#### 如何获取Personal Access Token？

1. 访问: https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 勾选权限: `repo` (所有子选项)
4. 点击 "Generate token"
5. **立即复制Token**（只显示一次！）
6. 在git push时，用Token替代密码

### 第3步：部署到Vercel（5分钟）

#### 3.1 访问Vercel

1. 打开: https://vercel.com
2. 点击 "Sign Up" 或 "Log In"
3. 选择 "Continue with GitHub"
4. 授权Vercel访问您的GitHub账号

#### 3.2 导入项目

1. 点击 "New Project"
2. 从列表中选择 `botc-ai-assistant` 仓库
3. 点击 "Import"

#### 3.3 配置环境变量（重要！）

在 "Environment Variables" 部分添加：

```
Name:  DASHSCOPE_API_KEY
Value: sk-93c5d42145264a6bb95dc1611c01580a
```

**所有环境**都要勾选:
- ✅ Production
- ✅ Preview
- ✅ Development

#### 3.4 部署设置

保持默认设置:
- Framework Preset: Other
- Build Command: (留空)
- Output Directory: (留空)
- Install Command: `npm install`

#### 3.5 开始部署

1. 点击 "Deploy"
2. 等待2-3分钟...
3. ✅ 部署完成！

#### 3.6 获取API地址

部署成功后会显示:
```
🎉 Congratulations!
https://botc-ai-assistant.vercel.app
```

这就是你的免费API地址！

---

## 🧪 第4步：测试免费API（3分钟）

### 测试1: 健康检查

```bash
curl https://botc-ai-assistant.vercel.app/api/health
```

**期望输出**:
```json
{
  "status": "ok",
  "llmEnabled": true
}
```

### 测试2: 快速分析

```bash
curl -X POST https://botc-ai-assistant.vercel.app/api/analyze/quick \\
  -H "Content-Type: application/json" \\
  -d '{
    "players": [
      {"id": 1, "name": "玩家1", "alive": true},
      {"id": 2, "name": "玩家2", "alive": true},
      {"id": 3, "name": "玩家3", "alive": true},
      {"id": 4, "name": "玩家4", "alive": true},
      {"id": 5, "name": "玩家5", "alive": true}
    ],
    "currentDay": 2,
    "allClaims": [
      {"player": 1, "claimedRole": "占卜师"},
      {"player": 2, "claimedRole": "占卜师"}
    ],
    "nightDeaths": []
  }'
```

**期望输出**: 包含矛盾检测和概率分析

### 测试3: 完整分析（含AI）

```bash
# 使用我准备的测试脚本
bash test/test-production-api.sh https://botc-ai-assistant.vercel.app
```

---

## 📱 第5步：微信小程序配置（5分钟）

### 5.1 配置服务器域名

1. 登录微信公众平台: https://mp.weixin.qq.com
2. 进入: 开发 → 开发管理 → 开发设置 → 服务器域名
3. 在 "request合法域名" 添加:
   ```
   https://botc-ai-assistant.vercel.app
   ```
4. 保存

### 5.2 更新小程序代码

编辑 `miniprogram/api.js`:
```javascript
const API_BASE_URL = 'https://botc-ai-assistant.vercel.app/api';
```

### 5.3 测试

在微信开发者工具中:
```javascript
import { analyzeGame } from '../../api.js';

const gameState = {
  players: [...],
  currentDay: 2,
  allClaims: [...]
};

analyzeGame(gameState).then(result => {
  console.log('分析结果:', result);
});
```

---

## 🔧 故障排除

### 问题1: git push 需要密码

**原因**: GitHub不再支持密码认证
**解决**: 使用Personal Access Token
**步骤**:
1. 访问: https://github.com/settings/tokens
2. 生成新Token（勾选repo权限）
3. 用Token替代密码

### 问题2: Vercel部署失败

**原因**: 通常是环境变量未配置
**解决**:
1. 在Vercel项目设置中检查环境变量
2. 确保 `DASHSCOPE_API_KEY` 已正确设置
3. 重新部署: Settings → Deployments → Redeploy

### 问题3: API返回 llmEnabled: false

**原因**: API Key未传递到Vercel
**解决**:
1. Vercel → Settings → Environment Variables
2. 添加 `DASHSCOPE_API_KEY`
3. 重新部署

### 问题4: 小程序调用失败

**原因**: 域名未配置
**解决**:
1. 微信公众平台配置服务器域名
2. 等待5分钟生效
3. 重启微信开发者工具

---

## 🎯 自动化脚本说明

我为您准备了3个自动化脚本：

### 1. scripts/deploy-to-github.sh
自动创建GitHub仓库并推送代码

### 2. scripts/deploy-to-vercel.sh
自动部署到Vercel（需要Vercel CLI）

### 3. test/test-production-api.sh
测试生产环境API

---

## 📊 部署后检查清单

部署完成后，请检查：

- [ ] GitHub仓库已创建: https://github.com/Scottsongke/botc-ai-assistant
- [ ] 代码已推送（34个文件）
- [ ] Vercel项目已创建
- [ ] 环境变量已配置: DASHSCOPE_API_KEY
- [ ] API可访问: /api/health 返回 "ok"
- [ ] LLM已启用: llmEnabled: true
- [ ] 快速分析正常: /api/analyze/quick 能检测矛盾
- [ ] 完整分析正常: /api/analyze 返回AI分析
- [ ] 微信服务器域名已配置
- [ ] 小程序可以调用API

---

## 🚀 快速命令参考

```bash
# 查看当前状态
git status
git log --oneline

# 推送到GitHub（首次）
git remote add origin https://github.com/Scottsongke/botc-ai-assistant.git
git branch -M main
git push -u origin main

# 后续更新代码
git add .
git commit -m "Update: 描述更改内容"
git push

# 测试本地
npm run server
node test/test-llm.js
bash test/test-api.sh

# 测试生产环境
curl https://botc-ai-assistant.vercel.app/api/health
bash test/test-production-api.sh https://botc-ai-assistant.vercel.app
```

---

## 💡 重要提示

1. **Personal Access Token**:
   - GitHub现在要求使用Token而不是密码
   - Token只显示一次，请妥善保存
   - 权限至少需要勾选 `repo`

2. **环境变量安全**:
   - 不要将 `.env` 文件推送到GitHub
   - ✅ 已配置 `.gitignore` 排除 `.env`
   - Vercel环境变量是安全的

3. **API Key**:
   - 当前使用的Key: `sk-93c5d42145264a6bb95dc1611c01580a`
   - 免费额度: 500万tokens/天
   - 足够支持每天5000+次分析

4. **自动部署**:
   - 每次 `git push` 后，Vercel会自动重新部署
   - 部署时间: 2-3分钟
   - 可在Vercel控制台查看部署日志

---

## 🎉 预期结果

完成部署后，你将拥有：

1. **GitHub仓库**:
   - 地址: https://github.com/Scottsongke/botc-ai-assistant
   - 完整的代码历史
   - 自动CI/CD（通过Vercel）

2. **Vercel生产环境**:
   - API地址: https://botc-ai-assistant.vercel.app
   - 自动HTTPS
   - 全球CDN加速
   - 自动重新部署

3. **免费API服务**:
   - 6个REST接口
   - 100GB带宽/月
   - 500万tokens/天
   - 完全免费

---

**准备好了吗？开始部署吧！** 🚀

建议顺序：
1. 在GitHub创建仓库（2分钟）
2. 推送代码（1分钟）
3. Vercel部署（5分钟）
4. 测试API（3分钟）

**总计: 11分钟完成从代码到上线！**
