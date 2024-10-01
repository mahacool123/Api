const express = require("express");
const router = express.Router();
const { check,validationResult } = require('express-validator');
const AdminSchemas = require('../schema/SuperAdmin');
const Str = require('@supercharge/strings')
const smsClient = require("./sms"); //Modify the path based on your app

router.post(
    '/login',
    
    async (req,res) => {
        try {
            console.log(req.body);
            const errors = validationResult(req);
            let employer = await AdminSchemas.findOne({"pin"  : req.body.pin})
            console.log(employer);
            if(!errors.isEmpty()){
                return res.status(401).json({errors : errors.array})
            }
            if(!employer){
                return res.status(401).json("Not Found");
            }else{
                res.status(200).json(employer);
             
            }
            
           
       } catch (error){
            console.log(error.message);
            return res.status(500);
       }
    }
);

router.get('/getprofile',(req,res,next)=>{
    let {id}=req.query;
    AdminSchemas.findById(id).then(result=>
         {res.status(200).json(result)
     }).catch(error=>{
                 console.log(error);
                     res.status(500).json(
                         {error:error}
                     )
     })
});

router.post(
    '/signup',
    async (req,res) => {
        try{

        
            let holiday = await AdminSchemas.findOne({email:req.body.email});
            
            if(holiday){
                return res.status(401).json({ msg : "Email already present"})
            }

            var val = Math.floor(1000 + Math.random() * 9000);


            holiday = new AdminSchemas(
                {
                "pin"  : val,
                "name": req.body.name,
                "email": req.body.email,
                "company": req.body.company,
                "phone": req.body.phone,
                "password": req.body.password,
                "aadharlink": req.body.aadharlink,
                "passportlink": req.body.passportlink,
                "panlink": req.body.panlink,
                "reqproducts" : req.body.reqproducts,
                "expdate": req.body.expdate,
                "active" : req.body.active,

               
           }
                );
             await holiday.save();
            res.json(holiday);
        } catch (error){
            console.log(error.message);
            return res.status(500).json({ msg : error.message});
        }
    }
);

router.get('/getall',async (req,res) => {
    try{
        let policies = await AdminSchemas.find();
        res.json(policies);
    }
    catch(err){
        res.json({msg:err.message});
    }
});

router.post(
    '/remove',
    async (req,res) => {
        try{
            let employer = await AdminSchemas.findOne({"_id"  : req.body.id});
            if (!employer) {
                return res.status(401).json("User not found");
            }
            await AdminSchemas.deleteOne({"_id"  : req.body.id});
            return res.status(200).json("User Deleted");
        } catch (error){
            console.log(error.message);
            return res.status(500).json({ msg : error.message});
        }
    }
);

router.post(
    '/sms',
    async (req,res) => {
        try{

            const user = {name: "Ranjith", phone: 919899286242};
             smsClient.sendPartnerWelcomeMessage(user);

           
            return res.status(200).json("SMS SEND");
        } catch (error){
            console.log(error.message);
            return res.status(500).json({ msg : error.message});
        }
    }
);

router.post('/update',async (req,res) => {
    try {
        let {id} = req.query;
        let employer = await AdminSchemas.findById(id);
        if (!employer) {
            return res.status(401).json("Employer not found");
        }
        
        Object.assign(employer, req.body);
        await employer.save();
        res.json(employer);
    } catch (error) {
        console.log(error.message);
        return res.status(500);
    }
});


router.post('/updaterproducts/:id/:sid',async (req,res) => {
    try {
        let id=req.params.id;
        let sid=req.params.sid;

        let employer = await AdminSchemas.findOne({"_id"  : id});
        if (!employer) {
            return res.status(401).json("Work not found");
        }
        AdminSchemas.findOneAndUpdate(
            { _id: id , "reqproducts._id": sid},
            { $set: req.body },
            { new: true }
          )
            .then(templates =>
                {
                    res.status(200).json(templates)
            })
            .catch(err =>  {
                res.status(200).json(err)
        });
        
       
    } catch (error) {
        console.log(error.message);
        return res.status(500);
    }
});

router.get('/getrproduct',(req,res,next)=>{
    let {id}=req.query;
    AdminSchemas.findById(id).then(result=>
         {res.status(200).json(result.reqproducts)
     }).catch(error=>{
                 console.log(error);
                     res.status(500).json(
                         {error:error}
                     )
     })
});


router.post('/getpuser/:id/:sid',async (req,res) => {
    try {
        let id=req.params.id;
        let sid=req.params.sid;

        let employer = await AdminSchemas.findOne({"_id"  : id  , "pusers.type" : sid});
        if (!employer) {
            return res.status(401).json("Users not found");
        }
       else{
        res.status(200).json(employer)
       }
       
    } catch (error) {
        console.log(error.message);
        return res.status(500);
    }
});

router.post(
    '/addpusers',
    async (req,res) => {
        try{
            
            let employer = await AdminSchemas.findOne({"_id"  : req.body.tid});
            if (!employer) {
                return res.status(401).json("Technicial not found");
            }
            const referc = Str.random(5)  

            employer.pusers.push({
                "sid"  : referc,
                "email"  : req.body.email,
                "password" : req.body.password,
                "id" : req.body.id,
                "type" : req.body.type,
                

            });
            await employer.save();
            res.json(employer);
        } catch (error){
            console.log(error.message);
            return res.status(500).json({ msg : error.message});
        }
    }
);

module.exports = router;