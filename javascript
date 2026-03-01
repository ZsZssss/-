// server.js
const express = require('express');
const cors = require('cors'); // 解决小程序跨域问题
const app = express();

// 中间件：解析 JSON、允许跨域
app.use(cors());
app.use(express.json());

// 小程序测试接口
app.get('/api/test', (req, res) => {
  res.json({
    code: 200,
    msg: '测试服务器连接成功',
    data: {
      time: new Date().toLocaleString(),
      env: 'Railway 测试环境'
    }
  });
});

// 监听端口：Railway 会自动分配 PORT 环境变量，必须用这个变量
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
