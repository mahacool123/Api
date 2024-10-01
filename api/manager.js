const express = require("express");
const router = express.Router();
const { check, validationResult } = require('express-validator');
const ManagerSchemas = require('../schema/Manager');
const bcrypt = require('bcryptjs'); // Import bcryptjs

router.get('/getall', async (req, res) => {
    try {
        let policies = await ManagerSchemas.find();
        res.json(policies);
    } catch (err) {
        res.json({ msg: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        console.log(req.body);
        
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({ errors: errors.array() });
        }

        const { email, mobile, password } = req.body;

        // Determine which identifier to use for the query
        let query = {};
        if (email) {
            query.email = email;
        } else if (mobile) {
            query.mobile = mobile;
        } else {
            return res.status(400).json({ msg: 'Either email or mobile must be provided' });
        }

        let manager = await ManagerSchemas.findOne(query);

        if (!manager) {
            return res.status(401).json("Not Found");
        }

        // Compare password with hashed password
        const isMatch = await bcrypt.compare(password, manager.password);

        if (isMatch) {
            res.status(200).json(manager);
        } else {
            return res.status(401).json("Password Not Match");
        }

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ msg: 'Internal Server Error' });
    }
});

router.post('/add', async (req, res) => {
    try {
        const { email, mobile, password } = req.body;

        // Check if the email already exists
        const existingEmail = await ManagerSchemas.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ msg: "Email already exists." });
        }

        // Check if the mobile number already exists
        const existingMobile = await ManagerSchemas.findOne({ mobile });
        if (existingMobile) {
            return res.status(400).json({ msg: "Mobile number already exists." });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new manager if no duplicate is found
        const newManager = new ManagerSchemas({
            ...req.body,
            password: hashedPassword // Save hashed password
        });

        await newManager.save();
        res.json(newManager);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ msg: "Server Error....." });
    }
});

router.post('/remove', async (req, res) => {
    try {
        let employer = await ManagerSchemas.findOne({ "_id": req.body.id });
        if (!employer) {
            return res.status(401).json("Event not found");
        }
        await ManagerSchemas.deleteOne({ "_id": req.body.id });
        return res.status(200).json("Event Deleted");
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ msg: error.message });
    }
});

router.post('/update', async (req, res) => {
    try {
        let { id } = req.query;
        let employer = await ManagerSchemas.findById(id);
        if (!employer) {
            return res.status(401).json("Event not found");
        }

        // Hash the new password if provided
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password, salt);
        }

        Object.assign(employer, req.body);
        await employer.save();
        res.json(employer);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ msg: error.message });
    }
});

router.get('/details', (req, res, next) => {
    let { id } = req.query;
    ManagerSchemas.findById(id).then(result => {
        res.status(200).json(result)
    }).catch(error => {
        console.log(error);
        res.status(500).json({ error: error })
    })
});

router.get('/getid', (req, res, next) => {
    let { id } = req.query;
    ManagerSchemas.find({ "cid": id }).then(result => {
        res.status(200).json(result)
    }).catch(error => {
        console.log(error);
        res.status(500).json({ error: error })
    })
});

module.exports = router;
