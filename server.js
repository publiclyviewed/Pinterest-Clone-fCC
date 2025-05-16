require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;

const User = require('./models/User');
const Image = require('./models/Image'); // Make sure Image model is imported

const app = express();
const port = process.env.PORT || 3000;

// --- Express Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
    resave: false,
    saveUninitialized: false,
    // store: ...
  }));
  // ----------------------------------

  // --- Passport Middleware ---
  app.use(passport.initialize());
  app.use(passport.session());
  // ---------------------------

  // --- Passport Configuration ---

  // Serialize user (Callback style still works here)
  passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
  });

  // Deserialize user (Use Promises)
  passport.deserializeUser((id, done) => {
    console.log('Deserializing user with ID:', id);
    // Use .then().catch() with findById which returns a Promise
    User.findById(id)
      .then(user => {
        console.log('Deserialized user:', user);
        done(null, user); // Pass the user to done
      })
      .catch(err => {
        console.error('Error deserializing user:', err);
        done(err); // Pass the error to done
      });
  });


  // Configure the GitHub Strategy (Use async/await in the verify callback)
  passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/github/callback"
    },
    // Verify callback function using async/await
    async function(accessToken, refreshToken, profile, done) {
      console.log('GitHub profile received:', profile);

      try {
        // Find user using await with findOne
        let user = await User.findOne({ githubId: profile.id });

        if (user) {
          // User already exists
          console.log('Existing user found:', user.username);
          return done(null, user);
        } else {
          // User does not exist, create new user
          console.log('Creating new user:', profile.username);
          const newUser = new User({
            githubId: profile.id,
            username: profile.username,
            // ... other fields
          });

          // Save new user using await with save
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

  // --- Middleware to Check Authentication (Keep this) ---
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    // User is not logged in, redirect them
    res.redirect('/auth/github');
    // Or for API routes: res.status(401).json({ message: 'Unauthorized' });
  }
  // --------------------------------------------------


  // Serve static files from the 'public' directory
  app.use(express.static('public'));


  // --- Authentication Routes (Keep these) ---
  app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
  app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/' }),
    (req, res) => { res.redirect('/dashboard'); }
  );
  app.get('/logout', (req, res) => {
      req.logout(() => {
          console.log('User logged out');
          res.redirect('/');
      });
  });
  app.get('/profile', (req, res) => {
    if (req.isAuthenticated()) { res.json({ isAuthenticated: true, user: req.user }); }
    else { res.json({ isAuthenticated: false }); }
  });
  app.get('/dashboard', ensureAuthenticated, (req, res) => {
      res.send(`
          <h1>Welcome to your dashboard, ${req.user.username}!</h1>
          <p>User ID: ${req.user.id}</p>
          <p><a href="/logout">Logout</a></p>
          <hr>
          <h2>Add a new image:</h2>
          <form id="add-image-form">
              Image URL: <input type="text" id="image-url" name="url" required><br><br>
              Description: <input type="text" id="image-description" name="description"><br><br>
              <button type="submit">Add Image</button>
          </form>
          <hr>
          <h2>Your Images:</h2>
          <div id="my-images-wall">
              </div>
          <script src="/js/dashboard.js"></script>
          <script src="https://unpkg.com/masonry-layout@4/dist/masonry.pkgd.min.js"></script> <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script> `); // Added script tags for dashboard.js, Masonry, and jQuery here
  });
  // ---------------------------------------


  // --- Image API Routes (Use async/await) ---

  // Route to add a new image (requires authentication)
  app.post('/api/images', ensureAuthenticated, async (req, res) => { // Make route handler async
      const { url, description } = req.body;

      if (!url) {
          return res.status(400).json({ message: 'Image URL is required.' });
      }

      try {
          const newImage = new Image({
              url: url,
              description: description,
              owner: req.user._id // Use logged-in user's ID
          });

          // Save the image using await
          const savedImage = await newImage.save();
          console.log('Image saved:', savedImage);
          res.status(201).json(savedImage);

      } catch (err) {
          console.error('Error saving image:', err);
          res.status(500).json({ message: 'Error saving image.', error: err });
      }
  });

  // Route to get images for the logged-in user (requires authentication)
  app.get('/api/my-images', ensureAuthenticated, async (req, res) => { // Make route handler async
      try {
          // Find images using await with find and exec
          const images = await Image.find({ owner: req.user._id })
                                   .sort({ createdAt: -1 })
                                   .exec(); // .exec() is optional but good practice with async/await queries

          console.log(`Found ${images.length} images for user ${req.user.username}`);
          res.json(images);

      } catch (err) {
          console.error('Error fetching user images:', err);
          res.status(500).json({ message: 'Error fetching images.', error: err });
      }
  });

  // --- End Image API Routes ---


  // Start the server - This should remain inside the mongoose connection.once('open', ...) block
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// ... other requires at the top ...