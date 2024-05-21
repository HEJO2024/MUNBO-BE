const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');

const Gpt_token = require('../models/Gpt_token');
const Quiz = require('../models/Quiz');
const Keyword = require('../models/Keyword');

const auth_promptView = (req, res) => {
    const fileName = 'testQuiz_prompt.txt';

    const folderPath = "./src";
    const filePath = `${folderPath}/${fileName}`;

    fs.stat(filePath, (err, stats) => { // 폴더 정보 가져옴
        if(err || !stats.isFile()){
            res.status(404).json({
                "message": "File not found"
            });
            return;
        }

        fs.readFile(filePath, 'utf-8', (err, data) => { // 파일 내용 읽기
            if(err){
                console.error('Error read file: ', err);
                res.status(500).json({
                    "message": "Error reading file"
                });
                return;
            }

            const prompt = data;

            console.log(`data: ${data}`);
            res.status(200).json({
                prompt
            })
        })
    })
}

const auth_promptUpdate = (req, res) => {
    const { prompt } = req.body; // 사용자가 변경하려는 텍스트를 요청에서 가져옴
    const fileName = 'testQuiz_prompt.txt';

    const folderPath = "./src";
    const filePath = `${folderPath}/${fileName}`;

    fs.stat(filePath, (err, stats) => {
        if(err || !stats.isFile()){ // 파일이 존재하지 않으면 에러 메시지를 반환
            res.status(404).json({
                "message": "File not found"
            });
            return;
        }

        // 파일 내용 읽기
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if(err){
                console.error('Error reading file: ', err);
                res.status(500).json({
                    "message": "Error reading file"
                });
                return;
            }

            const updatedText = prompt; // 변경할 텍스트로 대체

            // 변경된 내용 파일에 쓰기
            fs.writeFile(filePath, updatedText, 'utf-8', err => {
                if(err){
                    console.error('Error writing file: ', err);
                    res.status(500).json({
                        "error": "Error writing file"
                    });
                    return;
                }

                console.log(`File ${filePath} updated successfully`);

                res.status(200).json({
                    "message": "File updated successfully"
                });
            });
        });
    });
};

const auth_viewToken = async (req, res) => {
    let totalToken = 0;

    try {   
        const tokens = await Gpt_token.findAll({
            attributes: ['token_usage']
        })

        if(!tokens){
            res.status(404).json({
                "message": "Token Usage record doesn't exist."
            })
        } else {
            for(const token of tokens){
                const token_usage = token.token_usage;

                totalToken += token_usage;
            }

            console.log(`total Token Usage: ${totalToken}`);

            res.status(200).json({
                totalToken
            })
        }
    } catch(err) {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    }
}

const auth_csv = async (req, res) => {
    const { quizzes } = req.body;

    let quizArray = [];

    for(const quizItem of quizzes){
        const quizId = quizItem;

        const quiz = await Quiz.findOne({
            where: {
                quizId: quizId
            }
        })

        const keywordName = await Keyword.findOne({
            where: {
                keywordId: quiz.keywordId
            }
        })

        const quizData = {
            quizId: quiz.quizId,
            quizContent: quiz.quizContent,
            answ_1: quiz.answ_1,
            answ_2: quiz.answ_2,
            answ_3: quiz.answ_3,
            answ_4: quiz.answ_4,
            r_answ: quiz.r_answ,
            roundId: "2024-01-01",
            keyword: keywordName.keywordName,
            wrgAnsw_explanation: quiz.wrgAnsw_explanation
        }

        quizArray.push(quizData);
    }

    const csvWriter = createObjectCsvWriter({
        path: './src/2022_1_for_test.csv',
        header: [
            { id: 'quizId', title: '문제번호' },
            { id: 'quizContent', title: '문제' },
            { id: 'answ_1', title: '선지1' },
            { id: 'answ_2', title: '선지2' },
            { id: 'answ_3', title: '선지3' },
            { id: 'answ_4', title: '선지4' },
            { id: 'r_answ', title: '정답' },
            { id: 'roundId', title: '시험회차' },
            { id: 'keyword', title: '키워드' },
            { id: 'wrgAnsw_explanation', title: '해설' }
        ],
        encoding: 'utf8' // 명시적으로 UTF-8 설정
    })

    await csvWriter.writeRecords(quizArray);
        console.log('csv file was written successfully');
        res.status(200).send('CSV 파일이 성공적으로 작성되었습니다');
}

module.exports = {
    auth_promptView,
    auth_promptUpdate,
    auth_viewToken,
    auth_csv
}
