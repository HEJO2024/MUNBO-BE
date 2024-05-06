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
        const result = spawn('python3', ['./aidata/summaryQuiz.py', inputJson]);

        result.stdout.on('data', (data) => {
            const jsonData = data.toString();
            //생성문제 db 저장
            // for(i = 0 ; i < quizNum ; i++){
            //     if(quizType === 0){ //객관식
            //         AiQuiz.create({
            //             summaryId: summaryId,
            //             quizContent: jsonData[i].question,
            //             answ: Sequelize.literal(`JSON_SET(answ, "$.answ_1", ${jsonData[i].options[0]}, "$.answ_2", ${jsonData[i].options[1]}, "$.answ_3", ${jsonData[i].options[2]}, "$.answ_4", ${jsonData[i].options[3]})`),
            //             r_answ: jsonData[i].answ,
            //             quizType: quizType,
            //             userAssessment: 0
            //         })
            //     } else if(quizType === 1){ //주관식

            //     } else { //ox 

            //     }
            // }
            res.status(200).json({
                jsonData
            })
        })

        result.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
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
                summaryText: summaryContent.summaryText
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
    summary_listView,
    summaryView,
    summaryUpdate,
    summaryDelete
}
