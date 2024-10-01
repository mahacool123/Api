const express = require("express");
const router = express.Router();
const { check,validationResult } = require('express-validator');
const InvoiceSchemas = require('../schema/Invoice');
const Str = require('@supercharge/strings')

router.get('/getall',async (req,res) => {
    try{
        let policies = await InvoiceSchemas.find();
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
            holiday = new InvoiceSchemas(req.body);
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
            let employer = await InvoiceSchemas.findOne({"_id"  : req.body.id});
            if (!employer) {
                return res.status(401).json("Event not found");
            }
            await InvoiceSchemas.deleteOne({"_id"  : req.body.id});
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
        let employer = await InvoiceSchemas.findById(id);
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
    InvoiceSchemas.findById(id).then(result=>
         {res.status(200).json(result)
     }).catch(error=>{
                 console.log(error);
                     res.status(500).json(
                         {error:error}
                     )
     })
 });

 router.post(
    '/addproducts',
    async (req,res) => {
        try{
            
            let employer = await InvoiceSchemas.findOne({"_id"  : req.body.tid});
            if (!employer) {
                return res.status(401).json("Technicial not found");
            }
            const referc = Str.random(5)  

            employer.products.push({
                "sid"  : referc,
                "qty"  : req.body.qty,
                "description" : req.body.description,
                "uprice" : req.body.uprice,
                "ppayment" : req.body.ppayment,
                "total" : req.body.total,
                "remain" : req.body.remain,

            });
            await employer.save();
            res.json(employer);
        } catch (error){
            console.log(error.message);
            return res.status(500).json({ msg : error.message});
        }
    }
);

router.post(
    '/deleteproducts',
    async (req,res) => {
        try{
            let employer = await InvoiceSchemas.findOne({"_id"  : req.body.id});
            if (!employer) {
                return res.status(401).json("Work not found");
            }
            InvoiceSchemas.findOneAndUpdate(
                { _id: req.body.id},
                { $pull: { products: { sid: req.body.sid } } },
                { new: true }
              )
                .then(templates =>
                    {
                        res.status(200).json(templates)
                })
                .catch(err =>  {
                    res.status(200).json(err)
            });
        } catch (error){
            console.log(error.message);
            return res.status(500).json({ msg : error.message});
        }
    }
);

router.post('/updateproductsremain',async (req,res) => {
    try {
        let employer = await InvoiceSchemas.findOne({"_id"  : req.body.id});
        if (!employer) {
            return res.status(401).json("Work not found");
        }
        InvoiceSchemas.findOneAndUpdate(
            { _id: req.body.id , "products.sid": req.body.sid},
            { $set: { "products.$.remain": req.body.remain } 
        },
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
router.post('/updateproductsppayment',async (req,res) => {
    try {
        let employer = await InvoiceSchemas.findOne({"_id"  : req.body.id});
        if (!employer) {
            return res.status(401).json("Work not found");
        }
        InvoiceSchemas.findOneAndUpdate(
            { _id: req.body.id , "products.sid": req.body.sid},
            { $set: { "products.$.ppayment": req.body.ppayment } 
        },
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

router.post('/updateproductstotal',async (req,res) => {
    try {
        let employer = await InvoiceSchemas.findOne({"_id"  : req.body.id});
        if (!employer) {
            return res.status(401).json("Work not found");
        }
        InvoiceSchemas.findOneAndUpdate(
            { _id: req.body.id , "products.sid": req.body.sid},
            { $set: { "products.$.total": req.body.total } 
        },
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

router.get('/getid',(req,res,next)=>{
    let {id}=req.query;
    InvoiceSchemas.find({"companyId" : id}).then(result=>
         {res.status(200).json(result)
     }).catch(error=>{
                 console.log(error);
                     res.status(500).json(
                         {error:error}
                     )
     })
 });

module.exports = router;