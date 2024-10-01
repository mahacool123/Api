const mongoose = require('mongoose');
const crypto = require('crypto');

// Schema for check-in dry fruits (includes recordId)
const CheckInDryFruitSchema = new mongoose.Schema({
  dateCheckIN: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String,
    required: true,
    enum: [
      'Almonds', 'Cashews', 'Raisins', 'Walnuts', 'Pistachios', 
      'Dried Apricots', 'Dates', 'Figs', 'Prunes', 'Brazil Nuts', 
      'Pecans', 'Hazelnuts', 'Sunflower Seeds', 'Pumpkin Seeds', 
      'Chia Seeds'
    ]
  },
  typeOfSack: {
    type: String,
    required: true,
    enum: ['Cartoon', 'Box', 'Sack', 'Other']
  },
  weight: {
    type: Number,
    required: true
  },
  cityName: {
    type: String,
    required: true
  },
  warehouseName: {
    type: String,
    required: true
  },
  rackName: {
    type: String,
    required: true
  },
  recordId: {
    type: String,
    default: () => crypto.randomBytes(5).toString('hex').toUpperCase()  // Generates a 10-digit alphanumeric string
  }
  
});

// Schema for check-out dry fruits (excludes recordId)
const CheckOutDryFruitSchema = new mongoose.Schema({
  dateCheckout: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String,
    required: true,
    enum: [
      'Almonds', 'Cashews', 'Raisins', 'Walnuts', 'Pistachios', 
      'Dried Apricots', 'Dates', 'Figs', 'Prunes', 'Brazil Nuts', 
      'Pecans', 'Hazelnuts', 'Sunflower Seeds', 'Pumpkin Seeds', 
      'Chia Seeds'
    ]
  },
  typeOfSack: {
    type: String,
    required: true,
    enum: ['Cartoon', 'Box', 'Sack', 'Other']
  },
  weight: {
    type: Number,
    required: true
  },
  cityName: {
    type: String,
    required: true
  },
  warehouseName: {
    type: String,
    required: true
  },
  rackName: {
    type: String,
    required: true
  },
  recordId: {
    type: String,
    required: true
   
  },
  dateCheckIN: {
    type: Date,
    required: true  // Ensure this is marked as required
  },

 
});


const InvoiceSchema = new mongoose.Schema({
  dryFruitName: {
    type: String,
    required: true
  },
  recordId: {
    type: String,
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  dateCheckIN: {
    type: Date,
    required: true
  },
  dateCheckout: {
    type: Date,
    required: true
  },
  totalAmount: {
    type: Number,
    default: function() {
      const timeDifferenceMs = this.dateCheckout - this.dateCheckIN;
      const daysStored = Math.ceil(timeDifferenceMs / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
      return daysStored * this.weight;
    }
  },
  storedDays: { // Changed from storedHours to storedDays
    type: String,
    default: function() {
      const timeDifferenceMs = this.dateCheckout - this.dateCheckIN;
      const daysStored = Math.ceil(timeDifferenceMs / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
      return `${daysStored} days`; // Display days
    }
  },
  status: { 
    type: Boolean, 
    default: true
  } ,
  
});


const HistorySchema = new mongoose.Schema({
  dryFruits: [CheckInDryFruitSchema], // For check-in history, use schema with recordId
 
});

const CheckOutHistorySchema = new mongoose.Schema({
  dryFruits: [CheckOutDryFruitSchema], // For check-out history, use schema without recordId
 
  invoices: [InvoiceSchema], 
});

const CustomerHistorySchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true,
    match: /^[0-9]{6}$/  // Ensures customerId is exactly 6 digits.
  },
  checkInHistory: [HistorySchema],
  checkOutHistory: {
    type: [CheckOutHistorySchema],  // Use the schema without recordId
    default: [],
    
  },
  totalWeightByFruit: { type: Map, of: Number }, 
});

// Transform totalWeightByFruit Map to plain object before saving
CustomerHistorySchema.pre('save', function(next) {
  if (this.totalWeightByFruit instanceof Map) {
    this.totalWeightByFruit = Object.fromEntries(this.totalWeightByFruit);
  }
  next();
});


const CustomerHistory = mongoose.model('CustomerHistory', CustomerHistorySchema);

module.exports = CustomerHistory;
