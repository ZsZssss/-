const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 健康检查端点（Railway需要）
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '低维社交服务器运行中',
    onlineUsers: onlineUsers.size,
    markers: markers.size
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// 存储在线用户
const onlineUsers = new Map();
// 存储标点数据
const markers = new Map();

// 创建HTTP服务器
const server = http.createServer(app);

// 创建WebSocket服务器
const wss = new WebSocket.Server({ server });

// 计算两个坐标之间的距离（米）
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // 地球半径（米）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 广播消息给所有客户端
function broadcast(message, excludeWs = null) {
  wss.clients.forEach(client => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// 广播给指定范围内的用户
function broadcastToNearby(latitude, longitude, range, message, excludeUserId = null) {
  onlineUsers.forEach((user, userId) => {
    if (userId !== excludeUserId) {
      const distance = calculateDistance(latitude, longitude, user.latitude, user.longitude);
      if (distance <= range && user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(JSON.stringify(message));
      }
    }
  });
}

wss.on('connection', (ws) => {
  console.log('新客户端连接');
  let userId = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('收到消息:', message.type);

      switch (message.type) {
        case 'login':
          // 用户登录
          userId = message.userId || `user_${Date.now()}`;
          onlineUsers.set(userId, {
            ws,
            userId,
            latitude: message.latitude || 0,
            longitude: message.longitude || 0,
            lastUpdate: Date.now()
          });
          
          ws.send(JSON.stringify({
            type: 'loginSuccess',
            userId
          }));
          
          // 通知其他用户有新用户上线
          broadcast({
            type: 'userOnline',
            userId,
            latitude: message.latitude,
            longitude: message.longitude
          }, ws);
          break;

        case 'updateLocation':
          // 更新用户位置
          if (userId && onlineUsers.has(userId)) {
            const user = onlineUsers.get(userId);
            user.latitude = message.latitude;
            user.longitude = message.longitude;
            user.lastUpdate = Date.now();
            
            // 广播位置更新给附近的用户
            broadcastToNearby(
              message.latitude,
              message.longitude,
              2000, // 2公里范围
              {
                type: 'userLocationUpdate',
                userId,
                latitude: message.latitude,
                longitude: message.longitude
              },
              userId
            );
          }
          break;

        case 'createMarker':
          // 创建标点
          if (userId) {
            const markerId = `marker_${Date.now()}`;
            const marker = {
              id: markerId,
              userId,
              latitude: message.latitude,
              longitude: message.longitude,
              content: message.content,
              contentType: message.contentType,
              previewContent: message.previewContent,
              createdAt: Date.now(),
              replies: [],
              isDiscovered: false
            };
            
            markers.set(markerId, marker);
            
            // 广播给附近的用户
            broadcastToNearby(
              message.latitude,
              message.longitude,
              2000,
              {
                type: 'newMarker',
                marker
              }
            );
            
            ws.send(JSON.stringify({
              type: 'markerCreated',
              markerId
            }));
          }
          break;

        case 'getNearbyUsers':
          // 获取附近的用户
          if (userId) {
            const user = onlineUsers.get(userId);
            const nearbyUsers = [];
            
            onlineUsers.forEach((otherUser, otherUserId) => {
              if (otherUserId !== userId) {
                const distance = calculateDistance(
                  user.latitude,
                  user.longitude,
                  otherUser.latitude,
                  otherUser.longitude
                );
                
                if (distance <= message.range) {
                  nearbyUsers.push({
                    userId: otherUserId,
                    latitude: otherUser.latitude,
                    longitude: otherUser.longitude,
                    distance
                  });
                }
              }
            });
            
            ws.send(JSON.stringify({
              type: 'nearbyUsers',
              users: nearbyUsers
            }));
          }
          break;

        case 'getNearbyMarkers':
          // 获取附近的标点
          if (userId) {
            const user = onlineUsers.get(userId);
            const nearbyMarkers = [];
            
            markers.forEach((marker) => {
              const distance = calculateDistance(
                user.latitude,
                user.longitude,
                marker.latitude,
                marker.longitude
              );
              
              if (distance <= message.range) {
                nearbyMarkers.push({
                  ...marker,
                  distance
                });
              }
            });
            
            ws.send(JSON.stringify({
              type: 'nearbyMarkers',
              markers: nearbyMarkers
            }));
          }
          break;

        case 'discoverMarker':
          // 发现标点
          if (userId && markers.has(message.markerId)) {
            const marker = markers.get(message.markerId);
            marker.isDiscovered = true;
            
            // 通知标点的创建者
            const creator = onlineUsers.get(marker.userId);
            if (creator && creator.ws.readyState === WebSocket.OPEN) {
              creator.ws.send(JSON.stringify({
                type: 'markerDiscovered',
                markerId: message.markerId,
                discoveredBy: userId
              }));
            }
          }
          break;

        case 'replyToMarker':
          // 回复标点
          if (userId && markers.has(message.markerId)) {
            const marker = markers.get(message.markerId);
            
            // 检查是否是自己的标点
            if (marker.userId === userId) {
              ws.send(JSON.stringify({
                type: 'error',
                message: '不能回复自己的标点'
              }));
              return;
            }
            
            const reply = {
              floor: marker.replies.length + 2,
              content: message.content,
              userId,
              timestamp: Date.now()
            };
            
            marker.replies.push(reply);
            
            // 通知标点的创建者
            const creator = onlineUsers.get(marker.userId);
            if (creator && creator.ws.readyState === WebSocket.OPEN) {
              creator.ws.send(JSON.stringify({
                type: 'newReply',
                markerId: message.markerId,
                reply
              }));
            }
            
            // 广播给所有能看到这个标点的用户
            broadcastToNearby(
              marker.latitude,
              marker.longitude,
              2000,
              {
                type: 'markerUpdated',
                marker
              }
            );
          }
          break;

        case 'pulse':
          // 用户发送脉冲（点击或长按）
          if (userId) {
            const user = onlineUsers.get(userId);
            
            // 广播脉冲给附近的用户
            broadcastToNearby(
              user.latitude,
              user.longitude,
              message.distance || 100,
              {
                type: 'userPulse',
                userId,
                latitude: user.latitude,
                longitude: user.longitude,
                distance: message.distance,
                isLongPress: message.isLongPress || false
              },
              userId
            );
          }
          break;
      }
    } catch (error) {
      console.error('处理消息错误:', error);
    }
  });

  ws.on('close', () => {
    console.log('客户端断开连接');
    if (userId) {
      onlineUsers.delete(userId);
      
      // 通知其他用户该用户离线
      broadcast({
        type: 'userOffline',
        userId
      });
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket错误:', error);
  });
});

// 定期清理离线的用户（超过5分钟没有更新位置）
setInterval(() => {
  const now = Date.now();
  const offlineUsers = [];
  
  onlineUsers.forEach((user, userId) => {
    if (now - user.lastUpdate > 5 * 60 * 1000) {
      offlineUsers.push(userId);
    }
  });
  
  offlineUsers.forEach(userId => {
    onlineUsers.delete(userId);
    broadcast({
      type: 'userOffline',
      userId
    });
  });
}, 60000); // 每分钟检查一次

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
