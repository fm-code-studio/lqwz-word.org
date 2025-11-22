const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');
const confessionRoutes = require('./routes/confessionRoutes');

dotenv.config();

const app = express();

// 中间件
// 将原来的 cors() 替换为：
app.use(cors({
  origin: '*', // 开发环境下允许所有来源
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 路由
app.use('/api/users', userRoutes);
app.use('/api/confessions', confessionRoutes);

// 数据库连接
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`服务器运行在端口 ${process.env.PORT}`);
    });
  })
  .catch((err) => console.log(`连接失败: ${err.message}`));


