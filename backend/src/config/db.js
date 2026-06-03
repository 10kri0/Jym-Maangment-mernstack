const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { env } = require('./env');

let memoryMongo = null;

async function connectDB() {
  try {
    await mongoose.connect(env.MONGODB_URL, {
      dbName: env.DATABASE_NAME,
      serverSelectionTimeoutMS: env.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Could not connect to MongoDB. Check MONGODB_URL, confirm local MongoDB is running, or add your current IP address in MongoDB Atlas Network Access.'
      );
    }

    console.warn('MongoDB is not reachable. Starting temporary in-memory MongoDB for development.');
    memoryMongo = await MongoMemoryServer.create();
    await mongoose.connect(memoryMongo.getUri(), {
      dbName: env.DATABASE_NAME,
      serverSelectionTimeoutMS: env.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
    });
    console.log('Connected to in-memory MongoDB');
  }
}

async function closeDB() {
  await mongoose.connection.close();
  if (memoryMongo) {
    await memoryMongo.stop();
  }
  console.log('MongoDB connection closed');
}

module.exports = { connectDB, closeDB };
