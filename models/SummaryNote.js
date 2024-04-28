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
const SummaryContent = require('./SummaryContent');
const User = require('./User');

const SummaryNote = sequelize.define('SummaryNote', {
    noteId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true
    },
    summaryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: SummaryContent,
          key: 'summaryId'
        }
    },
    userId: {
        type: DataTypes.STRING(50), // varchar(50)과 같은 타입으로 설정
        allowNull: false,
        references: {
          model: User,
          key: 'userId'
        }
    },
    summaryDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    summaryTitle: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'summaryNote'
})

module.exports = SummaryNote;
