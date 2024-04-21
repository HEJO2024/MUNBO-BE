const express = require('express');
const router = express.Router();
const {authenticateAccessToken, authenticateAdmin} = require('../middlewares'); //사용자 인증 모듈

const { authLogin, authListView, authUserUpdate, authUserUpdate_process, authUserDelete } = require('../controller/user');

const userRouter = express.Router();

// 미들웨어 적용
userRouter.use(authenticateAccessToken, authenticateAdmin);

// 관리자 인증 라우터
router.post('/users/login', authLogin);

// 회원정보 관리 라우터
userRouter.get('/listView', authListView);
userRouter.get('/update', authUserUpdate);
userRouter.put('/update', authUserUpdate_process);
userRouter.delete('/delete', authUserDelete);

router.use('/users', userRouter);

module.exports = router;
