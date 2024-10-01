const mongoose = require('mongoose');


let RequestSchemas = mongoose.Schema({

    bid : {
        type : String,
        required : false 
    },
    sid : {
        type : String,
        required : false 
    },
    
    time : {
        type : String,
        required : false 
    },
    
    status : {
        type : String,
        required : false 
    }
});

module.exports = RequestSchemas = mongoose.model('requests',RequestSchemas);