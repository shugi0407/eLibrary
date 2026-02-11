require('dotenv').config();
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = 'elibrary';

async function createTestUser() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({
      email: 'example@example.com'
    });

    if (existingUser) {
      console.log('Admin already exists!');
      return;
    }

    const hashedPassword = await bcrypt.hash('password123', 10);

    const result = await usersCollection.insertOne({
      email: 'example@example.com',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date()
    });

    console.log('Admin created!');
    console.log('Email: example@example.com');
    console.log('Password: password123');
    console.log('ID:', result.insertedId);

  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

createTestUser();
