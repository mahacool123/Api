



const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for each item in the details array
const detailSchema = new Schema({
  _iddetails: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() }, // 
  warehouseId: { type: Schema.Types.ObjectId, required: true }, // Assuming warehouseId is an ObjectId
  warehouseName: { type: String, required: false },
  totalweight: { type: Number, required: false },
  bora: { type: Number, required: false },
  dryFruitName: { type: String, required: false},
  cityName: { type: String, required: false},
  rate:{type: String, required: false},
  CurrentWeight: { type: Number, required: false },

}, { _id: false }); // _id: false ensures that each item in the array does not get its own _id

// Define the schema for selectedData
const warehouseDetailSchema = new Schema({
  selectedData: {
    type: {
      user: {
        type: Schema.Types.Mixed // Can be adjusted based on the structure of the user object
      },
      details: [detailSchema] // Array of detailSchema objects
    },
    required: true
  },
  requestedWarehouseStatus: { type: Boolean, default: true } 
}, {
  timestamps: true // Optional: adds createdAt and updatedAt fields
});

// Create and export the model
module.exports = mongoose.model('WarehouseRequested', warehouseDetailSchema);