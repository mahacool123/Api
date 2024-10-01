const mongoose = require('mongoose');


let BoxSchemas = mongoose.Schema({


    name: {
        type: String,
        required: false
    },
    type: {
        type: String,
        required: false
    },
    city: {
        type: String,
        required: false
    },
    container: {
        type: String,
        required: false
    },
    rack: {
        type: String,
        required: false
    },
    story: {
        type: String,
        required: false
    },
    addby: {
        type: String,
        required: false
    },
    sid: {
        type: String,
        required: false
    },
    mount: {
        type: String,
        required: false
    },

    mountid: {
        type: String,
        required: false
    },
    unmount: {
        type: String,
        required: false
    },
    unmountid: {
        type: String,
        required: false
    },
    client: {
        type: String,
        required: false
    },
    picked: {
        type: String,
        required: false
    },
    pickedid: {
        type: String,
        required: false
    },

    deliver: {
        type: String,
        required: false
    },

    position: {
        type: String,
        required: false
    },

    deliverid: {
        type: String,
        required: false
    },
    rsid: {
        type: String,
        required: false
    },
    history: []

});

module.exports = BoxSchemas = mongoose.model('boxes', BoxSchemas);