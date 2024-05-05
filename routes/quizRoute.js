const express = require('express');
const router = express.Router();
const { testSolve, testNext, aiQuiz_create } = require('../controller/quiz');
const {authenticateAccessToken} = require('../middlewares'); //사용자 인증 모듈

router.get('/test_solve', testSolve);
router.get('/test_next', authenticateAccessToken, testNext);

router.get('/ai_solve', aiQuiz_create);
router.get('/ai_previous', );
router.get('/ai_next', );
router.post('/ai_save', );
router.delete('/ai_delete', );

// 저장 퀴즈
const noteRouter = express.Router(); // 미들웨어 라우터
noteRouter.use(authenticateAccessToken);
router.use('/note', noteRouter);

noteRouter.get('/view', );
noteRouter.get('/view_previous', );
noteRouter.get('/view_next', );
noteRouter.post('/view_finish', );


module.exports = router;
