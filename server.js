const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const { ObjectId } = require('mongodb');
const { connectDB, getBooksCollection, getUsersCollection } =
  require('./database/mongo');

const bcrypt = require('bcrypt');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;

const app = express();
const PORT = process.env.PORT || 3000;

/* ======================
   MIDDLEWARE
====================== */

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* CORS (needed for credentials: include) */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  })
);

/* ======================
   SESSION CONFIG
====================== */

app.use(
  session({
    name: 'elibrary.sid',

    secret: process.env.SESSION_SECRET || 'change-this-secret',

    resave: false,

    saveUninitialized: false,

    store: MongoStore({
      mongoUrl:
        process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/elibrary',
      collectionName: 'sessions'
    }),

    cookie: {
      httpOnly: true, // security
      secure: process.env.NODE_ENV === 'production', // HTTPS in prod
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
  })
);

/* ======================
   LOGGER
====================== */

app.use((req, res, next) => {
  console.log(
    `${req.method} ${req.url} | User: ${
      req.session.userId || 'Guest'
    }`
  );
  next();
});

/* ======================
   STATIC FILES
====================== */

app.use(express.static(path.join(__dirname, 'public')));

/* ======================
   AUTH MIDDLEWARE
====================== */

function requireAuth(req, res, next) {

  console.log('CHECK AUTH:', req.session);

  if (!req.session.userId) {
    console.log('BLOCKED');
    return res.status(401).json({
      error: 'Unauthorized'
    });
  }

  console.log('ALLOWED');
  next();
}


/* ======================
   HTML ROUTES
====================== */

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/library', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'library.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'team.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'contact.html'));
});

app.get('/sign-in', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'sign-in.html'));
});


app.get('/sign-up', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'sign-up.html'));
});


// AUTH API ROUTES

// POST /api/sign-up - Register new user
app.post('/api/sign-up', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const users = getUsersCollection();

    // Check if user already exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user to DB
    await users.insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date()
    });

    res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
    console.error('Sign-up error:', error);
    res.status(500).json({ error: "Server error" });
  }
});


// POST /api/sign-in - Creates session
app.post('/api/sign-in', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 'Invalid credentials' });
    }

    const users = getUsersCollection();

    const user = await users.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res
        .status(401)
        .json({ error: 'Invalid credentials' });
    }

    /* Create session */
    req.session.userId = user._id.toString();
    req.session.email = user.email;

    res.status(200).json({
      message: 'Login successful',
      user: {
        email: user.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// LOGOUT
app.post('/api/sign-out', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res
        .status(500)
        .json({ error: 'Logout failed' });
    }

    res.clearCookie('elibrary.sid');

    res.status(200).json({
      message: 'Logged out'
    });
  });
});

// AUTH STATUS
app.get('/api/auth/status', (req, res) => {
  if (req.session.userId) {
    return res.status(200).json({
      authenticated: true,
      email: req.session.email
    });
  }

  res.status(200).json({
    authenticated: false
  });
});

/* ======================
   BOOKS API (CRUD)
====================== */

// GET ALL (PUBLIC)
app.get('/api/books', async (req, res) => {
  try {
    const collection = getBooksCollection();

    const { sort, fields, ...filters } = req.query;

    /* Filters */
    const query = {};

    for (const [key, value] of Object.entries(filters)) {
      query[key] = { $regex: value, $options: 'i' };
    }

    /* Sorting */
    let sortOptions = {};

    if (sort) {
      if (sort.startsWith('-')) {
        sortOptions[sort.slice(1)] = -1;
      } else {
        sortOptions[sort] = 1;
      }
    }

    /* Projection */
    let projection = {};

    if (fields) {
      fields.split(',').forEach(f => {
        projection[f] = 1;
      });
    }

    const books = await collection
      .find(query)
      .sort(sortOptions)
      .project(projection)
      .toArray();

    res.status(200).json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET BY ID (PUBLIC)
app.get('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const collection = getBooksCollection();

    const book = await collection.findOne({
      _id: new ObjectId(id)
    });

    if (!book) {
      return res.status(404).json({
        error: 'Book not found'
      });
    }

    res.status(200).json(book);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// CREATE (PROTECTED)
app.post('/api/books', requireAuth, async (req, res) => {
  try {
    const {
      title,
      author,
      description,
      year,
      genre,
      isbn,
      publisher,
      language
    } = req.body;

    if (!title || !author || !genre || !year) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    const collection = getBooksCollection();

    const book = {
      title,
      author,
      description: description || '',
      year: parseInt(year),
      genre,
      isbn: isbn || '',
      publisher: publisher || '',
      language: language || 'English'
    };

    const result = await collection.insertOne(book);

    res.status(201).json({
      _id: result.insertedId,
      ...book
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE (PROTECTED)
app.put('/api/books/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const {
      title,
      author,
      description,
      year,
      genre,
      isbn,
      publisher,
      language
    } = req.body;

    if (!title || !author || !genre || !year) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    const collection = getBooksCollection();

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title,
          author,
          description: description || '',
          year: parseInt(year),
          genre,
          isbn: isbn || '',
          publisher: publisher || '',
          language: language || 'English'
        }
      }
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ error: 'Book not found' });
    }

    res.status(200).json({
      message: 'Updated'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE (PROTECTED)
app.delete('/api/books/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const collection = getBooksCollection();

    const result = await collection.deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ error: 'Book not found' });
    }

    res.status(200).json({
      message: 'Deleted'
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ======================
   404 HANDLER
====================== */

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      error: 'Not Found'
    });
  }

  res.status(404).sendFile(
    path.join(__dirname, 'views', '404.html')
  );
});

/* ======================
   START SERVER
====================== */

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
