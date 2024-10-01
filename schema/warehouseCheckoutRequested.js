const mongoose = require('mongoose');

const dryFruitDetailsSchema = new mongoose.Schema({
  dryFruitName: {
    type: String,
    required: true,
     enum: [
      'Almonds', 'Cashews', 'Raisins', 'Walnuts', 'Pistachios', 
      'Dried Apricots', 'Dates', 'Figs', 'Prunes', 'Brazil Nuts', 
      'Pecans', 'Hazelnuts', 'Sunflower Seeds', 'Pumpkin Seeds', 
      'Chia Seeds'
    ]
  },
  cityName: {
    type: String,
    required: true
  },
  warehouseName: {
    type: String,
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  dateAdded: {
    type: Date,
    default: Date.now
  },
  status: {
    type: Boolean,
    default: true
  }
});

const warehouseCheckoutRequestedSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true,
    unique: true // Ensures only one document per customer
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true
  },
  dryFruitDetails: [dryFruitDetailsSchema], // Array to store multiple entries for the same customer
 

});

module.exports = mongoose.model('warehouseCheckoutRequested', warehouseCheckoutRequestedSchema);
