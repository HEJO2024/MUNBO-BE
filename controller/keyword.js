const Keyword = require('../models/Keyword');

const auth_keywordList = async (req, res) => {
    try{
        const keyword = await Keyword.findAll({
            attributes: ['keywordId', 'keywordName', 'keywordMean']
        })
        res.status(200).json({
            keyword
        })
    } catch(err) {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    }
}

const auth_keywordView  = async (req, res) => {
    const { keywordId } = req.query;

    try {
        const keyword = await Keyword.findOne({
            where: {
                keywordId: keywordId
            },
            attributes: ['keywordId', 'keywordName', 'keywordMean']
        })
        if(!keyword){
            res.status(404).json({
                "message": "there is no keyword"
            })
        } else {
            res.status(200).json({
                keyword
            })
        }
    } catch(err) {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    }
}

const auth_keywordCreate = (req, res) => {
    const { keywordName, keywordMean } = req.body;

    Keyword.create({
        keywordName: keywordName,
        keywordMean: keywordMean
    })
    .then(keyword => {
        res.status(200).json({
            "message": "keyword create success"
        })
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    })
}

const auth_keywordUpdate = (req, res) => {
    const { keywordId, keywordName, keywordMean } = req.body;

    Keyword.update({
        keywordName: keywordName,
        keywordMean: keywordMean
    }, {
        where: {
            keywordId: keywordId
        }
    })
    .then(keyword => {
        res.status(200).json({
            "message": "keyword update success"
        })
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    })
}

const auth_keywordDelete = (req, res) => {
    const { keywordId } = req.body;

    Keyword.destroy({
        where: {
            keywordId: keywordId
        }
    })
    .then(keyword => {
        res.status(200).json({
            "message": "there is no keyword"
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
    auth_keywordList,
    auth_keywordView,
    auth_keywordCreate,
    auth_keywordUpdate,
    auth_keywordDelete
}
