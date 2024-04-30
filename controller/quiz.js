const Quiz = require('../models/Quiz');
const UserSolveRecord = require('../models/UserSolveRecord');
const Round = require('../models/Round');
const Keyword = require('../models/Keyword');
// const Sequelize = require('sequelize');
const { watchFile } = require('fs');

const testSolve = async (req, res) => {
    req.session.solveQuiz = [];
    req.session.quizIndex = 0;
    const subjectIds = [1, 2, 3, 4, 5];

    try {
        for (const subjectId of subjectIds) {
            const quizzes = await Quiz.findAll({
                attributes: ['quizId'], // 기본키인 quizId만 가져오기
                where: { subjectId }, // subjectId에 따라 필터링
                order: Sequelize.literal('RAND()'), // 랜덤 순서로 정렬
                limit: 10 // 각 과목에서 10개의 퀴즈만 선택
            });
            req.session.solveQuiz.push(...quizzes.map(quiz => quiz.quizId)); // 선택된 퀴즈의 quizId만 배열에 추가
        }
        console.log(`req.session.solveQuiz create`);
        try{
            const quizData = await Quiz.findOne({
                where: {
                    quizId: req.session.solveQuiz[req.session.quizIndex]
                },
                attributes: ['quizId', 'quizContent', 'answ_1', 'answ_2', 'answ_3', 'answ_4', 'r_answ', 'wrgAnsw_explanation' ]
            })
            req.session.quizIndex++;
            if(!quizData){
                res.status(404).json({
                    "message": "there is no quiz"
                })
            } else {
                res.status(200).json({
                    quizData,
                    "lastQuiz": false
                })
            }
        } catch(error){
            console.log(error);
            res.status(500).json({
                "message": "Internal server error"
            })
        }
    } catch(err) {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    }
}

const testNext = async (req, res) => {
    const { quizId, userAnsw, is_correct } = req.body;

    try {
        await UserSolveRecord.create({
            userId: req.userId,
            quizId: quizId,
            userAnsw: userAnsw,
            is_correct: is_correct
        })
        .then(async record => {
            const quizData = await Quiz.findOne({
                where: {
                    quizId: req.session.solveQuiz[req.session.quizIndex]
                },
                attributes: ['quizId', 'quizContent', 'answ_1', 'answ_2', 'answ_3', 'answ_4', 'r_answ', 'wrgAnsw_explanation']
            })
            let lastQuiz = false;
            if(req.session.quizIndex === (req.session.solveQuiz.length - 1)){ //마지막 문제일 때
                lastQuiz = true;
            } else {
                req.session.quizIndex++;
            }
            console.log(`quizIndex: ${req.session.quizIndex}`);
            res.status(200).json({
                quizData,
                "lastQuiz": lastQuiz
            })
        })
        .catch(error => {
            console.log(error);
        res.status(500).json({
            "message": "Internal server error"
        })
        })
    } catch(err) {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    }
}

//관리자용
const auth_quizList = async (req, res) => {
    const { subjectId } = req.body;

    try {
        const quizList = await Quiz.findAll({
            where: {
                subjectId: subjectId
            },
            attributes: ['quizId', 'quizContent']
        })
        if(!quizList){
            res.status(404).json({
                "message": "there is no quiz"
            })
        } else {
            res.status(200).json({
                quizData
            })
        }
    } catch(err) {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    }
}

const auth_quizView = async (req, res) => {
    const { quizId } = req.body;

    try {
        const quiz = await Quiz.findOne({
            where: {
                quizId: quizId
            },
            attributes: ['quizId', 'quizContent', 'roundId', 'answ_1', 'answ_2', 'answ_3', 'answ_4', 'r_answ', 'wrgAnsw_explanation', 'keywordId']
        })
        if(!quiz){
            res.status(404).json({
                "message": "there is no quiz"
            })
        } else {
            const roundName = await Round.findOne({
                where: {
                    roundId: quiz.roundId
                },
                attributes: ['roundName']
            })
            const keywordName = await Keyword.findOne({
                where: {
                    keywordId: quiz.keywordId
                }
            })
            res.status(200).json({
                quiz,
                roundName,
                keywordName
            })
        }
    } catch(err) {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    }
}

const auth_quizUpdate = (req, res) => {
    const { quizId, quizContent, answ_1, answ_2, answ_3, answ_4, r_answ, wrgAnsw_explanation } = req.body;

    Quiz.update({
        quizContent: quizContent,
        answ_1: answ_1,
        answ_2: answ_2, 
        answ_3: answ_3,
        answ_4: answ_4,
        r_answ: r_answ,
        wrgAnsw_explanation: wrgAnsw_explanation
    }, {
        where: {
            quizId: quizId
        }
    })
    .then(quiz => {
        res.status(200).json({
            "message": "quiz data update success"
        })
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    })        
}

const auth_quizDelete = (req, res) => {
    const { quizId } = req.body;

    Quiz.destroy({
        where: {
            quizId: quizId
        }
    })
    .then(quiz => {
        if(!quiz){
            res.status(404).json({
                "message": "there is no quiz"
            })
        } else {
            res.status(200).json({
                "message": "quiz delete success"
            })
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    })
}

module.exports = {
    testSolve,
    testNext,
    auth_quizList,
    auth_quizView,
    auth_quizUpdate,
    auth_quizDelete
}
