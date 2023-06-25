const express = require('express');
const app = express();

// Route for handling GET requests to the root URL
app.get('/', (req, res) => {
  res.send('Welcome to the dating app!');
});

// Route for handling GET requests to the user's profile
app.get('/profile', (req, res) => {
  res.send('This is your dating profile!');
});

// Route for handling GET requests to search for other users
app.get('/search', (req, res) => {
  res.send('Search for other users here!');
});

// Route for handling GET requests to view matches
app.get('/matches', (req, res) => {
  res.send('View your matches here!');
});

// Route for handling POST requests to update user settings
app.post('/settings', (req, res) => {
  res.send('Update your settings here!');
});

// Route for handling POST requests to send a message to another user
app.post('/chat', (req, res) => {
  res.send('Send a message to another user here!');
});

// Start the server
app.listen(4000, () => {
  console.log('Server listening on port 4000');
});