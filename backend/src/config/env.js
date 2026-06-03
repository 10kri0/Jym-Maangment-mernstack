const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env'), quiet: true });

const env = {
  PORT: Number(process.env.PORT || 8000),
  MONGODB_URL: process.env.MONGODB_URL || 'mongodb://localhost:27017',
  DATABASE_NAME: process.env.DATABASE_NAME || 'gym_management',
  JWT_SECRET: process.env.JWT_SECRET || 'default_secret_change_me',
  JWT_EXPIRY_HOURS: Number(process.env.JWT_EXPIRY_HOURS || 24),
  MONGODB_SERVER_SELECTION_TIMEOUT_MS: Number(
    process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000
  ),
};

module.exports = { env };
