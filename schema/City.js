const mongoose = require('mongoose');


let CitySchemas = mongoose.Schema({
   
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
    active: {
        type : Boolean,
        required : false 
    },
  

        
});

module.exports = CitySchemas = mongoose.model('cities',CitySchemas);