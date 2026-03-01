# Railway 部署指南

## 部署步骤

### 1. 准备代码

确保 `server` 文件夹包含以下文件：
```
server/
├── server.js          # 主服务器文件
├── package.json       # 依赖配置
├── Procfile          # Railway启动配置
├── .gitignore        # Git忽略文件
└── README.md         # 说明文档
```

### 2. 创建 GitHub 仓库

1. 在 GitHub 创建新仓库，例如 `low-dim-social-server`
2. 将 `server` 文件夹内的代码推送到仓库

```bash
cd server
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/low-dim-social-server.git
git push -u origin main
```

### 3. 在 Railway 部署

1. 登录 [Railway](https://railway.app/)
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择你的仓库 `low-dim-social-server`
5. 点击 "Deploy"

Railway 会自动：
- 识别 `package.json` 安装依赖
- 使用 `Procfile` 启动服务
- 分配域名（如 `https://your-app.up.railway.app`）

### 4. 获取域名

部署完成后，在 Railway 控制台：
1. 点击你的项目
2. 点击 "Settings" 标签
3. 找到 "Domain" 部分
4. 复制域名，例如 `your-app.up.railway.app`

### 5. 配置小程序

修改 `miniprogram/utils/socket.js`：

```javascript
// 第16行，替换为实际的Railway域名
const wsUrl = 'wss://your-app.up.railway.app'
```

### 6. 配置微信小程序

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入 "开发" → "开发设置" → "服务器域名"
3. 在 "socket合法域名" 中添加：
   ```
   wss://your-app.up.railway.app
   ```
4. 在 "request合法域名" 中添加：
   ```
   https://your-app.up.railway.app
   ```

### 7. 测试

1. 在微信开发者工具中重新编译小程序
2. 使用真机调试或预览功能
3. 用两台手机扫码进入测试

## 注意事项

1. **免费额度**：Railway 免费版每月有 500 小时运行时间，足够测试使用

2. **自动部署**：每次推送到 GitHub，Railway 会自动重新部署

3. **查看日志**：在 Railway 控制台可以查看服务器日志

4. **环境变量**：如需配置环境变量，在 Railway 控制台 "Variables" 标签添加

## 故障排查

### 连接失败
- 检查域名是否正确配置
- 检查微信小程序后台是否添加了域名
- 查看 Railway 日志是否有错误

### 端口问题
- Railway 会自动设置 `PORT` 环境变量
- 代码中使用 `process.env.PORT` 获取端口

### WebSocket 连接问题
- 确保使用 `wss://` 协议（WebSocket Secure）
- 检查小程序开发者工具的 "不校验合法域名" 选项（开发时）
