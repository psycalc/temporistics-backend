const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { getUserProfile, updateUserProfile } = require('../controllers/profile');
const { validationResult } = require('express-validator');
const { User } = require('../models/user');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const Joi = require('joi');
const moment = require('moment');

// Route for handling GET requests to the user's profile
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const userProfile = await getUserProfile(userId);
    res.json(userProfile);
  } catch (error) {
    console.error(error);
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
    const { name, bio, dateOfBirth } = req.body;

    // Validate the date of birth using Joi
    const schema = Joi.object({
      dateOfBirth: Joi.date().format('YYYY-MM-DD').utc().max(moment.utc().subtract(18, 'years'))
    });

    const { error } = schema.validate({ dateOfBirth });
    if (error) {
      return res.status(400).json({ msg: 'Invalid date of birth' });
    }

    // Update the user's profile
    const user = await User.findById(userId);
    user.name = name;
    user.bio = bio;
    user.dateOfBirth = dateOfBirth;

    if (req.file) {
      user.profilePicture = req.file.filename;
    }

    await user.save();

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;