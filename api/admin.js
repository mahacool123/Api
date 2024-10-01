const express = require("express");
const router = express.Router();
const { check, validationResult } = require('express-validator');
const AdminSchemas = require('../schema/Admin');
const Str = require('@supercharge/strings');
const smsClient = require("./sms");
const bcrypt = require('bcryptjs'); // Import bcryptjs

router.post('/login', async (req, res) => {
    try {
        console.log("admin login");
        console.log(req.body);

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

        let admin = await AdminSchemas.findOne(query);

        if (!admin) {
            return res.status(401).json("Not Found");
        }

        // Compare the password using bcrypt
        const isMatch = await bcrypt.compare(password, admin.password);
        if (isMatch) {
            res.status(200).json(admin);
        } else {
            return res.status(401).json("Password Not Match");
        }

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ msg: 'Internal Server Error' });
    }
});

router.post('/pinlogin', async (req, res) => {
    try {
        console.log(req.body);
        const errors = validationResult(req);
        let employer = await AdminSchemas.findOne({ "pin": req.body.pin });
        console.log(employer);
        if (!errors.isEmpty()) {
            return res.status(401).json({ errors: errors.array() });
        }
        if (!employer) {
            return res.status(401).json("Not Found");
        } else {
            res.status(200).json(employer);
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ msg: 'Internal Server Error' });
    }
});

router.get('/getprofile', (req, res, next) => {
    let { id } = req.query;
    AdminSchemas.findById(id).then(result => {
        res.status(200).json(result);
    }).catch(error => {
        console.log(error);
        res.status(500).json({ error: error });
    });
});

router.post('/signup', async (req, res) => {
    try {
        let holiday = await AdminSchemas.findOne({ email: req.body.email });

        if (holiday) {
            return res.status(401).json({ msg: "Email already present" });
        }

        // Generate a random PIN
        var val = Math.floor(1000 + Math.random() * 9000);

        // Hash the password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        holiday = new AdminSchemas({
            "pin": val,
            "name": req.body.name,
            "email": req.body.email,
            "company": req.body.company,
            "phone": req.body.phone,
            "password": hashedPassword,
            "aadharlink": req.body.aadharlink,
            "passportlink": req.body.passportlink,
            "panlink": req.body.panlink,
            "reqproducts": req.body.reqproducts
        });

        await holiday.save();
        res.json(holiday);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ msg: error.message });
    }
});

router.get('/getall', async (req, res) => {
    try {
        let policies = await AdminSchemas.find();
        res.json(policies);
    } catch (err) {
        res.json({ msg: err.message });
    }
});

router.post('/remove', async (req, res) => {
    try {
        let employer = await AdminSchemas.findOne({ "_id": req.body.id });
        if (!employer) {
            return res.status(401).json("User not found");
        }
        await AdminSchemas.deleteOne({ "_id": req.body.id });
        return res.status(200).json("User Deleted");
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ msg: error.message });
    }
});

router.post('/sms', async (req, res) => {
    try {
        const user = { name: "Ranjith", phone: 919899286242 };
        smsClient.sendPartnerWelcomeMessage(user);
        return res.status(200).json("SMS SEND");
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ msg: error.message });
    }
});

router.post('/update', async (req, res) => {
    try {
        let { id } = req.query;
        let employer = await AdminSchemas.findById(id);
        if (!employer) {
            return res.status(401).json("Employer not found");
        }

        Object.assign(employer, req.body);
        await employer.save();
        res.json(employer);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ msg: 'Internal Server Error' });
    }
});

router.post('/updaterproducts/:id/:sid', async (req, res) => {
    try {
        let id = req.params.id;
        let sid = req.params.sid;

        let employer = await AdminSchemas.findOne({ "_id": id });
        if (!employer) {
            return res.status(401).json("Work not found");
        }

        AdminSchemas.findOneAndUpdate(
            { _id: id, "reqproducts._id": sid },
            { $set: req.body },
            { new: true }
        )
            .then(templates => {
                res.status(200).json(templates);
            })
            .catch(err => {
                res.status(200).json(err);
            });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ msg: 'Internal Server Error' });
    }
});

router.get('/getrproduct', (req, res, next) => {
    let { id } = req.query;
    AdminSchemas.findById(id).then(result => {
        res.status(200).json(result.reqproducts);
    }).catch(error => {
        console.log(error);
        res.status(500).json({ error: error });
    });
});

router.post('/getpuser/:id/:sid', async (req, res) => {
    try {
        let id = req.params.id;
        let sid = req.params.sid;

        let employer = await AdminSchemas.findOne({ "_id": id, "pusers.type": sid });
        if (!employer) {
            return res.status(401).json("Users not found");
        } else {
            res.status(200).json(employer);
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ msg: 'Internal Server Error' });
    }
});

router.post('/addpusers', async (req, res) => {
    try {
        let employer = await AdminSchemas.findOne({ "_id": req.body.tid });
        if (!employer) {
            return res.status(401).json("Technicial not found");
        }
        const referc = Str.random(5);

        employer.pusers.push({
            "sid": referc,
            "email": req.body.email,
            "password": req.body.password,
            "id": req.body.id,
            "type": req.body.type,
        });
        await employer.save();
        res.json(employer);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ msg: error.message });
    }
});

router.post('/updateprofile/:id', async (req, res) => {
    try {
        let id = req.params.id.trim();
        console.log("Received request to update profile for user ID:", id);

        let { email, password } = req.body;
        console.log("Received data - email:", email, "password:", password);

        let employer = await AdminSchemas.findById(id);
        console.log("Retrieved user from database:", employer);

        if (!employer) {
            console.log("User not found");
            return res.status(404).json({ message: "User not found" });
        }

        // Update the email and password if provided
        if (email) {
            employer.email = email;
        }
        if (password) {
            // Hash the new password before saving
            employer.password = await bcrypt.hash(password, 10);
        }

        await employer.save();
        console.log("User updated successfully:", employer);

        res.status(200).json({ message: "User updated successfully", user: employer });
    } catch (error) {
        console.error("Error occurred:", error);
        return res.status(500).json({ error: error.message });
    }
});

const generateOTP = () => {
    let otp = '';
    for (let i = 0; i < 6; i++) {
        otp += Math.floor(Math.random() * 10);
    }
    return otp;
};

router.post('/forgotpassword', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await AdminSchemas.findOne({ email });

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const otp = generateOTP();
        user.otp = otp;
        await user.save();

        // Implement your OTP sending logic here
        console.log(`OTP sent to ${email}: ${otp}`);

        res.status(200).json({ msg: 'OTP sent to email' });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ msg: error.message });
    }
});

router.post('/resetpassword', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await AdminSchemas.findOne({ email, otp });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid OTP or user' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = null; // Clear the OTP after successful password reset
        await user.save();

        res.status(200).json({ msg: 'Password reset successful' });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ msg: error.message });
    }
});

module.exports = router;

