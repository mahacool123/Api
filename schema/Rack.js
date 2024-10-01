const mongoose = require('mongoose');


let RackSchemas = mongoose.Schema({
   
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
    container: {
        type : String,
        required : false 
    },
    story:[
      
    ],
    active: {
        type : Boolean,
        required : false 
    },

        
});

module.exports = RackSchemas = mongoose.model('racks',RackSchemas);