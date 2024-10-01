const mongoose = require('mongoose');


let CompanyInfoSchemas = mongoose.Schema({

    companyName: {
        type : String,
        required : false 
    },
    companyAddress:{
        type : String,
        required : false 
    },
    tagline: {
        type : String,
        required : false 
    },
    email: {
        type : String,
        required : false 
    },
    GSTN: {
        type : String,
        required : false 
    }
    
});

module.exports = CompanyInfoSchemas = mongoose.model('companyinfos',CompanyInfoSchemas);