const express = require('express');
const router = express.Router();

// Route for handling GET requests to search for other users
router.get('/', (req, res) => {
  res.send('Search for other users here!');
});

module.exports = router;