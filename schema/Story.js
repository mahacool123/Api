const mongoose = require('mongoose');


let StorySchemas = mongoose.Schema({
   
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

module.exports = StorySchemas = mongoose.model('stories',StorySchemas);