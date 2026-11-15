const mongoose = require('mongoose');
const config = require('./config');

// Serverless functions reuse the module between requests, so keep one
// connection promise instead of reconnecting on every call.
let connecting = null;

async function connectDb(uri = config.mongoUri) {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }
  if (!connecting) {
    connecting = mongoose
      .connect(uri, { dbName: config.mongoDbName, serverSelectionTimeoutMS: 10000 })
      .catch((err) => {
        connecting = null;
        throw err;
      });
  }
  await connecting;
  return mongoose.connection;
}

async function disconnectDb() {
  connecting = null;
  await mongoose.disconnect();
}

module.exports = { connectDb, disconnectDb };
