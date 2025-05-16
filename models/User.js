const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  githubId: { // Store the unique ID provided by GitHub
    type: String,
    required: true,
    unique: true
  },
  username: { // Store the GitHub username
    type: String,
    required: true,
    unique: true // Assuming GitHub usernames are unique globally
  },
  // You could add other fields here later if needed, e.g.,
  // displayName: String,
  // profileUrl: String,
  // avatarUrl: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;