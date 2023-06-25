const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const winston = require('winston');
const helmet = require('helmet');
const { CloudflareWAF } = require('@cloudflare/waf');

// Create a logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'chat-service' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Middleware for parsing JSON data
router.use(express.json());

// Rate limiting middleware to prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
router.use(limiter);

// Route for handling POST requests to send a message to another user
router.post('/', (req, res) => {
  const schema = Joi.object({
    recipient: Joi.string().required(),
    message: Joi.string().required()
  });

  const { error } = schema.validate(req.body);

  if (error) {
    logger.error(error.details[0].message);
    return res.status(400).send(error.details[0].message);
  }

  const { recipient, message } = req.body;

  // TODO: Send message to recipient
  logger.info(`Message sent to ${recipient}: ${message}`);

  res.send(`Message sent to ${recipient}: ${message}`);
});

// Disable the X-Powered-By header
router.disable('x-powered-by');

// Set security-related headers using the Helmet middleware
router.use(helmet());

// Use Cloudflare WAF to protect against common web attacks
router.use(CloudflareWAF({
  // Your Cloudflare API credentials
  apiKey: 'YOUR_API_KEY',
  apiEmail: 'YOUR_EMAIL',
  // The ID of the Cloudflare zone you want to protect
  zoneId: 'YOUR_ZONE_ID',
  // The ID of the Cloudflare firewall rule you want to use
  firewallRuleId: 'YOUR_FIREWALL_RULE_ID'
}));

module.exports = router;