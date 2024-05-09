const express = require('express');
const router = express.Router();
const { testSolve, testNext, checkLog, aiQuiz_create } = require('../controller/quiz');
const {authenticateAccessToken} = require('../middlewares/index'); //사용자 인증 모듈

// 진단평가
router.get('/test_solve', testSolve);
router.get('/test_next', authenticateAccessToken, testNext);

// 진단평가 풀이 여부 확인
router.get('/check_quizLog', authenticateAccessToken, checkLog); 

// ai 생성퀴즈(오답 기반)
router.get('/ai_solve',authenticateAccessToken, aiQuiz_create); //문제 풀이(키워드 세션 설정)
router.post('/ai_save', );
router.delete('/ai_delete', );
router.post('/ai_assessment', ); // userAssessment

// 저장 문제
router.get('/note/view', );
router.delete('/note/delete', );

module.exports = router;
