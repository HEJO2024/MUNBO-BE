const express = require('express');
const router = express.Router();
const { testSolve, testNext, checkLog, aiQuiz_create, aiQuiz_org, aiQuiz_save, aiQuiz_delete, updateAssessment, aiQuiz_view } = require('../controller/quiz');
const {authenticateAccessToken} = require('../middlewares/index'); //사용자 인증 모듈

// 진단평가
router.get('/test_solve', testSolve);
router.get('/test_next', authenticateAccessToken, testNext);

// 진단평가 풀이 여부 확인
router.get('/check_quizLog', authenticateAccessToken, checkLog); 

// ai문제 생성 및 풀이(1번 기능: 오답 기반)
router.get('/ai_solve',authenticateAccessToken, aiQuiz_create); //문제 풀이(키워드 세션 설정)
router.get('/ai_original', aiQuiz_org);
router.post('/ai_assessment', updateAssessment);

// 저장 문제
router.post('/note/ai_save', authenticateAccessToken, aiQuiz_save);
router.get('/note/view', authenticateAccessToken, aiQuiz_view);
router.delete('/note/ai_delete', aiQuiz_delete);

module.exports = router;
