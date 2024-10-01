const express = require("express");
const router = express.Router();
const { check,validationResult } = require('express-validator');
const UserSchemas = require('../schema/User');
const Str = require('@supercharge/strings')
const smsClient = require("./sms"); //Modify the path based on your app

router.post(
    '/login',
    
    async (req,res) => {
        try {
            console.log(req.body);
            const errors = validationResult(req);
            let employer = await UserSchemas.findOne({"name"  : req.body.email})
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


router.post(
    '/namelogin',
    
    async (req,res) => {
        try {
            console.log(req.body);
            const errors = validationResult(req);
            let employer = await UserSchemas.findOne({"name"  : req.body.name})
            console.log(employer);
            if(!errors.isEmpty()){
                return res.status(401).json({errors : errors.array})
            }
            if(!employer){
                return res.status(401).json("Not Found");
            }else{

                if(employer.password==req.body.password){

                    if(employer.active==true){
                        res.status(200).json(employer);
    
                    }else{
                        return res.status(401).json("User Not Active ");
    
                    }
                   

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

router.post(
    '/pinlogin',
    
    async (req,res) => {
        try {
            console.log(req.body);
            const errors = validationResult(req);
            let employer = await UserSchemas.findOne({"pin"  : req.body.pin})
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
    UserSchemas.findById(id).then(result=>
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

        
            let holiday = await UserSchemas.findOne({deviceid:req.body.deviceid});
            
            if(holiday){
                return res.status(401).json({ msg : "Email already present"})
            }

            var val = Math.floor(1000 + Math.random() * 9000);


            holiday = new UserSchemas(
                {
                "pin"  : val,
                "name": req.body.name,
                "username" : req.body.username,
                "password": req.body.password,
                "email": req.body.email,
                "phone": req.body.phone,
                "company": req.body.company,
                "regno": req.body.regno,
                "chassis": req.body.chassis,
                "vehicletype": req.body.vehicletype,
                "electric" : req.body.electric,
                "uses": req.body.uses,
                "commerical" : req.body.commerical,
                "vehcolor" : req.body.vehcolor,
                "certificate" : req.body.certificate,
                "deviceid" : req.body.deviceid,
                "devicetype" : req.body.devicetype,
                "installer" : req.body.installer,
                "subdate" : req.body.subdate,
                "devices" : req.body.devices, 
                "active" : req.body.active,
                "kycf" : req.body.kycf,
                "kycb" : req.body.kycb,
                "packages": []
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
        let policies = await UserSchemas.find();
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
            let employer = await UserSchemas.findOne({"_id"  : req.body.id});
            if (!employer) {
                return res.status(401).json("User not found");
            }
            await UserSchemas.deleteOne({"_id"  : req.body.id});
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
        let employer = await UserSchemas.findById(id);
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

        let employer = await UserSchemas.findOne({"_id"  : id});
        if (!employer) {
            return res.status(401).json("Work not found");
        }
        UserSchemas.findOneAndUpdate(
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
    UserSchemas.findById(id).then(result=>
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

        let employer = await UserSchemas.findOne({"_id"  : id  , "packages.type" : sid});
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
    '/addpackages',
    async (req,res) => {
        try{
            
            let employer = await UserSchemas.findOne({"_id"  : req.body.tid});
            if (!employer) {
                return res.status(401).json("Technicial not found");
            }
            const referc = Str.random(5)  

            employer.packages.push({
                "sid"  : referc,
               "pid" :req.body.pid,
               "bdate": req.body.bdate,
               "edate" :req.body.edate,
               "name": req.body.name,
                "days" : req.body.days,
                "image" : req.body.image,
                "rpayid" : req.body.rpayid,
                "price" : req.body.price,
                "aprice" : req.body.aprice
            
            });
            await employer.save();
            res.json(employer);
        } catch (error){
            console.log(error.message);
            return res.status(500).json({ msg : error.message});
        }
    }
);

router.post('/updatedevice/:id/:sid',async (req,res) => {
    try {
        let id=req.params.id;
        let sid=req.params.sid;

        let employer = await UserSchemas.findOne({"_id"  : id});
        if (!employer) {
            return res.status(401).json("Work not found");
        }
        UserSchemas.findOneAndUpdate(
            { _id: id , "devices._id": sid},
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


router.get('/getdevices',(req,res,next)=>{
    let {id}=req.query;
    UserSchemas.findById(id).then(result=>
         {res.status(200).json(result.reqproducts)
     }).catch(error=>{
                 console.log(error);
                     res.status(500).json(
                         {error:error}
                     )
     })
});

router.post(
    '/adddevices',
    async (req,res) => {
        try{
            
            let employer = await UserSchemas.findOne({"_id"  : req.body.tid});
            if (!employer) {
                return res.status(401).json("Technicial not found");
            }
            const referc = Str.random(5)  

            employer.devices.push({
                "sid"  : referc,   
                "id" : req.body.id,
            });
            await employer.save();
            res.json(employer);
        } catch (error){
            console.log(error.message);
            return res.status(500).json({ msg : error.message});
        }
    }
);



router.post('/getddetail/:id/:sid',async (req,res) => {
    try {
        let id=req.params.id;
        let sid=req.params.sid;

        let employer = await UserSchemas.findOne({"_id"  : id  , "devices.sid" : sid});
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

router.get('/getsuperdevice',async (req,res) => {
    try{
        let {email}=req.query;
        let policies = await UserSchemas.find({company : email});
        res.json(policies);
    }
    catch(err){
        res.json({msg:err.message});
    }
});

module.exports = router;