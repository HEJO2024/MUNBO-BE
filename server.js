const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// 미들웨어
app.use(express.json());

// 라우터
var userRouter = require('./routes/userRoute');
var authRouter = require('./routes/authRoute');

app.use('/users', userRouter);
app.use('/admin', authRouter);

app.listen(process.env.PORT, () => {
    console.log(`server is on ${process.env.PORT}`);
})
