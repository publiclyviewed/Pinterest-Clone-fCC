const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: { // The URL of the image
    type: String,
    required: true
    // Optional: Add URL validation here or on the frontend/backend route
  },
  description: { // Optional description for the image
    type: String,
    default: '' // Default to an empty string if not provided
  },
  owner: { // Reference to the User who added this image
    type: mongoose.Schema.Types.ObjectId, // This stores the ObjectId of the User
    ref: 'User', // This tells Mongoose that the ObjectId refers to the 'User' model
    required: true // Every image must have an owner
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Optional: Index the 'owner' field for faster lookups of a user's images
imageSchema.index({ owner: 1, createdAt: -1 }); // Index by owner, then creation date (descending)


const Image = mongoose.model('Image', imageSchema);

module.exports = Image;