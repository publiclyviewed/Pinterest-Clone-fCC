const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: { // The URL of the image
    type: String,
    required: true
  },
  description: { // Optional description for the image
    type: String
  },
  owner: { // Reference to the User who added this image
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Refers to the 'User' model
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;