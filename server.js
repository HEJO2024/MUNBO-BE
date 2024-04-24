const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const { createProxyMiddleware } = require('http-proxy-middleware');

dotenv.config();

const app = express();

// 미들웨어
app.use(express.json());
app.use(bodyParser.json());
app.use('/api', createProxyMiddleware({ target: 'http://ec2-13-209-41-40.ap-northeast-2.compute.amazonaws.com:3000/', changeOrigin: true }));

// 라우터
var userRouter = require('./routes/userRoute');
var authRouter = require('./routes/authRoute');

app.use('/users', userRouter);
app.use('/admin', authRouter);

app.listen(process.env.PORT, () => {
    console.log(`server is on ${process.env.PORT}`);
})
