const fs = require('fs');
const path = require('path');

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

module.exports = {
    auth_promptView,
    auth_promptUpdate
}
