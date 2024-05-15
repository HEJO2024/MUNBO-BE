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

// 파싱 함수
function parseQuizString(quizString) {
    const questions = quizString.split('\n\n'); // 각 문제는 빈 줄로 구분됨
    const quizData = [];

    for (const question of questions) {
        const lines = question.split('\n');
        const data = {};

        for (const line of lines) {
            if (line.startsWith('Q')) {
                data.question = line;
            } else if (line.startsWith('A)')) {
                data.options = data.options || [];
                data.options.push(line.substring(3)); // 선택지는 'A)', 'B)', ...로 시작하므로 해당 부분을 잘라냄
            } else if (line.startsWith('Answer:')) {
                data.answer = line.substring(8).trim(); // 정답은 'Answer:'로 시작하므로 해당 부분을 잘라냄
            }
        }

        quizData.push(data);
    }

    return quizData;
}

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
                is_correct: is_correct
            })
        } else {
            console.log(`solve record update success!`);
            await UserSolveRecord.update({
                userAnsw: userAnsw,
                is_correct: is_correct
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
    try {
        // 오답 기록에서 키워드 추출
        const w_quiz = await UserSolveRecord.findAll({
            where: {
                userId: req.userId,
                is_correct: 0
            },
            attributes: ['quizId']
        })

        let aiQuiz = [];

        (async () => {
            for (const quizItem of w_quiz) {
                const quizId = quizItem.quizId;
        
                const keywordId = await Quiz.findOne({
                    where: {
                        quizId: quizId
                    },
                    attributes: ['keywordId']
                });
        
                const keyword = await Keyword.findOne({
                    where: {
                        keywordId: keywordId.keywordId
                    }
                });

                let userInput = {
                    keywordName: keyword.keywordName,
                    keywordMean: keyword.keywordMean
                }

                const inputJson = JSON.stringify(userInput);
        
                const result = await new Promise((resolve, reject) => {
                    const process = spawn('python', ['./aidata/testQuiz.py', inputJson]);
                    process.stdout.on('data', (data) => {
                        const jsonString = data.toString();
                        // const jsonData = JSON.parse(jsonString.replace(/'/g, '"'));
                        resolve(jsonString);
                    });
                    process.on('error', reject);

                    process.stderr.on('data', (data) => {
                                console.error(`stderr: ${data}`);
                            });
                });
        
                console.log(`jsonData: ${result}`);
            }
        
            res.status(200).json({
                "message": "ok"
            });
        })();

        // for(const quizItem of w_quiz){
        //     const quizId = quizItem.quizId
            
        //     const keywordId = await Quiz.findOne({
        //         where: {
        //             quizId: quizId
        //         },
        //         attributes: ['keywordId']
        //     })

        //     const keyword = await Keyword.findOne({
        //         where: {
        //             keywordId: keywordId.keywordId
        //         }
        //     })
        //     console.log(`keyword: ${keyword.keywordMean}`)
        //     const result = spawn('python', ['./aidata/testQuiz.py', keyword.keywordMean]);

        //     result.stdout.on('data', (data) => {
        //         const jsonString = data.toString();
        //         const jsonData = JSON.parse(jsonString.replace(/'/g, '"'));

        //         console.log(`jsonData: ${jsonData}`);
        //     })
        // }

        // res.status(200).json({
        //     "message": "ok"
        // })

        // const quizId = w_quiz[0].quizId;
        //     console.log(`quizId: ${quizId}`);
        //     const keywordId = await Quiz.findOne({
        //         where: {
        //             quizId: quizId
        //         },
        //         attributes: ['keywordId']
        //     })

        //     const keyword = await Keyword.findOne({
        //         where: {
        //             keywordId: keywordId.keywordId
        //         },
        //         attributes: ['keywordName', 'keywordMean']
        //     })

        //     const result = spawn('python', ['./aidata/testQuiz.py', keyword.keywordMean]);

        //     result.stdout.on('data', (data) => {
        //         // 받아온 데이터는 Buffer 형식이므로 문자열로 변환
        //         const jsonString = data.toString();
        //         const jsonData = JSON.parse(jsonString.replace(/'/g, '"'));

        //         console.log(`data: ${data}`);
        //         console.log(`jsonData: ${jsonString}`);

        //         // aiQuiz.push(jsonData);

        //         res.status(200).json({
        //             jsonData
        //         })
        //     })

        //     result.stderr.on('data', (data) => {
        //         console.error(`stderr: ${data}`);
        //     });
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

        console.log(`quizType: ${quizData[0].quizType}`);

        res.status(200).json({
             "quizType": quizData[0].quizType,
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
