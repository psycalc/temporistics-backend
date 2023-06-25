const express = require('express');
const router = express.Router();

// Route for handling GET requests to the root URL
router.get('/', (req, res) => {
  res.send('Welcome to the dating app!');
});

module.exports = router;