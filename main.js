const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');

dotenv.config();

const app = express();

// 세션 설정
app.use(session({
  secret: process.env.SESSION_KEY, // 세션 암호화에 사용되는 비밀 키
  resave: false,
  saveUninitialized: true
}));

// 미들웨어
app.use(express.json());

// app.use(cors({
//   origin: ['http://localhost:5173', 'https://munbo.netlify.app/'] 
//   // 클라이언트의 출처를 허용
// }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // 다른 CORS 관련 헤더 설정도 가능
  next();
});
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// 라우터
var userRouter = require('./routes/userRoute');
var authRouter = require('./routes/authRoute');
var quizRouter = require('./routes/quizRoute');

//라우터 추가
var summaryRouter = require('./routes/summaryRoute');

app.use('/users', userRouter);
app.use('/admin', authRouter);
app.use('/quiz', quizRouter);

//추가
app.use('/summaryNote', summaryRouter);

app.listen(5000, () => {
    console.log(`server is on 5000`);
})