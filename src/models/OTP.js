const mongoose = require('mongoose');

const otpSchema = mongoose.Schema({
  phone: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['verify', 'reset'],
    default: 'verify',
  },
  used: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // MongoDB TTL — auto-deletes document after expiresAt
  },
});

const OTP = mongoose.model('OTP', otpSchema);
module.exports = OTP;
