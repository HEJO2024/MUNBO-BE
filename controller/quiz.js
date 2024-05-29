const Quiz = require('../models/Quiz');
const UserSolveRecord = require('../models/UserSolveRecord');
const Round = require('../models/Round');
const Keyword = require('../models/Keyword');
const AiQuiz = require('../models/AiQuiz');
const QuizNote = require('../models/QuizNote');
const {Sequelize, Op, where} = require('sequelize');
const Subject = require('../models/Subject');
const { watchFile } = require('fs');
const { json } = require('body-parser');
const spawn = require('child_process').spawn;
const fs = require('fs');

const testSolve = async (req, res) => {
    req.session.solveQuiz = [];
    req.session.quizIndex = 0;
    const subjectIds = await Subject.findAll({
        attributes: ['subjectId']
    })

    try {
        for (const subjectItem of subjectIds) {
            const subjectId = subjectItem.subjectId
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
            let quizData = await Quiz.findOne({
                where: {
                    quizId: req.session.solveQuiz[req.session.quizIndex]
                }
            })
            req.session.quizIndex++;

            // const file = fs.readFileSync(__dirname + `../${quizData.quizImg}`);

            // if(quizData.quizImg){
            //     quizData.quizImg = `http://3.38.5.34:3000${quizData.quizImg}`;
            // }

            const keywordName = await Keyword.findOne({
                where: {
                    keywordId: quizData.keywordId
                },
                attributes: ['keywordName']
            })
            quizData.keywordId = keywordName.keywordName;

            const roundName = await Round.findOne({
                where: {
                    roundId: quizData.roundId
                },
                attributes: ['roundName']
            })
            quizData.roundId = roundName.roundName;

            const subjectName = await Subject.findOne({
                where: {
                    subjectId: quizData.subjectId
                }
            })
            quizData.subjectId = subjectName.subjectName;

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
    const { quizId, userAnsw, is_correct } = req.query;
    const is_correctInt = parseInt(is_correct);
    console.log(`is_correct: ${is_correct}`);
    console.log(`int?: ${is_correctInt}`);

    try {
        const userRecord = await UserSolveRecord.findOne({
            where: {
                quizId: quizId,
                userId: req.userId
            }
        })
        if(!userRecord){
            await UserSolveRecord.create({
                userId: req.userId,
                quizId: quizId,
                userAnsw: userAnsw,
                is_correct: is_correctInt
            })
        } else {
            console.log(`solve record update success!`);
            await UserSolveRecord.update({
                userAnsw: userAnsw,
                is_correct: is_correctInt
            }, {
                where: {
                    recordId: userRecord.recordId
                }
            })
        }

        console.log(`array: ${req.session.solveQuiz}`);
        console.log(`index: ${req.session.quizIndex}`);

        const quizData = await Quiz.findOne({
            where: {
                quizId: req.session.solveQuiz[req.session.quizIndex]
            }
        })

        const keywordName = await Keyword.findOne({
            where: {
                keywordId: quizData.keywordId
            },
            attributes: ['keywordName']
        })
        quizData.keywordId = keywordName.keywordName;

        const roundName = await Round.findOne({
            where: {
                roundId: quizData.roundId
            },
            attributes: ['roundName']
        })
        quizData.roundId = roundName.roundName;

        const subjectName = await Subject.findOne({
            where: {
                subjectId: quizData.subjectId
            }
        })
        quizData.subjectId = subjectName.subjectName;

        let lastQuiz = false;
        if(req.session.quizIndex === (req.session.solveQuiz.length - 1)){ //마지막 문제일 때
            lastQuiz = true;
        } else {
            req.session.quizIndex++;
        }

        console.log(`quizIndex: ${req.session.quizIndex}`);
        res.status(200).json({
            quizData,
            lastQuiz
        })
    } catch(err) {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    }
}

const checkLog = async (req, res) => {
    try {
        const count = await UserSolveRecord.count({
            where: {
                userId: req.userId
            }
        });
        quizLog = false;
        if(count > 0){ // 진단평가 기록 존재
            quizLog = true;
        }
        res.status(200).json({
            quizLog
        })
    } catch(err) {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    }
}

const aiQuiz_create = async (req, res) => {
    if(!req.session.record){
        req.session.record = 0;
    }
    req.session.cookie.maxAge = 3600000; //유효시간 한 시간

    try {
        const w_quiz = await UserSolveRecord.findAll({ // 기록에서 오답 추출
            where: {
                userId: req.userId,
                is_correct: 0
            },
            attributes: ['quizId']
        })

        if(w_quiz.length === 0){
            res.status(404).json({
                "message": "Incorrect history does not exist"
            })
        }

        const keywordId = await Quiz.findOne({ // 퀴즈에서 키워드 아이디 추출
            where: {
                quizId: w_quiz[req.session.record].quizId
            },
            attributes: ['keywordId']
        })

        

        console.log(`req.session.record: ${req.session.record}`);
        console.log(`record_length: ${w_quiz.length}`);
        let lastQuiz = false;
        if(req.session.record === w_quiz.length - 2){
            lastQuiz = true;
            req.session.record = 0;
        } else {
            req.session.record++;
        }

        let keyword = await Keyword.findOne({ // 키워드에서 세부 내용 추출
            where: {
                keywordId: keywordId.keywordId
            }
        })

        console.log(`keyword: ${keyword.keywordName}`)

        const result = spawn('python3', ['./aidata/testQuiz_4.py', keyword.keywordMean])

        result.stdout.on('data', async (data) => {
            const dataString = data.toString();

            // 마지막 숫자를 추출하기 위해 정규 표현식 사용
            const numberMatch = dataString.match(/(\d+)\s*$/);

            if(numberMatch){
                const number = numberMatch[1];
                console.log(`number: ${number}`);

                const jsonString = dataString.substring(0, numberMatch.index).trim();
                const jsonArray = JSON.parse(jsonString.replace(/'/g, '"'));
                const jsonData = jsonArray[0];
                console.log(`aiQuiz: ${jsonData}`);

                if (jsonData.answer) {
                    jsonData.answer = jsonData.answer.replace(/1/g, 'A');
                    jsonData.answer = jsonData.answer.replace(/2/g, 'B');
                    jsonData.answer = jsonData.answer.replace(/3/g, 'C');
                    jsonData.answer = jsonData.answer.replace(/4/g, 'D');
                    jsonData.answer = jsonData.answer.replace(/^([A-D])\).*/, '$1');
                }
    
                console.log(`jsondata: ${jsonData}`)
    
                AiQuiz.create({
                    quizContent: jsonData.question,
                    answ: {
                        answ_1: jsonData.options[0],
                        answ_2: jsonData.options[1],
                        answ_3: jsonData.options[2],
                        answ_4: jsonData.options[3]
                    },
                    r_answ: jsonData.answer,
                    quizType: 0,
                    keywordId: keywordId.keywordId,
                    userAssessment: 1,
                    wrgAnsw_explanation: jsonData.explanation
                })
                .then(create_quiz => {
                    const aiQuiz = {
                        quizId: create_quiz.quizId,
                        quizContent: create_quiz.quizContent,
                        answ: create_quiz.answ,
                        r_answ: create_quiz.r_answ,
                        wrgAnsw_explanation: create_quiz.wrgAnsw_explanation,
                        org_quizId: w_quiz[req.session.record].quizId,
                        lastQuiz: lastQuiz
                    }
                    aiQuiz.keywordName = keyword.keywordName
    
                    res.status(200).json({
                        aiQuiz
                    })
                })
                .catch(error => {
                    console.log(error);
                    res.status(500).json({
                        "message": "Internal server error"
                    })
                })

            } else {
                console.log(`No number found at the end of the string`);
                res.status(400).json({
                    "message": "No number found at the end of the string"
                })
            }
        })

        result.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        })
        
    } catch(err) {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    }
}

const aiQuiz_org = async (req, res) => {
    const { quizId } = req.query;

    try {
        const quizData = await Quiz.findOne({
            where: {
                quizId: quizId
            }
        })

        if(!quizData){
            res.status(404).json({
                "message": "The quiz data does not exist."
            })
        } else {
            const keywordName = await Keyword.findOne({
                where: {
                    keywordId: quizData.keywordId
                },
                attributes: ['keywordName']
            })
            quizData.keywordId = keywordName.keywordName;
    
            const roundName = await Round.findOne({
                where: {
                    roundId: quizData.roundId
                },
                attributes: ['roundName']
            })
            quizData.roundId = roundName.roundName;
    
            const subjectName = await Subject.findOne({
                where: {
                    subjectId: quizData.subjectId
                }
            })
            quizData.subjectId = subjectName.subjectName;

            if(quizData.quizImg){
                quizData.quizImg = `http://3.38.5.34:3000${quizData.quizImg}`;
            }

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

const aiQuiz_save = async (req, res) => {
    const { quizId } = req.body;

    try{
        const aiQuiz = await AiQuiz.findOne({
            where: {
                quizId: quizId,
                keywordId: {
                    [Sequelize.Op.ne]: null // not equal: 해당 값과 같지 않은 경우 검색(즉, keywordId 값이 null이 아닌 경우)
                }
            }
        })

        let is_summary = false
        if(!aiQuiz){ //summaryId 존재하는 경우
            is_summary = true;
        }

        await QuizNote.create({
            quizId: quizId,
            userId: req.userId,
            is_summary: is_summary
        })
        .then(quizNote => {
            res.status(200).json({
                "message": "quiz note save success"
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

const aiQuiz_delete = (req, res) => {
    const { quizId } = req.body;

    QuizNote.destroy({
        where: {
            quizId: quizId
        }
    })
    .then(quizNote => {
        if(quizNote){
            res.status(200).json({
                "message": "Note delete success"
            })
        } else {
            res.status(404).json({
                "message": "Note to delete does not exist"
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

const updateAssessment = (req, res) => {
    const { userAssessment, quizId } = req.body;

    try {
        if(userAssessment === false){
            AiQuiz.update({
                userAssessment: userAssessment
            }, {
                where: {
                    quizId: quizId
                }
            })
            .then(assessment => {
                res.status(200).json({
                    "message": "userAssessment reflect success"
                })
            })
            .catch(error => {
                console.log(error);
                res.status(500).json({
                    "message": "Internal server error"
                })
            })
        } else{
            res.status(200).json({
                "message": "There is no need to reflect user evaluation"
            })
        }
    } catch(err) {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    }
}

const aiQuiz_view = async (req, res) => {
    const { is_summary } = req.query;
    let is_sum = 0;

    if (is_summary != 0) {
        is_sum = 1;
    }

    console.log(`userId: ${req.userId}`)

    try {
        const quizIds = await QuizNote.findAll({
            where: {
                userId: req.userId,
                is_summary: is_sum
            },
            attributes: ['quizId']
        });

        const quizData = await AiQuiz.findAll({
            where: {
                quizId: quizIds.map(quizId => quizId.quizId),
                ...(is_summary != 0 && { summaryId: is_summary }) // is_summary가 0이 아닌 경우에만 summaryId 조건 추가
            }
        });

        let quizType = 0;
        if(is_summary != 0){
            quizType = quizData[0].quizType;
        }

        console.log(`quizType: ${quizType}`);

        res.status(200).json({
             "quizType": quizType,
             quizData
         });
    } catch (error) {
        console.log(error);
        res.status(500).json({ "message": "Internal server error" });
    }
}

const image_get = (req, res) => {

}

//관리자용
const auth_quizList = async (req, res) => {
    const { subjectId }  = req.query;

    try {
        const quiz = await Quiz.findAll({
            where: {
                subjectId: subjectId
            },
            attributes: ['quizId', 'quizContent']
        })
        if(!quiz){
            res.status(404).json({
                "message": "there is no quiz"
            })
        } else {
            res.status(200).json({
                quiz
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
    const { quizId } = req.query;

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

const auth_userAssessment = async (req, res) => {
    try{
        // 전체 컬럼 개수 가져오기
        AiQuiz.count().then(totalCount => {
            console.log(`total: ${totalCount}`);

            AiQuiz.count({
                where: {
                    userAssessment: 0
                }
            })
            .then(count => {
                console.log(`count: ${count}`)

                const assessmentData = {
                    totalCount: totalCount,
                    count: count
                }
    
                res.status(200).json({
                    assessmentData
                })
            })
            .catch(error => {
                console.log(err);
                res.status(500).json({
                    "message": "Internal server error"
                })
            })
        });
    } catch(err){
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    }
}

const auth_viewRate = async (req, res) => {
    try{
        const subjects = await Subject.findAll({
            attributes: ['subjectId', 'subjectName']
        })
        
        let rateData = [];
        for(const subjectItem of subjects){
            const subjectId = subjectItem.subjectId
            const subjectName = subjectItem.subjectName

            const count = await UserSolveRecord.count({
                // quizId를 100으로 나눈 나머지에 따라 subjectId 결정
                where: {
                    quizId: Sequelize.literal(`quizId % 100 BETWEEN ${(subjectId - 1) * 20 + 1} AND ${subjectId * 20}`)
                }
            })

            const wrgCount = await UserSolveRecord.count({
                // quizId를 100으로 나눈 나머지에 따라 subjectId 결정
                where: {
                    quizId: Sequelize.literal(`quizId % 100 BETWEEN ${(subjectId - 1) * 20 + 1} AND ${subjectId * 20}`),
                    is_correct: 0
                }
            })

            rateData.push({
                subjectId: subjectId,
                subjectName: subjectName,
                totalCount: count,
                wrgCount: wrgCount
            })
        }

        res.status(200).json({
            rateData
        })
    } catch(err){
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    }

}

module.exports = {
    testSolve,
    testNext,
    checkLog,
    aiQuiz_create,
    aiQuiz_org,
    aiQuiz_save,
    aiQuiz_delete,
    updateAssessment,
    aiQuiz_view,
    image_get,
    auth_quizList,
    auth_quizView,
    auth_quizUpdate,
    auth_quizDelete,
    auth_userAssessment,
    auth_viewRate
}
