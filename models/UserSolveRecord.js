require('dotenv').config();

const { Sequelize, DataType, DataTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PWD, {
    host: process.env.DB_HOST,
    port : process.env.DB_PORT,
    dialect: 'mysql',
    define: {
        timestamps: false, // 기본적으로 타임스탬프를 생성하지 않도록 설정
        freezeTableName: true // 기본적으로 모델명을 테이블명으로 변환하지 않도록 설정
    }
});

const Quiz = require('./Quiz');
const User = require('./User');

const UserSolveRecord = sequelize.define('UserSolveRecord', {
    recordId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true
    },
    quizId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Quiz,
            key: 'quizId'
        }
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: User,
            key: 'userId'
        }
    },
    userAnsw: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    is_correct: {
        type: DataTypes.TINYINT(1),
        allowNull: false
    }
}, {
    tableName: 'userSolveRecord'
})

module.exports = UserSolveRecord;
