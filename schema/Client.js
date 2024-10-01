const mongoose = require('mongoose');

const SequenceSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        default: 'customerID' // This sets the _id to 'customerID'
    },
    seq: {
        type: Number,
        default: 0
    }
});

let Client = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    bussinessName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true // This ensures that the email is unique
    },
    password: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String,
        required: true
    },
    gstNumber: {
        type: String,
        required: false  // GST number is optional, hence not required
    },
    role: {
        type: String,
        default: 'client'  // Automatically sets the role to 'client'
    },
    customerID: {
        type: String,
        required: true,
        unique: true
    },
    image: {
        type: String
    },
    notification: [],
    fileUrls: [{
        url: String,
        date: Date
    }],
    location: [{
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        }
    }]
});

// Create the models
const Sequence = mongoose.model('Sequence', SequenceSchema);
const ClientSchemas = mongoose.model('Client', Client);

// Function to get the next customer ID
async function getNextCustomerID() {
    const sequence = await Sequence.findOneAndUpdate(
        { _id: 'customerID' }, // Now this works correctly since _id is a string
        { $inc: { seq: 1 } },  // Increment the counter
        { new: true, upsert: true } // Create if it doesn't exist
    );
    return String(sequence.seq).padStart(6, '0'); // Format to six digits with leading zeros
}


// Export both models and the getNextCustomerID function
module.exports = {
    ClientSchemas,
    getNextCustomerID
};
