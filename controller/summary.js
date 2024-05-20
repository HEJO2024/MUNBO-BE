const { where } = require('sequelize');
const SummaryContent = require('../models/SummaryContent');
const SummaryNote = require('../models/SummaryNote');
const AiQuiz = require('../models/AiQuiz');
const spawn = require('child_process').spawn;
const Sequelize = require('sequelize');
const { json } = require('body-parser');
const QuizNote = require('../models/QuizNote');
const Gpt_token = require('../models/Gpt_token');

function getCurrentDateTime() {
    const currentDate = new Date();
    return currentDate.toISOString().slice(0, 19).replace('T', ' ');
  }

  // 키워드 추출
function extractKeywords(text) {
return text.split(''); // 단어가 아닌 한 글자씩 나눔
}

// 두 배열 간의 공통 요소 비율 계산
function calculateSimilarity(arr1, arr2) {
    const commonKeywords = arr1.filter(word => arr2.includes(word));
    return commonKeywords.length / Math.max(arr1.length, arr2.length);
}

const summaryCreate = (req, res) => { //요약본 생성
    const { text } = req.body;

    const userInput = {
        text: text
    }

    const inputJson = JSON.stringify(userInput);

    const result = spawn('python3', ['./aidata/summary.py', inputJson]);

    result.stdout.on('data', (data) => {
        // 받아온 데이터는 Buffer 형식이므로 문자열로 변환
    const jsonData = data.toString();
    console.log(`jsonData: ${jsonData}`);

    //원본 텍스트와 요약본 db저장
    SummaryContent.create({
        summaryText: jsonData,
        summary_originText: text
    })
    .then(summary => {
        res.status(200).json({
            "summaryText": summary.summaryText,
            "summaryId": summary.summaryId,
            "message": "summaryText create success"
            })
    })
    .catch(err => {
        res.status(500).json({
            "message": "summaryText create failed"
        })
    })
})
    result.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });
}

const noteCreate = (req, res) => {
    const { summaryId, summaryTitle } = req.body;

    SummaryNote.findOne({
        where: {
            summaryId: summaryId
        }
    })
    .then(existingNote => {
        if(existingNote){
            res.status(200).json({
                "message": "summary note already exists"
            })
        } else {
            SummaryNote.create({
                summaryId: summaryId,
                userId: req.userId,
                summaryTitle: summaryTitle,
                summaryDate: getCurrentDateTime()
            })
            .then(summary => {
                res.status(200).json({
                    "message": "summary note save success"
                });
            })
            .catch(err => {
                res.status(500).json({
                    "message": "summary note save failed"
                });
        })
    }})
    .catch(err => {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    })
}

const summaryQuiz_create = async (req, res) => {
    const { summaryId, Q_language, quizNum, userRequirements, quizType } = req.body;

    //summaryContent에서 원본 텍스트 추출
    const text = await SummaryContent.findOne({
        where: {
            summaryId: summaryId
        },
        attributes: [ 'summary_originText' ]
    })

    if(!text){
        return res.status(404).json({
            "message": "there is no summaryText"
        })
    } else {
        const userInput = {
            text: text,
            Q_language: Q_language,
            quizNum: quizNum,
            userRequirements: userRequirements,
            quizType: quizType
        }
        const inputJson = JSON.stringify(userInput);
        let f_python = './aidata/summaryQuiz_4.py';
        if(quizType === 0){
            f_python = './aidata/summaryQuiz_3.py'
        }
        const result = spawn('python3', [f_python, inputJson]);

        const quizDataArray = []; // 생성된 퀴즈 데이터를 저장할 배열

        result.stdout.on('data', async (data) => {
            const dataString = data.toString();

            // 마지막 숫자를 추출하기 위해 정규 표현식 사용
            const numberMatch = dataString.match(/(\d+)\s*$/);

            if(numberMatch){
                const number = numberMatch[1];

                // 토큰 사용량 db 저장
                const token = await Gpt_token.create({
                    token_usage: number
                })

                console.log(`token: ${token.token_usage}`);

                const jsonString = dataString.substring(0, numberMatch.index).trim();

                const jsonData = JSON.parse(jsonString.replace(/'/g, '"'));

                //생성문제 db 저장
                for (let i = 0; i < quizNum; i++) {
                    if (quizType === 0) { // 객관식
                        await AiQuiz.create({
                            summaryId: summaryId,
                            quizContent: jsonData[i].question,
                            answ: {
                                answ_1: jsonData[i].options[0],
                                answ_2: jsonData[i].options[1],
                                answ_3: jsonData[i].options[2],
                                answ_4: jsonData[i].options[3]
                            },
                            r_answ: jsonData[i].answer,
                            quizType: quizType,
                            userAssessment: 1
                        })
                        .then(quizData => {
                            quizDataArray.push(quizData); // 생성된 퀴즈 데이터를 배열에 추가
                            console.log(`aiQuiz save success`);
            
                            if (quizDataArray.length === quizNum) {
                                res.status(200).json({
                                    "quizData": quizDataArray
                                });
                            }
                        })
                        .catch(error => {
                            console.log(error);
                            res.status(500).json({
                                "message": "Internal server error"
                            })
                        })
                    } else { // 주관식
                        await AiQuiz.create({
                            summaryId: summaryId,
                            quizContent: jsonData[i].question,
                            r_answ: jsonData[i].answer,
                            quizType: quizType,
                            userAssessment: 1
                        })
                        .then(quizData => {
                            quizDataArray.push(quizData); // 생성된 퀴즈 데이터를 배열에 추가
                            console.log(`aiQuiz save success`);
            
                            if (quizDataArray.length === quizNum) {
                                res.status(200).json({
                                    "quizData": quizDataArray
                                });
                            }
                        })
                        .catch(error => {
                            console.log(error);
                            res.status(500).json({
                                "message": "Internal server error"
                            })
                        })
                    }
                }
            } else {
                console.error("No number found at the end of the string");
                res.status(400).json({
                    "message": "No number found at the end of the string"
                })
            }
        })

        result.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
    }
}

const summary_grading = async (req, res) => {
    const { userAnsw, quizId } = req.body;

    try {
        const c_answ = await AiQuiz.findOne({
            where: {
                quizId: quizId
            },
            attributes: [ 'r_answ' ]
        })

        // 키워드 추출
        const userKeywords = extractKeywords(userAnsw);
        const correctKeywords = extractKeywords(c_answ.r_answ);

        // 유사도 계산
        const similarity = calculateSimilarity(userKeywords, correctKeywords);
        console.log('유사도:', similarity);

        let is_correct = false;
        if(similarity >= 0.7) {
            is_correct = true;
        }

        res.status(200).json({
            is_correct
        })
    } catch(err) {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    }
}

const summary_listView = async (req, res) => {
    try {
        const summaryList = await SummaryNote.findAll({
            where: {
                userId: req.userId
            }
        });
        res.status(200).json({
            summaryList
        })
    } catch(err) {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    }
}

const summaryView = async (req, res) => {
    const { noteId } = req.query;

    try {
        const summaryNote = await SummaryNote.findOne({
            where: {
                noteId: noteId
            },
            attributes: ['summaryId', 'summaryDate', 'summaryTitle']
        })
        try {
            const summaryContent = await SummaryContent.findOne({
                where: {
                    summaryId: summaryNote.summaryId
                },
                attributes: ['summaryText']
            })

            // 저장 문제 존재 여부 확인
            const aiQuizzes = await AiQuiz.findAll({
                where: {
                    summaryId: summaryNote.summaryId
                },
                attributes: ['quizId']
            })

            let is_quizExists = false

            for(const quizItem of aiQuizzes){
                const quizId = quizItem.quizId

                const quiz = await QuizNote.count({
                    where: {
                        quizId: quizId
                    },
                    attributes: ['noteId']
                })

                if(quiz > 0){
                    is_quizExists = true
                }
            }

            const summaryData = {
                noteId: noteId,
                summaryId: summaryNote.summaryId,
                summaryDate: summaryNote.summaryDate,
                summaryText: summaryContent.summaryText,
                summaryTitle: summaryNote.summaryTitle
            }
            res.status(200).json({
                summaryData,
                "quizExists": is_quizExists
            })
        } catch(error) {
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

const summaryUpdate = (req, res) => {
    const { summaryText, summaryId } = req.body

    try {
        SummaryContent.update({
            summaryText: summaryText
        },{
            where: {
                summaryId: summaryId
            }
        })
        .then(summary => {
            res.status(200).json({
                "message": "summaryText update success"
            })
        })
        .catch(err => {
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

const summaryDelete = (req, res) => {
    const { noteId } = req.body;

    SummaryNote.destroy({
        where: {
            noteId: noteId
        }
    })
    .then(summary => {
        if(!summary){
            res.status(404).json({
                "message": "there is no summaryNote"
            })
        } else{
            res.status(200).json({
                "message": "summaryNote delete success"
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
    summaryCreate,
    noteCreate,
    summaryQuiz_create,
    summary_grading,
    summary_listView,
    summaryView,
    summaryUpdate,
    summaryDelete
}
