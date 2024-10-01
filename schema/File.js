const mongoose = require('mongoose');

let FileSchemas = mongoose.Schema({
    
    longUrl:{
        type:String,
        required:false
    },
    name:{
        type:String,
        required:false
    },
    urlCode:{
        type:String,
        required:false
    },
    
    multi : []
    
    

});

module.exports = FileSchemas = mongoose.model('files',FileSchemas);