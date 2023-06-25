const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { getMatches } = require('../controllers/matches');
const { validationResult } = require('express-validator');
const { match } = require('assert');
const { Match } = require('../models/match');

// Route for handling GET requests to view matches
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const matches = await getMatches(userId);
    res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

// Route for handling POST requests to create a new match
router.post('/', authenticateUser, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, otherUserId } = req.body;

    // Check if the match already exists
    const existingMatch = await Match.findOne({
      $or: [
        { user: userId, otherUser: otherUserId },
        { user: otherUserId, otherUser: userId }
      ]
    });

    if (existingMatch) {
      return res.status(400).json({ msg: 'Match already exists' });
    }

    // Create a new match
    const match = new Match({
      user: userId,
      otherUser: otherUserId
    });

    await match.save();

    res.json(match);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;