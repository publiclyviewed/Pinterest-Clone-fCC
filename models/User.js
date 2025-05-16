const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  githubId: { // Store the unique ID provided by GitHub
    type: String,
    required: true,
    unique: true // Ensure each GitHub user is stored only once
  },
  username: { // Store the GitHub username
    type: String,
    required: true,
    unique: true // Ensure each username is unique (prevents conflict with future users)
  },
  // You could add other fields here later if needed from the GitHub profile, e.g.,
  // displayName: String,
  // profileUrl: String,
  // avatarUrl: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index for potential future queries if needed
// userSchema.index({ githubId: 1, username: 1 });


const User = mongoose.model('User', userSchema);

module.exports = User;