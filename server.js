const fs = require('fs');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const https = require('https');
const http = require('http');

dotenv.config();

const app = express();

// 미들웨어
app.use(express.json());

// app.use(cors({
//   origin: ['http://localhost:5173', 'https://munbo.netlify.app/', 'https://munbo2024.site'] 
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
// var quizRouter = require('./routes/quizRoute');
// var summaryRouter = require('./routes/summaryRoute');

app.use('/users', userRouter);
app.use('/admin', authRouter);
// app.use('/quiz', quizRouter);
// app.use('/summaryNote', summaryRouter);

// HTTPS 옵션 설정
const httpsOptions = {
  key: fs.readFileSync('../privkey.pem'),
  cert: fs.readFileSync('../fullchain.pem')
};

// const httpsOptions = { // letsencrypt로 받은 인증서 경로를 입력해 줍니다.

//   ca: fs.readFileSync('../fullchain.pem'),
  
//   key: fs.readFileSync('../privkey.pem'),
  
//   cert: fs.readFileSync('../cert.pem')
  
//   };

http.createServer(app).listen(80);

https.createServer(httpsOptions, app).listen(443);

// // HTTPS 서버 시작
// const PORT = process.env.PORT || 443; // HTTPS 포트 설정
// https.createServer(httpsOptions, app).listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
