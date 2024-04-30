const Round = require('../models/Round');

const auth_roundList = async (req, res) => {
    try {
        const round = await Round.findAll({
            attributes: ['roundId', 'roundName']
        })
        res.status(200).json({
            round
        })
    } catch(err) {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    }
}

const auth_roundView = async (req, res) => {
    const { roundId } = req.body;

    try{
        const round = Round.findOne({
            where: {
                roundId: roundId
            },
            attributes: ['roundId', 'roundName']
        })
        if(!round){
            res.status(404).json({
                "message": "there is no round"
            })
        } else {
            res.status(200).json({
                round
            })
        }
    } catch(err) {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    }
}

const auth_roundCreate = (req, res) => {
    const { roundName } = req.body;

    Round.create({
        roundName: roundName
    })
    .then(round => {
        res.status(200).json({
            "message": "round create success"
        })
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    })
}

const auth_roundUpdate = (req, res) => {
    const { roundId, roundName } = req.body;

    Round.update({
        roundName: roundName
    }, {
        where: {
            roundId: roundId
        }
    })
    .then(round => {
        res.status(200).json({
            "message": "round update success"
        })
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    })
}

const auth_roundDelete = (req, res) => {
    const { roundId } = req.body;

    Round.destroy({
        where: {
            roundId: roundId
        }
    })
    .then(round => {
        res.status(200).json({
            "message": "round delete success"
        })
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    })
}

module.exports = {
    auth_roundList,
    auth_roundView, 
    auth_roundCreate, 
    auth_roundUpdate, 
    auth_roundDelete
}
