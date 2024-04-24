const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
    const jsonData = req.body;
    console.log(jsonData);
    // const {userId, passwd} = req.body;

    try {
        const user = await User.findOne({
            where: {
                userId: jsonData.userId,
                passwd: jsonData.passwd
                // userId: userId,
                // passwd: passwd
            },
            attributes: [
                'userId', 'passwd', 'userName', 'userEmail', 'is_admin'
            ]
        });

        if(!user) {
            return res.status(401).json({
                "message": "아이디나 비밀번호가 일치하지 않습니다."
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
                    "message": "Internal Server Error(로그인 서버 오류)"
                });
            }
        }
    } catch(err) {
        console.log(err);
        res.status(500).json({
            "message": "Internal Server Error(로그인 서버 오류2)"
        })
    }
}

// 회원정보 수정
const userUpdate = async (req, res) => {
    try {
        const user = await User.findOne({
            where: {
                userId: req.userId
            },
            attributes: [
                'userId', 'passwd', 'userName', 'userEmail'
            ]
        });
        if(!user){
            res.status(404).json({
                "message": "요청하는 아이디에 대한 회원정보가 없습니다"
            })
        } else {
            userInfo = {
                userId: user.userId,
                passwd: user.passwd,
                userName: user.userName,
                userEmail: user.userEmail
            }
            res.status(200).json({
                userInfo
            })
        }
    } catch(err) {
        console.log(err);
        res.status(500).json({
            "message": "Internal Server Error"
        })
    }
}

const userUpdate_process = (req, res) => {
    const { passwd, userName } = req.body;

    User.update({
        passwd: passwd,
        userName: userName
    }, {
        where: {
            userId: req.userId
        }
    })
    .then(user => {
        if(!user){
            res.status(404).json({
                "message": "해당하는 유저 아이디가 없습니다"
            })
        } else {
            res.status(200).json({
                "message": "회원정보 수정 완료"
            })
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            "message": "Internal Server Error"
        })
    })
}

// 회원 탈퇴
const userDelete = (req, res) => {
    User.destroy({
        where: {
            userId: req.userId
        }
    })
    .then(user => {
        if(!user){
            res.status(404).json({
                "message": "해당하는 유저 아이디가 없습니다"
            })
        } else {
            res.status(200).json("회원탈퇴 성공")
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            "message": "Internal Server Error"
        })
    })
}

// 아이디 중복 확인
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

// --------------관리자용--------------

// 로그인
const authLogin =  async (req,res) => {
    const { userId, passwd } = req.body;

    try {
        const user = await User.findOne({
            where: {
                userId: userId,
                passwd: passwd,
                is_admin: 1
            },
            attributes: [
                'userId', 'passwd', 'userName', 'userEmail', 'is_admin'
            ]
        });

        if(!user){ //로그인 실패
            return res.status(401).json({
                "message": "일반 사용자는 관리자 페이지에 접근할 수 없습니다"
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

                // 서버의 응답에서 Authorization 헤더에 토큰을 설정하여 클라이언트에게 전송
                res.set('Authorization', 'Bearer ' + accessToken);
                
                res.status(200).json({
                    message: 'admin login success'
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
            "message": "Server Error"
        })
    }
}

// 회원정보 목록 출력
const authListView = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['userId', 'passwd', 'userName', 'userEmail', 'is_admin']
        });
        res.status(200).json({
            users
        })
    } catch(err) {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    }
}

// 회원정보 수정 화면
const authUserUpdate = async (req, res) => {
    const { userId } = req.body;

    try {
        const user = await User.findOne({
            where: {
                userId
            },
            attributes: [
                'userId', 'passwd', 'userName', 'userEmail', 'is_admin'
            ]
        });

        const userInfo = {
            userId: user.userId,
            passwd: user.passwd,
            userName: user.userName,
            userEmail: user.userEmail,
            is_admin: user.is_admin
        };

        res.status(200).json({
            userInfo
        })
    } catch(err) {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    }
}

// 회원정보 수정 요청
const authUserUpdate_process = (req, res) => {
    const { basic_userId, userId, passwd, userName, userEmail, is_admin } = req.body; //기존 userId도 보내줘야.

    User.update({
        userId: userId,
        passwd: passwd,
        userName: userName,
        userEmail: userEmail,
        is_admin: is_admin
    }, {
        where: {
            userId: basic_userId
        }
    })
    .then(user => {
        res.status(200).json({
            "message": "회원정보 수정 성공"
        })
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    }) 
}

// 회원정보 삭제
const authUserDelete = (req, res) => {
    const { userId } = req.body;

    User.destroy({
        where: {
            userId
        }
    })
    .then(user => {
        if(!user){
            res.status(404).json({
                "message": "삭제할 사용자가 존재하지 않습니다"
            })
        } else{
            res.status(200).json({
                "message": "회원정보 삭제 완료"
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
    join,
    login,
    userUpdate,
    userUpdate_process,
    userDelete,
    checkDuplicateId,
    authLogin,
    authListView,
    authUserUpdate,
    authUserUpdate_process,
    authUserDelete
}
