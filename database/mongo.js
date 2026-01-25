const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/elibrary';
const client = new MongoClient(uri);

let db;

async function connectDB() {
  if (db) return db;

  try {
    await client.connect();
    const dbName = process.env.DB_NAME || 'elibrary';
    db = client.db(dbName);
    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

function getBooksCollection() {
  if (!db) throw new Error('Database not initialized. Call connectDB first.');
  return db.collection('books');
}

module.exports = { connectDB, getBooksCollection };
