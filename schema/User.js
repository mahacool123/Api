const mongoose = require('mongoose');


let UserSchemas = mongoose.Schema({
    pin :  {
        type : Number,
        unique:true,
        required : false 
    },
    name: {
        type : String,
        required : false 
    },
    username: {
        type : String,
        required : false 
    },

    password : {
        type : String,
        required : false 
    },
    email : {
        type : String,
        required : false 
    },
    phone : {
        type : String,
        required : false 
    },
    company : {
        type : String,
        required : false 
    },
    regno : {
        type : String,
        required : false 
    },
    chassis : {
        type : String,
        required : false 
    },
    vehicletype : {
        type : String,
        required : false 
    },
    electric : {
        type : String,
        required : false 
    },
    uses : {
        type : String,
        required : false 
    },
    logo : {
        type : String,
        required : false 
    },
    commerical : {
        type : String,
        required : false 
    },
    vehcolor : {
        type : String,
        required : false 
    },
    certificate : {
        type : String,
        required : false 
    },
    deviceid : {
        type : String,
        required : false 
    },
    devicetype : {
        type : String,
        required : false 
    },
    installer : {
        type : String,
        required : false 
    },
    subdate : {
        type : String,
        required : false 
    },
    kycf: {
        type : String,
        required : false 
    },
    kycb: {
        type : String,
        required : false 
    },
    packages : [],
    devices : [],
    active : {
        type : Boolean,
        required : false 
    },
        
});

module.exports = UserSchemas = mongoose.model('users',UserSchemas);