require('dotenv').config();

const { STRING } = require('sequelize');
const { Sequelize, DataType, DataTypes, Op } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PWD, {
    host: process.env.DB_HOST,
    port : process.env.DB_PORT,
    dialect: 'mysql',
    define: {
        timestamps: false, // 기본적으로 타임스탬프를 생성하지 않도록 설정
        freezeTableName: true // 기본적으로 모델명을 테이블명으로 변환하지 않도록 설정
    }
});

const Gpt_token = sequelize.define('Gpt_token', {
    tokenId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        unique: true,
        autoIncrement: true
    },
    token_usage: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'gpt_token'
})

module.exports = Gpt_token;
