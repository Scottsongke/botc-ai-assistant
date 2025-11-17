# 获取通义千问API Key指南

## ⚠️ 重要说明

您提供的凭证是**阿里云Access Key**（用于管理阿里云资源），而不是**DashScope API Key**（用于调用通义千问API）。

这两个是不同的：
- ❌ Access Key ID: `LTAI5tLMytGz7rWAcgKrEZ7J` （不能直接用于API调用）
- ✅ DashScope API Key: `sk-xxxxxxxxxxxxxxxx` （正确格式，以sk-开头）

## 📋 获取DashScope API Key步骤

### 方法1：使用您的阿里云账号获取

#### 第1步：登录DashScope控制台

1. 访问：https://dashscope.console.aliyun.com/
2. 使用您的阿里云账号登录（使用Access Key对应的账号）

#### 第2步：创建API Key

1. 点击左侧菜单「API Key管理」
2. 点击「创建新的API Key」
3. 输入API Key名称，例如：「血染钟楼助手」
4. 点击「确定」
5. **立即复制并保存**显示的API Key（格式：sk-xxxxxxxxxxxxxx）
   - ⚠️ 注意：API Key只显示一次，请务必保存！

#### 第3步：配置到项目

```bash
cd /home/mini/血染钟楼/botc-ai-assistant
nano .env
```

修改为：
```env
DASHSCOPE_API_KEY=sk-你刚才复制的完整Key
PORT=3000
NODE_ENV=development
```

保存后运行测试：
```bash
node test/test-llm.js
```

---

### 方法2：快速注册新账号获取

如果您不想使用现有阿里云账号，可以注册新的：

1. 访问：https://dashscope.aliyun.com/
2. 点击「免费开通」
3. 使用手机号注册（或支付宝登录）
4. 完成实名认证（需要身份证）
5. 进入控制台创建API Key

**免费额度**：
- 500万tokens/天
- 足够个人使用

---

## 🔍 如何验证API Key格式

**正确的API Key格式**：
```
sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**特征**：
- 以 `sk-` 开头
- 后面跟32-40位字符
- 示例（假的）：`sk-1234567890abcdefghijklmnopqrst`

**错误的格式**：
- `LTAI5t...`（这是Access Key ID）
- 不以 `sk-` 开头的任何字符串

---

## 🚀 快速测试流程

### 1. 配置API Key

```bash
cd /home/mini/血染钟楼/botc-ai-assistant
echo "DASHSCOPE_API_KEY=sk-你的Key" > .env
echo "PORT=3000" >> .env
echo "NODE_ENV=development" >> .env
```

### 2. 运行测试

```bash
node test/test-llm.js
```

### 3. 期望输出

```
✅ API Key已配置
✅ 通义千问客户端初始化成功

=== 测试1: 简单对话 ===
✅ 简单对话测试成功
回答: [大模型的回答内容]
Token使用: 输入: 15 | 输出: 45 | 总计: 60

=== 测试2: 完整游戏分析 ===
✅ 游戏分析测试成功
...
```

---

## ❓ 常见问题

### Q1: 我忘记保存API Key怎么办？

A: 删除旧的API Key，重新创建一个新的。

### Q2: API Key会过期吗？

A: 不会自动过期，除非您手动删除。

### Q3: 免费额度够用吗？

A: 500万tokens/天 ≈ 3000次完整分析，个人使用绰绰有余。

### Q4: 如何查看Token使用量？

A: 在DashScope控制台的「资源包管理」中可以查看。

---

## 📞 需要帮助？

如果您已经获取到了正确的API Key（以sk-开头），请：

1. 配置到 `.env` 文件
2. 运行 `node test/test-llm.js` 测试
3. 如果还有问题，检查：
   - API Key是否完整复制（没有多余空格）
   - 网络连接是否正常
   - 是否在DashScope控制台看到API调用记录

---

**下一步**：获取正确的API Key后，系统就可以正常工作了！🚀
