const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const { authenticateUser } = require('../middleware/auth');
const { getUserProfile, updateUserProfile } = require('../controllers/profile');
const { validationResult } = require('express-validator');
const { User } = require('../models/user');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const Joi = require('joi');
const moment = require('moment');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const winston = require('winston');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// Use body-parser middleware to parse the request body
router.use(bodyParser.json());

// Use passport middleware for authentication
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return done(null, false, { message: 'Incorrect email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return done(null, false, { message: 'Incorrect email or password.' });
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Route for handling GET requests to the user's profile
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const userProfile = await getUserProfile(userId);
    res.json(userProfile);
  } catch (error) {
    winston.error(error);
    res.status(500).send('Internal server error');
  }
});

// Route for handling PUT requests to update the user's profile
router.put('/', authenticateUser, upload.single('profilePicture'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { name, bio, dateOfBirth, password } = req.body;

    // Validate the date of birth using Joi
    const schema = Joi.object({
      dateOfBirth: Joi.date().format('YYYY-MM-DD').utc().max(moment.utc().subtract(18, 'years'))
    });

    const { error } = schema.validate({ dateOfBirth });
    if (error) {
      return res.status(400).json({ msg: 'Invalid date of birth' });
    }

    // Hash and salt the password using bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update the user's profile
    const user = await User.findById(userId);
    user.name = name;
    user.bio = bio;
    user.dateOfBirth = dateOfBirth;
    user.password = hashedPassword;

    if (req.file) {
      user.profilePicture = req.file.filename;
    }

    await user.save();

    // Generate a JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    // Set the JWT token as a cookie
    res.cookie('token', token, { httpOnly: true });

    res.json(user);
  } catch (error) {
    winston.error(error);
    res.status(500).send('Internal server error');
  }
});

// Use helmet middleware to add security headers
router.use(helmet());

// Use Mongoose to connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((error) => console.log(error));

// Use Nodemailer to send emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

module.exports = router;