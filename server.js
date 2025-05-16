require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session'); // Import express-session
const passport = require('passport'); // Import passport
// We'll require the GitHub strategy here shortly

const app = express();
const port = process.env.PORT || 3000;

// --- Database Connection ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('Initial MongoDB connection successful'); })
  .catch(err => { console.error('Initial MongoDB connection error:', err); });

mongoose.connection.once('open', () => {
  console.log('MongoDB connection established successfully');

  // --- Express Session Middleware ---
  // Configure session middleware - BEFORE Passport middleware
  app.use(session({
    secret: process.env.SESSION_SECRET, // Use the secret from .env
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    // Consider adding store option here later for production (e.g., connect-mongo)
  }));
  // ----------------------------------

  // --- Passport Middleware ---
  // Initialize Passport
  app.use(passport.initialize());
  // Use passport.session() to allow passport to use express-session
  app.use(passport.session());
  // ---------------------------


  // Serve static files from the 'public' directory - KEEP THIS, positioning can vary but often before routes
  app.use(express.static('public'));


  // --- Passport Configuration (will add GitHub Strategy here next) ---
  // Passport serialize and deserialize user (required)
  // These determine what user data is stored in the session (serialize)
  // and how to retrieve the full user object from the database based on that data (deserialize).

  passport.serializeUser((user, done) => {
    // What to store in the session? Usually just the user ID.
    done(null, user.id); // Assuming your user model has an '_id' property
  });

  passport.deserializeUser((id, done) => {
    // Given the user ID from the session, retrieve the full user object.
    // This requires a User model, which we'll define next.
    // For now, we'll just use a placeholder or a simple find operation.
    // Example (assuming you have a User model defined):
    // User.findById(id, (err, user) => {
    //   done(err, user);
    // });
    // We'll implement this correctly after defining the User model.
    console.log('Deserializing user ID:', id); // Temporary log
    done(null, { id: id, username: 'tempUser' }); // Placeholder for now
  });
  // ---------------------------------------------------------------


  // Add routes here later (including auth routes)

  // Start the server
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Keep other require statements at the top
// const express = require('express');
// const mongoose = require('mongoose');
// ... etc.