const mongoose = require('mongoose');


let CFileSchemas = mongoose.Schema({
   
    name: {
        type : String,
        required : false 
    },
    noofcont: {
        type : Number,
        required : false 
    },
    aid: {
        type : String,
        required : false 
    },
    cid: {
        type : String,
        required : false 
    }

        
});

module.exports = CFileSchemas = mongoose.model('cfiles',CFileSchemas);