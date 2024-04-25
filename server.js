const express = require('express');
const dotenv = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');

dotenv.config();

const app = express();

// 미들웨어
app.use(express.json());
// app.use('/api', createProxyMiddleware({ target: '13.209.41.40:3000', changeOrigin: true }));
app.use('/api', createProxyMiddleware({ 
    target: 'https://13.209.41.40:3000', 
    changeOrigin: true,
    secure: false // SSL 인증서의 유효성 검사 비활성화
  }));

// 라우터
var userRouter = require('./routes/userRoute');
var authRouter = require('./routes/authRoute');

app.use('/users', userRouter);
app.use('/admin', authRouter);

app.listen(process.env.PORT, () => {
    console.log(`server is on ${process.env.PORT}`);
})
