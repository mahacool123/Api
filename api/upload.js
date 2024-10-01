const express = require("express");
const router = express.Router();
const firebase = require('../firebase');
const upload = require('../middleware/upload')
const validUrl = require('valid-url')
const shortid = require('shortid')
const FileSchemas = require('../schema/File');



router.get('/getfiles',async (req,res) => {
    try{
        let policies = await FileSchemas.find();
        res.json(policies);
    }
    catch(err){
        res.json({msg:err.message});
    }
});


router.post('/addfiles',upload.single('file'),async (req,res) => {
    try{
        if (req.file) {
            const file = req.file;
            console.log(file);
            let name = file.originalname;
            const blob = firebase.bucket.file(`files/`+file.originalname);
                const blobStream =  blob.createWriteStream({
                    metadata: {
                        contentType: file.mimetype
                    }
                });
                blobStream.on('error', (err) => {
                    console.log(err)
                    })
                blobStream.on('finish', () => {
                    console.log('finish')
                   
            });
            blobStream.end(file.buffer);

            let filel = await firebase.bucket.file(`files/`+file.originalname).getSignedUrl({
                action: 'read',
                expires: '03-09-2491'
            });
            const urlCode = shortid.generate()
        
            
            let policy = new FileSchemas({
                name,
                longUrl: filel[0],
            
                urlCode: urlCode


            });
            await policy.save();
            return res.status(200).json(policy);
        }
else{
    res.json({msg:"m"});
}
       

    }
    catch(err){
        res.json({msg:err.message});
    }
});

router.get('/downloadfile',async (req,res) => {
    try{
        let {id} = req.query;
        let policy = await FileSchemas.findById(id);
        if(!policy)
        {
            return res.status(401).json({msg : "File not found"});
        }
    
        res.json(policy);
    }
    catch(err){
        res.json({msg:err.message});
    }
});

router.post('/addmultifiles',upload.array('files'),async (req,res) => {
    try{
        
        let mfiles = [];
        if (req.files) {
            const files = req.files;
            console.log(files.length);

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                 let name = file.originalname;
            const blob = firebase.bucket.file(`files/`+file.originalname);
                const blobStream =  blob.createWriteStream({
                    metadata: {
                        contentType: file.mimetype
                    }
                });
                blobStream.on('error', (err) => {
                    console.log(err)
                    })
                blobStream.on('finish', () => {
                    console.log('finish')
                   
            });
            blobStream.end(file.buffer);     
        
            let filel = await firebase.bucket.file(`files/`+file.originalname).getSignedUrl({
                action: 'read',
                expires: '03-09-2491'
            });
        
            mfiles.push(filel[0]);
        
        }   

        let policy = new FileSchemas({
            multi : mfiles


        });
        await policy.save();
        return res.status(200).json(policy);

          
        }
else{
    res.json({msg:"m"});
}
       

    }
    catch(err){
        res.json({msg:err.message});
    }
});

module.exports = router;