const mongoose = require('mongoose');


let AdminSchemas = mongoose.Schema({
    pin :  {
        type : Number,
        unique:true,
        required : false 
    },
    name: {
        type : String,
        required : false 
    },
    email : {
        type : String,
        required : false 
    },
    company : {
        type : String,
        required : false 
    },
    logo : {
        type : String,
        required : false 
    },
    phone : {
        type : String,
        required : false 
    },
    password : {
        type : String,
        required : false 
    },
    aadharlink : {
        type : String,
        required : false 
    },
    passportlink : {
        type : String,
        required : false 
    },
    panlink : {
        type : String,
        required : false 
    },
    reqproducts :[],
    licproducts :[],
    pusers : []

        
});

module.exports = AdminSchemas = mongoose.model('admins',AdminSchemas);