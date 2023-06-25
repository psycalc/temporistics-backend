const express = require('express');
const app = express();

// Middleware for parsing JSON data
app.use(express.json());

// Import routes
const indexRouter = require('./routes/index');
const profileRouter = require('./routes/profile');
const searchRouter = require('./routes/search');
const matchesRouter = require('./routes/matches');
const settingsRouter = require('./routes/settings');
const chatRouter = require('./routes/chat');

// Use routes
app.use('/', indexRouter);
app.use('/profile', profileRouter);
app.use('/search', searchRouter);
app.use('/matches', matchesRouter);
app.use('/settings', settingsRouter);
app.use('/chat', chatRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
app.listen(4000, () => {
  console.log('Server listening on port 4000');
});