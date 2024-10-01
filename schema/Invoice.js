const mongoose = require('mongoose');

let InvoiceSchemas = mongoose.Schema({

    companyId: {
        type : String,
        required : false 
    },
    invoiceId:{
        type : String,
        required : false 
    },
    creationDate: {
        type : String,
        required : false 
    },
    invoiceType: {
        type : String,
        required : false 
    },
    phoneNumber: {
        type : String,
        required : false 
    },
    tax: {
        type : Number,
        required : false 
    },
    products: []
   
   
});

module.exports = InvoiceSchemas = mongoose.model('invoices',InvoiceSchemas);