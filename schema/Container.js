const mongoose = require('mongoose');


let ContainerSchemas = mongoose.Schema({
   
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
    },
    city: {
        type : String,
        required : false 
    },
    active: {
        type : Boolean,
        required : false 
    },

        
});

module.exports = ContainerSchemas = mongoose.model('containers',ContainerSchemas);