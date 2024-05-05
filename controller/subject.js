const Subject = require('../models/Subject');

const auth_subjectList = async (req, res) => {
    try {
        const subjectList = await Subject.findAll({
            attributes: ['subjectId', 'subjectName']
        })
        res.status(200).json({
            subjectList
        })
    } catch(err) {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    }
}

const auth_subjectView = async (req, res) => {
    const { subjectId } = req.query;

    try {
        const subject = await Subject.findOne({
            where: {
                subjectId: subjectId
            },
            attributes: ['subjectId', 'subjectName']
        })
        if(!subject){
            res.status(404).json({
                "message": "there is no subject"
            })
        } else {
            res.status(200).json({
                subject
            })
        }
    } catch(err) {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    }
}

const auth_subjectCreate = (req, res) => {
    const { subjectName } = req.body;

    Subject.create({
        subjectName: subjectName
    })
    .then(subject => {
        res.status(200).json({
            "message": "subject create success"
        })
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    })
}

const auth_subjectUpdate = (req, res) => {
    const { subjectId, subjectName } = req.body;

    Subject.update({
        subjectName: subjectName
    }, {
        where: {
            subjectId: subjectId
        }
    })
    .then(subject => {
        res.status(200).json({
            "message": "subject update success"
        })
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            "message": "Internal server error"
        })
    })
}

const auth_subjectDelete = (req, res) => {
    const { subjectId } = req.body;

    Subject.destroy({
        where: {
            subjectId: subjectId
        }
    })
    .then(subject => {
        res.status(200).json({
            "message": "subject delete success"
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
    auth_subjectList,
    auth_subjectView,
    auth_subjectCreate,
    auth_subjectUpdate,
    auth_subjectDelete
}
