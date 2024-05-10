const { where } = require('sequelize');
const SummaryContent = require('../models/SummaryContent');
const SummaryNote = require('../models/SummaryNote');
const AiQuiz = require('../models/AiQuiz');
const spawn = require('child_process').spawn;
const Sequelize = require('sequelize');
const { json } = require('body-parser');

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

    SummaryNote.create({
        summaryId: summaryId,
        userId: req.userId,
        summaryTitle: summaryTitle,
        summaryDate: getCurrentDateTime()
    })
    .then(summary => {
        res.status(200).json({
            "message": "summaryText save success"
        })
    })
    .catch(err => {
        res.status(500).json({
            "message": "summaryText save failed"
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
        let f_python = './aidata/summaryQuiz_2.py';
        if(quizType === 0){
            f_python = './aidata/summaryQuiz.py'
        }
        const result = spawn('python3', [f_python, inputJson]);

        const quizDataArray = []; // 생성된 퀴즈 데이터를 저장할 배열

        result.stdout.on('data', async (data) => {
            const jsonString = data.toString();
            const jsonData = JSON.parse(jsonString.replace(/'/g, '"'));
            // 생성문제 db 저장
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
            },
            attributes: ['noteId', 'summaryTitle', 'summaryDate']
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

            const summaryData = {
                noteId: noteId,
                summaryId: summaryNote.summaryId,
                summaryDate: summaryNote.summaryDate,
                summaryText: summaryContent.summaryText,
                summaryTitle: summaryNote.summaryTitle
            }
            res.status(200).json({
                summaryData
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
