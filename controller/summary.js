const { where } = require('sequelize');
const SummaryContent = require('../models/SummaryContent');
const SummaryNote = require('../models/summaryNote');
const spawn = require('child_process').spawn;

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

    const result = spawn('python', ['./aidata/summary.py', inputJson]);

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
    const { summaryId, summaryLanguage, quizNum, userRequest, quizType } = req.body;

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
            text: text.summary_originText,
            Q_language: summaryLanguage,
            quizNum: quizNum,
            userRequirements: userRequest,
            quizType: quizType
        }
        const inputJson = JSON.stringify(userInput);
        const result = spawn('python', ['./aidata/summaryQuiz.py', inputJson]);

        result.stdout.on('data', (data) => {
            const jsonData = data.toString();
            console.log(`jsonData: ${jsonData}`);



            res.end('success');
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
    const { noteId } = req.body;

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
