const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/elibrary';
const dbName = process.env.DB_NAME || 'elibrary';

async function createTestUser() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: 'test@example.com' });
    
    if (existingUser) {
      console.log('Test user already exists!');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create test user
    const result = await usersCollection.insertOne({
      email: 'test@example.com',
      password: hashedPassword,
      createdAt: new Date()
    });
    
    console.log('Test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    console.log('User ID:', result.insertedId);
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await client.close();
  }
}

createTestUser();