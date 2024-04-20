const jwt = require('jsonwebtoken');
const { json } = require('sequelize');
require('dotenv').config();

async function authenticateAccessToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        return res.status(401).json({
            "message": "there is no Token"
        });
    }

    jwt.verify(token, process.env.ACCESS_KEY, (err, user) => {
        if (err){
            console.log(`verify error`);
            if (err.name === 'TokenExpiredError') {
                // 토큰의 유효기간이 만료된 경우
                return res.redirect('/users/logout');
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

module.exports = {
    authenticateAccessToken
}
