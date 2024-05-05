const jwt = require('jsonwebtoken');
const { json } = require('sequelize');
require('dotenv').config();

// 토큰 유효성 검사
async function authenticateAccessToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) { // 토큰 없을 때(로그인X) -> 상태코드나 json 속성으로 토큰여부 알려줘서 클라이언트쪽에서 처리(사용자 관리자 동일하게 할 거라서,,)
        return res.status(401).json({
            "message": "there is no Token"
        });
    }

    jwt.verify(token, process.env.ACCESS_KEY, (err, user) => {
        if (err){
            console.log(`verify error`);
            if (err.name === 'TokenExpiredError') {
                // 토큰의 유효기간이 만료된 경우
                return res.status(401).json({
                    "message": "Token has expired."
                })
            } else {
                // 다른 인증 오류인 경우
                return res.status(403).json({
                    "message": "verify Error"
                });
            }
        }
        req.userId = user.userId;
        req.is_admin = user.is_admin;
        next();
    });
}

// 관리자용 계정 검증
async function authenticateAdmin(req, res, next) {
    if(!req.is_admin){
        res.status(403).json({
            "message": "Permission denied" // 권한 없음
        })
    } else {
        next();
    }
}

module.exports = {
    authenticateAccessToken,
    authenticateAdmin
}
