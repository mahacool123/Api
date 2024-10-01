const mongoose = require('mongoose');

const PasswordResetRequestSchema = new mongoose.Schema({
  clientId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  passwordUpdated: { type: Boolean, default: false } // New field added
});

module.exports = mongoose.model('PasswordResetRequest', PasswordResetRequestSchema);
