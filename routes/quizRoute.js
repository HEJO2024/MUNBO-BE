const express = require('express');
const router = express.Router();
const { testSolve, testNext } = require('../controller/quiz');
const {authenticateAccessToken} = require('../middlewares'); //사용자 인증 모듈

router.get('/test_solve', testSolve);
router.get('/test_next', authenticateAccessToken, testNext);

router.get('/ai_solve', );
router.get('/ai_previous', );
router.get('/ai_next', );
router.post('/ai_save', );
router.delete('/ai_delete', );

// 저장 퀴즈
router.get('/note/view', );
router.get('/note/view_previous', );
router.get('/note/view_next', );
router.post('/note/view_finish', );


module.exports = router;
