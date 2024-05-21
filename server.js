const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

dotenv.config();

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // 다른 CORS 관련 헤더 설정도 가능
  next();
});

// 세션 설정
app.use(session({
  secret: process.env.SESSION_KEY, // 세션 암호화에 사용되는 비밀 키
  resave: false,
  saveUninitialized: true
}));

app.use(bodyParser.urlencoded({ extended: false }));

// 미들웨어
app.use(express.json());
app.use(express.static('public'));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// 라우터
var userRouter = require('./routes/userRoute');
var authRouter = require('./routes/authRoute');
var quizRouter = require('./routes/quizRoute');
var summaryRouter = require('./routes/summaryRoute');

app.use('/users', userRouter);
app.use('/admin', authRouter);
app.use('/quiz', quizRouter);
app.use('/summaryNote', summaryRouter);

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server Listening on ${port}`);
});
