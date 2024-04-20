const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// 미들웨어
app.use(express.json());

// 라우터
var userRouter = require('./routes/userRoute');

app.use('/users', userRouter);


app.listen(process.env.PORT, () => {
    console.log(`server is on ${process.env.PORT}`);
})
