const express = require("express");
const router = express.Router();
const { check,validationResult } = require('express-validator');
const DriverSchemas = require('../schema/Driver');
const Str = require('@supercharge/strings')

router.get('/getall',async (req,res) => {
    try{
        let policies = await DriverSchemas.find();
        res.json(policies);
    }
    catch(err){
        res.json({msg:err.message});
    }
});

router.post(
    '/login',
    
    async (req,res) => {
        try {
            console.log(req.body);
            const errors = validationResult(req);
            let employer = await DriverSchemas.findOne({"email"  : req.body.email})
            console.log(employer);
            if(!errors.isEmpty()){
                return res.status(401).json({errors : errors.array})
            }
            if(!employer){
                return res.status(401).json("Not Found");
            }else{

                if(employer.password==req.body.password){
                    res.status(200).json(employer);

                }else{
                    return res.status(401).json("Password Not Match");

                }
             
            }
            
           
       } catch (error){
            console.log(error.message);
            return res.status(500);
       }
    }
);

// router.post(
//     '/add',
//     async (req,res) => {
//         try{

//             let policies = await DriverSchemas.find();
//             console.log(policies.length);
//             holiday = new DriverSchemas(
//                req.body
//                 );
//             await holiday.save();
//             res.json(holiday);  
//         } catch (error){
//             console.log(error.message);
//             return res.status(500).json({ msg : "Server Error....."});
//         }
//     }
// );



router.post('/add', async (req, res) => {
    try {
        // Extract email and mobile from the request body
        const { email, mobile } = req.body;

        // Check if the email already exists
        const existingEmail = await DriverSchemas.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ msg: "Email already exists." });
        }

        // Check if the mobile number already exists
        const existingMobile = await DriverSchemas.findOne({ mobile });
        if (existingMobile) {
            return res.status(400).json({ msg: "Mobile number already exists." });
        }

        // Create a new client if no duplicate is found
        const newDriver = new DriverSchemas(req.body);
        await newDriver.save();

        res.json(newDriver );
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ msg: "Server Error....." });
    }
});

router.post(
    '/remove',
    async (req,res) => {
        try{
            let employer = await DriverSchemas.findOne({"_id"  : req.body.id});
            if (!employer) {
                return res.status(401).json("Event not found");
            }
            await DriverSchemas.deleteOne({"_id"  : req.body.id});
            return res.status(200).json("Event Deleted");
        } catch (error){
            console.log(error.message);
            return res.status(500).json({ msg : error.message});
        }
    }
);

router.post('/update',async (req,res) => {
    try {
        let {id} = req.query;
        let employer = await DriverSchemas.findById(id);
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

router.get('/details',(req,res,next)=>{
    let {id}=req.query;
    DriverSchemas.findById(id).then(result=>
         {res.status(200).json(result)
     }).catch(error=>{
                 console.log(error);
                     res.status(500).json(
                         {error:error}
                     )
     })
 });

 
 
module.exports = router;