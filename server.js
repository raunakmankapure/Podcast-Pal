const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/user-authentication', { useNewUrlParser: true, useUnifiedTopology: true });

// Create a User model
const User = mongoose.model('User', {
  username: String,
  password: String,
});

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'your-secret-key', resave: false, saveUninitialized: true }));

// Serve the index.html file
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  res.sendFile(indexPath);
});

// Serve the login.html file
app.get('/login.html', (req, res) => {
  const loginPath = path.join(__dirname, 'login.html');
  res.sendFile(loginPath);
});

// Register route
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the username already exists
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      // Redirect to login if the account already exists
      res.redirect('/login.html');
    } else {
      // Hash the password and save the new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ username, password: hashedPassword });
      await newUser.save();
      res.redirect('/login.html');
    }
  } catch (error) {
    res.status(500).send('Error registering user');
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = user;
      res.redirect('/dashboard');
    } else {
      res.redirect('/login.html');
    }
  } catch (error) {
    res.status(500).send('Error logging in');
  }
});

// Dashboard route
app.get('/dashboard', (req, res) => {
  if (req.session.user) {
    res.send(`Welcome, ${req.session.user.username}!`);
  } else {
    res.redirect('/login.html');
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
