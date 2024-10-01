const express = require("express");
const router = express.Router();
const { check,validationResult } = require('express-validator');
const CompanySchemas = require('../schema/Companies');

router.get('/getall',async (req,res) => {
    try{
        let policies = await CompanySchemas.find();
        res.json(policies);
    }
    catch(err){
        res.json({msg:err.message});
    }
});

router.post(
    '/add',
    async (req,res) => {
        try{
            holiday = new CompanySchemas(req.body);
            await holiday.save();
            res.json(holiday);  
        } catch (error){
            console.log(error.message);
            return res.status(500).json({ msg : "Server Error....."});
        }
    }
);

router.post(
    '/remove',
    async (req,res) => {
        try{
            let employer = await CompanySchemas.findOne({"_id"  : req.body.id});
            if (!employer) {
                return res.status(401).json("Event not found");
            }
            await CompanySchemas.deleteOne({"_id"  : req.body.id});
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
        let employer = await CompanySchemas.findById(id);
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
    CompanySchemas.findById(id).then(result=>
         {res.status(200).json(result)
     }).catch(error=>{
                 console.log(error);
                     res.status(500).json(
                         {error:error}
                     )
     })
 });


 router.post('/getcomp',(req,res,next)=>{
    CompanySchemas.find({"email" : req.body.email}).then(result=>
         {res.status(200).json(result)
     }).catch(error=>{
                 console.log(error);
                     res.status(500).json(
                         {error:error}
                     )
     })
 });

module.exports = router;