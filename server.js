const express = require('express');
const path = require('path');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const { connectDB, getBooksCollection } = require('./database/mongo');


const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARE
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Custom logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// HTML ROUTES 
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


const { getUsersCollection } = require('./database/mongo');
const bcrypt = require('bcrypt'); 

// POST /api/sign-in
app.post('/api/sign-in', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const collection = getUsersCollection();
    const user = await collection.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    res.status(200).json({
      message: "Sign-in successful",
      user: {
        _id: user._id,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});




app.get('/search', (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).send(`
      <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>Error 400</title>
            <link rel="stylesheet" href="/style.css">
          </head>
          <body>
            <div class="container">
              <h2>Error 400</h2>
              <p>Missing required query parameter <strong>"q"</strong>.</p>
              <a href="/" class="btn">Go back</a>
            </div>
          </body>
          </html>
          `);
  }

  res.send(`
    <!DOCTYPE html>
      <html lang="en">
      <head>
         <meta charset="UTF-8">
         <title>Search Results</title>
         <link rel="stylesheet" href="/style.css">
      </head>
      <body>
        <div class="container">
          <h2>Search Results</h2>
          <p>You searched for: <strong>${query}</strong></p>
          <a href="/" class="btn">New search</a>
        </div>
      </body>
      </html>
      `);
});

// API INFO 
app.get('/api/info', (req, res) => {
  res.status(200).json({
    project: 'E-Library',
    description: 'REST API for managing books (MongoDB)',
    endpoints: {
      getAll: 'GET /api/books',
      getById: 'GET /api/books/:id',
      create: 'POST /api/books',
      update: 'PUT /api/books/:id',
      delete: 'DELETE /api/books/:id'
    }
  });
});

// API ROUTES (CRUD)

// GET all books (filtering, sorting, projection)
app.get('/api/books', async (req, res) => {
  try {
    const collection = getBooksCollection();

    const { sort, fields, ...filters } = req.query;

    // FILTER
    const query = {};
    for (const [key, value] of Object.entries(filters)) {
      query[key] = { $regex: value, $options: 'i' };
    }

    // SORT
    let sortOptions = {};
    if (sort) {
      if (sort.startsWith('-')) {
        sortOptions[sort.slice(1)] = -1; // DESC
      } else {
        sortOptions[sort] = 1; // ASC
      }
    }

    // PROJECTION
    let projection = {};
    if (fields) {
      fields.split(',').forEach(field => {
        projection[field] = 1;
      });
    }

    const books = await collection.find(query).sort(sortOptions).project(projection).toArray();
    res.status(200).json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


// GET book by id
app.get('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const collection = getBooksCollection();
    const book = await collection.findOne({ _id: new ObjectId(id) });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create book
app.post('/api/books', async (req, res) => {
  try {
    const { title, author, description, year, genre } = req.body; 

    if (!title || !author) {
      return res.status(400).json({
        error: 'Title and author are required'
      });
    }

    const collection = getBooksCollection();

    const result = await collection.insertOne({
      title,
      author,
      description: description || '',
      year: year ? parseInt(year) : null,  
      genre: genre || ''                 
    });

    res.status(201).json({
      _id: result.insertedId,
      title,
      author,
      description: description || '',
      year: year ? parseInt(year) : null,
      genre: genre || ''
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update book
app.put('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, description, year, genre } = req.body; 

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    if (!title || !author) {
      return res.status(400).json({
        error: 'Title and author are required'
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
          year: year ? parseInt(year) : null, 
          genre: genre || ''                  
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.status(200).json({ message: 'Book updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


// DELETE book
app.delete('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const collection = getBooksCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// CONTACT FORM 

app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Error</title>
        <link rel="stylesheet" href="/style.css">
      </head>
      <body>
        <div class="container">
          <h2>Error: Missing required fields</h2>
          <p>All fields (name, email, message) are required.</p>
          <a href="/contact" class="btn">Go back</a>
        </div>
      </body>
      </html>
    `);
  }
  
  const contactData = {
    name,
    email,
    message,
    date: new Date().toISOString()
  };

  const filePath = path.join(__dirname, 'contacts.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    let contacts = [];

    if (!err && data) {
      try {
        contacts = JSON.parse(data);
      } catch (e) {
        console.error('Error parsing JSON:', e);
      }
    }

    contacts.push(contactData);

    fs.writeFile(filePath, JSON.stringify(contacts, null, 2), (err) => {
      if (err) {
        console.error('Error saving contact:', err);
        return res.status(500).send('Internal Server Error');
      }

      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Thank you</title>
          <link rel="stylesheet" href="/style.css">
        </head>
        <body>
          <div class="container">
            <h2>Thanks, ${name}! Your message has been received.</h2>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong> ${message}</p>
            <a href="/contact" class="btn">Go back</a>
          </div>
        </body>
        </html>
      `);
    });
  });
});


// GLOBAL 404
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'API endpoint does not exist'
    });
  }

  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>404 — Page Not Found</title>
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <div class="container">
        <h2>404 — Page Not Found</h2>
        <p>Sorry, the page you are looking for doesn't exist.</p>
        <a href="/" class="btn">Go to Home</a>
      </div>
    </body>
    </html>
  `);
});

// START SERVER
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});

