const mongoose = require('mongoose');


let CompanySchemas = mongoose.Schema({

    companyName: {
        type : String,
        required : false 
    },
    companyAddress:{
        type : String,
        required : false 
    },
    mobileNo: {
        type : Number,
        required : false 
    },
    email: {
        type : String,
        required : false 
    },
    GSTN: {
        type : String,
        required : false 
    },  
    
});

module.exports = CompanySchemas = mongoose.model('companies',CompanySchemas);