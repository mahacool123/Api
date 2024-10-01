const express = require("express");
const router = express.Router();
const { check, validationResult } = require('express-validator');
const StorySchemas = require('../schema/Story');
const Str = require('@supercharge/strings')

router.get('/getall', async (req, res) => {
    try {
        let policies = await StorySchemas.find();
        res.json(policies);
    }
    catch (err) {
        res.json({ msg: err.message });
    }
});

router.post(
    '/add',
    async (req, res) => {
        try {

            let policies = await StorySchemas.find();
            console.log(policies.length);
            holiday = new StorySchemas(
                req.body
            );
            await holiday.save();
            res.json(holiday);
        } catch (error) {
            console.log(error.message);
            return res.status(500).json({ msg: "Server Error....." });
        }
    }
);

router.post(
    '/remove',
    async (req, res) => {
        try {
            let employer = await StorySchemas.findOne({ "_id": req.body.id });
            if (!employer) {
                return res.status(401).json("Event not found");
            }
            await StorySchemas.deleteOne({ "_id": req.body.id });
            return res.status(200).json("Event Deleted");
        } catch (error) {
            console.log(error.message);
            return res.status(500).json({ msg: error.message });
        }
    }
);

router.post('/update', async (req, res) => {
    try {
        let { id } = req.query;
        let employer = await StorySchemas.findById(id);
        if (!employer) {
            return res.status(401).json("Event not found");
        }
        // let obj = {
        //     status : req.body.status
        // }
        Object.assign(employer, req.body);
        await employer.save();
        res.json(employer);
    } catch (error) {
        console.log(error.message);
        return res.status(500);
    }
});

router.get('/details', (req, res, next) => {
    let { id } = req.query;
    StorySchemas.findById(id).then(result => {
        res.status(200).json(result)
    }).catch(error => {
        console.log(error);
        res.status(500).json(
            { error: error }
        )
    })
});

router.get('/getid', (req, res, next) => {
    let { id } = req.query;
    StorySchemas.find({ "cid": id }).then(result => {
        res.status(200).json(result)
    }).catch(error => {
        console.log(error);
        res.status(500).json(
            { error: error }
        )
    })
});
router.get('/getid-sid', (req, res, next) => {
    let { id, sid } = req.query;
    StorySchemas.find({ "cid": id, "name": sid }).then(result => {
        res.status(200).json(result)
    }).catch(error => {
        console.log(error);
        res.status(500).json(
            { error: error }
        )
    })
});


module.exports = router;