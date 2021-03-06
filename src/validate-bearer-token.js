const logger = require('./logger');

function validateBearerToken(req, res, next) {
  const authToken = req.get('Authorization')|| '';
  if (!authToken || authToken.split(' ')[1] !== process.env.API_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized request' });
  }
  next();
}

module.exports = validateBearerToken;