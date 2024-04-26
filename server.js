const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();

// 미들웨어
app.use(express.json());

app.use(cors({
  origin: ['http://localhost:5173', 'http://munbo.netlify.app/'] 
  // 클라이언트의 출처를 허용
}));

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
// var quizRouter = require('./routes/quizRoute');

app.use('/users', userRouter);
app.use('/admin', authRouter);
// app.use('/quiz', quizRouter);

app.listen(process.env.PORT, () => {
    console.log(`server is on ${process.env.PORT}`);
})
