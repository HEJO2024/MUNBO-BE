const express = require('express');
const router = express.Router();
const {authenticateAccessToken, authenticateAdmin} = require('../middlewares'); //사용자 인증 모듈

const { authLogin, authListView, authUserUpdate, authUserUpdate_process, authUserDelete } = require('../controller/user');
const { auth_quizList, auth_quizView, auth_quizUpdate, auth_quizDelete, auth_userAssessment, auth_viewRate } = require('../controller/quiz');
const { auth_subjectList, auth_subjectView, auth_subjectCreate, auth_subjectUpdate, auth_subjectDelete } = require('../controller/subject');
const { auth_roundList, auth_roundView, auth_roundCreate, auth_roundUpdate, auth_roundDelete } = require('../controller/round');
const { auth_keywordList, auth_keywordView, auth_keywordCreate, auth_keywordUpdate, auth_keywordDelete } = require('../controller/keyword');

const userRouter = express.Router();
const quizRouter = express.Router();
const subjectRouter = express.Router();
const roundRouter = express.Router();
const keywordRouter = express.Router();

// 미들웨어 적용
userRouter.use(authenticateAccessToken, authenticateAdmin);
quizRouter.use(authenticateAccessToken, authenticateAdmin);
subjectRouter.use(authenticateAccessToken, authenticateAdmin);
roundRouter.use(authenticateAccessToken, authenticateAdmin);
keywordRouter.use(authenticateAccessToken, authenticateAdmin);

// 관리자 인증 라우터
router.post('/users/login', authLogin);

// 회원정보 관리 라우터
userRouter.get('/listView', authListView);
userRouter.get('/view', authUserUpdate);
userRouter.put('/update', authUserUpdate_process);
userRouter.delete('/delete', authUserDelete);

//기출문제 관리 라우터
quizRouter.get('/listView', auth_quizList);
quizRouter.get('/view', auth_quizView);
quizRouter.put('/update', auth_quizUpdate);
quizRouter.delete('/delete', auth_quizDelete);

//과목 관리 라우터
subjectRouter.get('/listView', auth_subjectList);
subjectRouter.get('/view', auth_subjectView);
subjectRouter.post('/create', auth_subjectCreate);
subjectRouter.put('/update', auth_subjectUpdate);
subjectRouter.delete('/delete', auth_subjectDelete);

//회차 관리 라우터
roundRouter.get('/listView', auth_roundList);
roundRouter.get('/view', auth_roundView);
roundRouter.post('/create', auth_roundCreate);
roundRouter.put('/update', auth_roundUpdate);
roundRouter.delete('/delete', auth_roundDelete);

//키워드 관리 라우터
keywordRouter.get('/listView', auth_keywordList);
keywordRouter.get('/view', auth_keywordView);
keywordRouter.post('/create', auth_keywordCreate);
keywordRouter.put('/update', auth_keywordUpdate);
keywordRouter.delete('/delete', auth_keywordDelete);

//시각화 관리 라우터
router.get('/userAssessment', auth_userAssessment);
router.get('/viewRate', auth_viewRate);
router.get('/viewToken', );

router.use('/users', userRouter);
router.use('/quiz', quizRouter);
router.use('/subject', subjectRouter);
router.use('/round', roundRouter);
router.use('/keyword', keywordRouter);

module.exports = router;
