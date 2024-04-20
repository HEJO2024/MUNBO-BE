const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {authenticateAccessToken} = require('../middlewares/authMiddleware'); //사용자 인증 미들웨어

// 회원가입
const join = (req, res) => {
    const {
        userId,
        passwd,
        userName,
        userEmail
    } = req.body;

    User.create({
        userId: userId,
        passwd: passwd,
        userName: userName,
        userEmail: userEmail,
        is_admin: 0
    })
    .then(user => { //user: User.create()의 결과 반환된 객체
        res.status(200).json({
            "message": "join success"
        });
    })
    .catch(err => {
        console.log(`${err}: server error: user join failed`);
        res.status(500).json({
            "message": "join failed"
        });
    })
}

//로그인
const login = async (req, res) => {
    const {userId, passwd} = req.body;

    try {
        const user = await User.findOne({
            where: {
                userId: userId,
                passwd: passwd
            },
            attributes: [
                'userId',
                'passwd',
                'userName',
                'userEmail',
                'is_admin'
            ]
        });

        if(!user) {
            return res.status(401).json({
                "message": "Unauthorized"
            })
        } else {
            const userInfo = {
                userId: user.userId,
                passwd: user.passwd,
                userName: user.userName,
                userEmail: user.userEmail,
                is_admin: user.is_admin
            }

            try {
                //accessToken 발급
                const accessToken = jwt.sign(
                    userInfo,
                    process.env.ACCESS_KEY, {
                        expiresIn: '1d',
                        issuer: 'About Tech'
                    }
                );

                // //refreshToken 발급
                // const refreshToken = jwt.sign(
                //     {userId: userInfo.userId},
                //     process.env.REFRESH_KEY, {
                //         expiresIn: '7d',
                //         issuer: 'About Tech'
                //     }
                // );

                // 서버의 응답에서 Authorization 헤더에 토큰을 설정하여 클라이언트에게 전송
                res.set('Authorization', 'Bearer ' + accessToken);
                
                res.status(200).json({
                    message: 'login success'
                })

            } catch(error) {
                console.log(error);
                res.status(500).json({
                    "message": "Internal Server Error"
                });
            }
        }
    } catch(err) {
        console.log(err);
        res.status(500).json({
            "message": "Internal Server Error"
        })
    }
}

// 아이디 중복 확인 엔드포인트
const checkDuplicateId = async (req, res) => {
    const { userId } = req.body;
    console.log(`userId: ${userId}`);

    try {
        //아이디 존재여부 확인
        const existingUser = await User.findOne({
            where: {
                userId: userId
            }
        });

        //console.log(`existingUser: ${existingUser.userId}`);

        if(existingUser) {
            //이미 아이디가 존재하는 경우
            return res.status(400).json({ "message": "Duplicate userId" }); //사용 불가
        } else {
            // 존재하지 않는 아이디인 경우
            return res.status(200).json({ "message": "Available userId" }); //사용 가능
        }
    } catch(err) {
        console.error('Error checking duplicate userId:', err);
        return res.status(500).json({ "message": "Server Error" });
    }
}

module.exports = {
    join,
    login,
    logout,
    checkDuplicateId
}
