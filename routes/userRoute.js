const express = require('express');
const router = express.Router();
const {join, login, checkDuplicateId} = require('../controller/user');
const {authenticateAccessToken} = require('../middlewares/authMiddleware'); //사용자 인증 모듈

router.post('/join', join);

router.post('/checkDuplicate_id', checkDuplicateId);

router.post('/login', login);
router.get('/accessToken', authenticateAccessToken, (req, res) => { //사용자 인증이 필요한 경우 미들웨어 호출.
    console.log(`req.userId: ${req.userId}`);
    res.end('hi~');
})

module.exports = router;
