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

// Use body-parser middleware to parse the request body
router.use(bodyParser.json());

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

module.exports = router;