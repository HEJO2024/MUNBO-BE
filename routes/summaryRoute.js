const express = require('express');
const router = express.Router();
const { summaryCreate, noteCreate, summaryQuiz_create, summary_listView, summaryView, summaryUpdate, summaryDelete } = require('../controller/summary');
const {authenticateAccessToken} = require('../middlewares'); //사용자 인증 모듈

router.post('/create', summaryCreate);
router.post('/note/create', authenticateAccessToken, noteCreate);
router.post('/quiz_solve', summaryQuiz_create);
router.post('/quiz_grade', ); //주관식 채점
router.get('/note/listView', authenticateAccessToken, summary_listView);
router.get('/note/view', summaryView);
// router.get('/note/update', summaryUpdate);
router.put('/note/update', summaryUpdate);
router.delete('/note/delete', summaryDelete);
router.get('/note/quiz', );
// router.get('/note/quiz_previous', );
// router.get('/note/quiz_next', );

module.exports = router;
