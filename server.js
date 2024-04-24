const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const { createProxyMiddleware } = require('http-proxy-middleware');

dotenv.config();

const app = express();

// 미들웨어
app.use(express.json());
app.use(bodyParser.json());
// app.use('/api', createProxyMiddleware({ target: 'https://munbo.netlify.app/', changeOrigin: true }));

// 라우터
var userRouter = require('./routes/userRoute');
var authRouter = require('./routes/authRoute');

app.use('/users', userRouter);
app.use('/admin', authRouter);

app.listen(process.env.PORT, () => {
    console.log(`server is on ${process.env.PORT}`);
})
