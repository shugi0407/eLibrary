const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/elibrary';
const client = new MongoClient(uri);

let db;
let booksCollection;
let usersCollection;

async function connectDB() {
  if (db) return db;

  try {
    await client.connect();
    const dbName = process.env.DB_NAME || 'elibrary';
    db = client.db(dbName);

    booksCollection = db.collection('books');
    usersCollection = db.collection('users');

    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

function getBooksCollection() {
  if (!db) throw new Error('Database not initialized. Call connectDB first.');
  return booksCollection;
}

function getUsersCollection() {
  if (!db) throw new Error('Database not initialized. Call connectDB first.');
  return usersCollection;
}

module.exports = { connectDB, getBooksCollection, getUsersCollection };
