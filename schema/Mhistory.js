const mongoose = require('mongoose');


let MHistorySchemas = mongoose.Schema({

    cid : {
        type : String,
        required : false 
    },
    box : {
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
    },
    

});

module.exports = MHistorySchemas = mongoose.model('mhistorys',MHistorySchemas);