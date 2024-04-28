require('dotenv').config();

const { STRING } = require('sequelize');
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

const Quiz = sequelize.define('Quiz', {
    quizId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true
    },
    quizContent: {
        type: DataTypes.STRING,
        allowNull: false
    },
    quizImg: {
        type: DataTypes.STRING,
        allowNull: true
    },
    answ_1: {
        type: DataTypes.STRING,
        allowNull: false
    },
    answ_2: {
        type: DataTypes.STRING,
        allowNull: false
    },
    answ_3: {
        type: DataTypes.STRING,
        allowNull: false
    },
    answ_4: {
        type: DataTypes.STRING,
        allowNull: false
    },
    r_answ: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    wrgAnsw_explanation: {
        type: DataTypes.STRING,
        allowNull: false
    },
    keywordId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    subjectId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    roundId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'quiz'
})

module.exports = Quiz;
