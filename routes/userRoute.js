const express = require('express');
const router = express.Router();
const {join, login, userUpdate, userUpdate_process, checkDuplicateId, userDelete} = require('../controller/user');
const {authenticateAccessToken} = require('../middlewares'); //사용자 인증 모듈

router.post('/join', join);
router.post('/checkDuplicate_id', checkDuplicateId);
router.post('/login', login);
router.get('/update', authenticateAccessToken, userUpdate);
router.put('/update', authenticateAccessToken, userUpdate_process);
router.delete('/delete', authenticateAccessToken, userDelete);

module.exports = router;
