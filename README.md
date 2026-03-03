# 低维社交小程序后端服务

## 功能说明

这个后端服务实现了多设备实时互通功能：
- 用户位置实时同步
- 附近用户发现
- 标点数据同步
- 脉冲（点击/长按）广播
- 标点回复功能

## 部署步骤

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 启动服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务器默认运行在 `3000` 端口。

### 3. 配置小程序

修改 `miniprogram/utils/socket.js` 中的服务器地址：

```javascript
// 第12行，替换为实际的服务器地址
const wsUrl = 'wss://your-server-domain.com'
```

如果使用本地测试，可以使用 `ws://localhost:3000`

### 4. 部署到服务器

推荐使用以下方式部署：

#### 方案1：使用云服务器（推荐）
- 购买云服务器（阿里云、腾讯云等）
- 安装 Node.js
- 上传代码并运行
- 配置 Nginx 反向代理和 SSL 证书

#### 方案2：使用云函数
- 腾讯云云函数
- 阿里云函数计算
- 支持 WebSocket 的云服务

#### 方案3：使用 PaaS 平台
- Heroku
- Railway
- Render

## 测试方法

1. 启动后端服务器
2. 在微信开发者工具中运行小程序
3. 使用真机调试或预览功能
4. 用两台手机扫码进入
5. 两台手机靠近（在同一位置或附近）
6. 应该能看到对方的亮点

## 注意事项

1. **WebSocket 地址**：小程序要求使用 `wss://` 协议（WebSocket Secure），本地测试可以使用 `ws://`

2. **服务器域名**：需要在微信小程序后台配置服务器域名
   - 登录微信公众平台
   - 开发 → 开发设置 → 服务器域名
   - 添加 `wss://your-server-domain.com`

3. **真机测试**：开发者工具的模拟器不支持完整的 WebSocket 测试，建议使用真机调试

4. **网络环境**：确保手机和服务器之间的网络通畅

## API 说明

### 消息类型

**客户端发送：**
- `login` - 用户登录
- `updateLocation` - 更新位置
- `pulse` - 发送脉冲
- `createMarker` - 创建标点
- `getNearbyUsers` - 获取附近用户
- `getNearbyMarkers` - 获取附近标点
- `discoverMarker` - 发现标点
- `replyToMarker` - 回复标点

**服务器发送：**
- `connected` - 连接成功
- `userLocationUpdate` - 用户位置更新
- `userOnline` - 用户上线
- `userOffline` - 用户离线
- `userPulse` - 收到脉冲
- `nearbyUsers` - 附近用户列表
- `newMarker` - 新标点
- `nearbyMarkers` - 附近标点列表
- `markerUpdated` - 标点更新
- `newReply` - 新回复通知
- `error` - 错误信息
