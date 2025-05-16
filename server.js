require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const path = require('path'); // Required for res.sendFile

const User = require('./models/User');
const Image = require('./models/Image');

const app = express();
const port = process.env.PORT || 3000;

// --- Express Middleware ---
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));
// Parse JSON bodies (as sent by API clients)
app.use(express.json());
// --------------------------


// --- Database Connection ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('Initial MongoDB connection successful'); })
  .catch(err => { console.error('Initial MongoDB connection error:', err); });

mongoose.connection.once('open', () => {
  console.log('MongoDB connection established successfully');

  // --- Express Session Middleware ---
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    // Recommended: use a database session store for production (e.g., connect-mongo)
    // store: new MongoStore({ mongooseConnection: mongoose.connection })
  }));
  // ----------------------------------

  // --- Passport Middleware ---
  // Initialize Passport
  app.use(passport.initialize());
  // Use passport.session() to use the session middleware
  app.use(passport.session());
  // ---------------------------

  // --- Passport Configuration ---

  // Serialize user: Determines what user data is stored in the session
  passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id); // Store the MongoDB user ID in the session
  });

  // Deserialize user: Retrieves the full user object based on session data
  passport.deserializeUser((id, done) => {
    console.log('Deserializing user with ID:', id);
    // Find the user in the database by their MongoDB ID using Promises
    User.findById(id)
      .then(user => {
        console.log('Deserialized user:', user);
        done(null, user); // Attach the full user object to req.user
      })
      .catch(err => {
        console.error('Error deserializing user:', err);
        done(err); // Pass the error to done
      });
  });

  // Configure the GitHub Strategy
  passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID, // From your .env file
      clientSecret: process.env.GITHUB_CLIENT_SECRET, // From your .env file
      callbackURL: "http://localhost:3000/auth/github/callback", // Must match GitHub OAuth App settings
      // passReqToCallback: true // Needed if you want to access req in verify callback
    },
    // Verify callback function using async/await
    async function(accessToken, refreshToken, profile, done) {
      console.log('GitHub profile received:', profile);

      try {
        // Find user by GitHub ID using await
        let user = await User.findOne({ githubId: profile.id });

        if (user) {
          // User already exists, log them in
          console.log('Existing user found:', user.username);
          return done(null, user);
        } else {
          // User does not exist, create new user
          console.log('Creating new user:', profile.username);
          const newUser = new User({
            githubId: profile.id,
            username: profile.username,
            // Add other profile fields if you defined them in the schema
            // displayName: profile.displayName,
            // profileUrl: profile.profileUrl,
            // avatarUrl: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
          });

          // Save new user using await
          user = await newUser.save();
          console.log('New user saved:', user.username);
          return done(null, user);
        }
      } catch (err) {
        console.error('Error in GitHub strategy verify callback:', err);
        return done(err); // Pass any errors to done
      }
    }
  ));
  // ------------------------------------------

  // --- Middleware to Check Authentication ---
  // Custom middleware function to restrict access to authenticated users
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { // Passport adds isAuthenticated() to req
      return next(); // User is logged in, proceed
    }
    // User is not logged in, redirect to login
    res.redirect('/auth/github');
    // Or for API routes: res.status(401).json({ message: 'Unauthorized: Please log in.' });
  }
  // ------------------------------------------


  // Serve static files from the 'public' directory
  // This should typically be placed after middleware, but before specific routes
  app.use(express.static('public'));


  // --- Authentication Routes ---

  // Route to start the GitHub login process
  app.get('/auth/github',
    passport.authenticate('github', { scope: ['user:email'] })); // Request email scope

  // Route that GitHub redirects back to after login
  app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/' }), // Redirect home on failure
    (req, res) => {
      // Successful authentication, redirect to the dashboard
      console.log('GitHub authentication successful, redirecting to dashboard...');
      res.redirect('/dashboard');
    }
  );

  // Simple logout route
  app.get('/logout', (req, res) => {
      // req.logout() requires a callback in newer versions of Passport
      req.logout((err) => {
          if (err) {
              console.error('Error during logout:', err);
              return next(err); // Pass error to error handler
          }
          console.log('User logged out');
          res.redirect('/'); // Redirect to homepage after logout
      });
  });

  // Helper route to check auth status and get user info (returns JSON)
  app.get('/profile', (req, res) => {
    if (req.isAuthenticated()) {
        // Return JSON including authentication status and user object
        res.json({ isAuthenticated: true, user: req.user });
    } else {
        res.json({ isAuthenticated: false });
    }
  });

  // Dashboard route - requires authentication and serves dashboard.html
  app.get('/dashboard', ensureAuthenticated, (req, res) => {
      // Use res.sendFile to serve the dashboard HTML file
      res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
  });
  // ---------------------------------------


  // --- Image API Routes (Authenticated) ---

  // Route to add a new image (requires authentication)
  app.post('/api/images', ensureAuthenticated, async (req, res) => {
      const { url, description } = req.body;

      // Basic validation
      if (!url) {
          return res.status(400).json({ message: 'Image URL is required.' });
      }

      try {
          // Create a new Image document, linking it to the logged-in user
          const newImage = new Image({
              url: url,
              description: description,
              owner: req.user._id // Use logged-in user's ID from req.user
          });

          // Save the image using await
          const savedImage = await newImage.save();
          console.log('Image saved:', savedImage);
          res.status(201).json(savedImage); // Send the saved image data back

      } catch (err) {
          console.error('Error saving image:', err);
          // Check for Mongoose validation errors (optional)
          if (err.name === 'ValidationError') {
               return res.status(400).json({ message: err.message });
          }
          res.status(500).json({ message: 'Error saving image.', error: err.message });
      }
  });

  // Route to get images for the logged-in user (requires authentication)
  app.get('/api/my-images', ensureAuthenticated, async (req, res) => {
      try {
          // Find all images owned by the logged-in user, sort by creation date
          const images = await Image.find({ owner: req.user._id })
                                   .sort({ createdAt: -1 })
                                   .exec(); // Use .exec() with await

          console.log(`Found ${images.length} images for user ${req.user.username}`);
          res.json(images); // Send the array of images as JSON

      } catch (err) {
          console.error('Error fetching user images:', err);
          res.status(500).json({ message: 'Error fetching images.', error: err.message });
      }
  });

  // Route to delete an image (requires authentication and ownership)
  app.delete('/api/images/:imageId', ensureAuthenticated, async (req, res) => {
      const imageId = req.params.imageId; // Get the image ID from the URL

      try {
          // Find the image by ID and owner, then delete it using await
          const deletedImage = await Image.findOneAndDelete({
              _id: imageId,        // Image ID matches the one in the URL param
              owner: req.user._id  // Owner matches the logged-in user's ID
          });

          if (!deletedImage) {
              // Image not found or logged-in user is not the owner
              console.warn(`Attempted to delete image ${imageId} by user ${req.user.id} but failed (not found or no ownership).`);
              return res.status(404).json({ message: 'Image not found or you do not have permission to delete it.' });
          }

          console.log('Image deleted:', deletedImage._id, 'by user:', req.user.username);
          res.status(200).json({ message: 'Image deleted successfully.', deletedImageId: deletedImage._id });

      } catch (err) {
          console.error('Error deleting image:', err);
          // Check for invalid ObjectId format error
          if (err.name === 'CastError' && err.kind === 'ObjectId') {
               return res.status(400).json({ message: 'Invalid image ID format.' });
          }
          res.status(500).json({ message: 'Error deleting image.', error: err.message });
      }
  });

  // --- End Image API Routes (Authenticated) ---


  // --- Public Image API Routes (ADD THIS BLOCK HERE) ---

  // Route to get ALL images (publicly accessible)
  app.get('/api/images', async (req, res) => { // NO ensureAuthenticated middleware here
      try {
          // Find all images
          const images = await Image.find({})
                                 .sort({ createdAt: -1 }) // Sort by newest first
                                 .populate('owner', 'username') // Populate owner's username
                                 .exec();

          console.log(`Found ${images.length} total images for public view.`);
          res.json(images); // Send the array of images as JSON

      } catch (err) {
          console.error('Error fetching all images:', err);
          res.status(500).json({ message: 'Error fetching images.', error: err.message });
      }
  });

  // Optional: Route to get images for a specific user (publicly accessible)
  app.get('/api/users/:userId/images', async (req, res) => { // NO ensureAuthenticated middleware
      const userId = req.params.userId;

      // Optional: Validate userId format
      if (!mongoose.Types.ObjectId.isValid(userId)) {
           return res.status(400).json({ message: 'Invalid user ID format.' });
      }

      try {
          // Find images owned by the specified user ID
          const images = await Image.find({ owner: userId })
                                 .sort({ createdAt: -1 })
                                 .populate('owner', 'username') // Populate owner's username
                                 .exec();

           // Optional: Check if user exists even if they have no images
           const user = await User.findById(userId, 'username');
           // If user not found AND no images found, return 404
           if (!user && images.length === 0) {
               return res.status(404).json({ message: 'User not found or user has no images.' });
           }


          console.log(`Found ${images.length} images for user ID ${userId} for public view.`);
          res.json(images); // Send the array of images as JSON

      } catch (err) {
          console.error(`Error fetching images for user ${userId}:`, err);
          res.status(500).json({ message: 'Error fetching images for user.', error: err.message });
      }
  });

  // --- End Public Image API Routes ---


  // Start the server - This should remain inside the mongoose connection.once('open', ...) block
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});

// Listen for Mongoose connection errors AFTER the initial attempt
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  // Mongoose will try to reconnect, but you might want more robust error handling in production
});

// Optional: Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

// Optional: Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Consider gracefully shutting down or restarting the process in production
  process.exit(1); // Exit the process
});