# eLibrary

eLibrary is a digital platform designed to manage and access a wide variety of books and learning materials. The project aims to provide users with a simple, intuitive interface for browsing, searching, and organizing digital content efficiently. This platform will serve as a convenient tool for students and book enthusiasts alike.

## Team Members
- Dmukhailo Darya, SE-2427  
- Rafikova Shugyla, SE-2427  

## Installation & Run Instructions
1. Clone or download the project repository  
2. Navigate to the project folder
3. Install dependencies: npm install

## Start the server
1. Type node server.js on Terminal
2. Open your browser and go to http://localhost:3000

## Database Setup

Database: MongoDB (local or Atlas)
Collection: books

Book document structure:

- _id (ObjectId, automatically generated)
- title (String, required)
- author (String, required)
- description (String, optional)

The collection is automatically created when the first book is inserted.
MongoDB Connection:The app uses the native MongoDB Node.js driver. Connection is handled in database/mongo.js using async/await.

## Future Development Plan
Week 2:  
  Add basic interaction to the website: forms, buttons, and simple navigation.  
  Create POST routes in Express to handle user input.
Week 3:  
  Connect the project to a database to store books and user information.  
  Display stored data on the website.
Week 4:  
  Implement user authentication (registration and login).  
  Improve both frontend layout and backend logic.
Week 5:  
  Add more application features and improve UI design.  
  Clean up code and prepare the project for final submission.



# eLibrary Part 2

## Project Description
eLibrary is a simple Express.js web application that demonstrates routing, form handling, and basic backend logic.

## Technologies Used
- Node.js
- Express.js
- HTML5
- CSS3


## Built-in Middleware
- `express.urlencoded({ extended: true })`  
  Parses incoming form data and makes it available in `req.body`.

## Custom Logger Middleware
- Logs each incoming request to the console, including:
  - HTTP method
  - Requested URL

This middleware helps with debugging and tracking application activity.

## Built-in JSON Middleware
- `app.use(express.json())`
- Parses incoming JSON payloads and makes the data available in req.body.

This middleware is required for handling API requests where the client sends data as JSON. It ensures that our server can read and process JSON-formatted input correctly.


## Routes
- GET `/` – Home page
- GET `/about` – Team and project information
- GET `/contact` – Contact form
- POST `/contact` – Handles form submission
- GET `/search?q=...` – Search page
- 404 – Page not found handler

## API Routes (CRUD for books)
- GET `/api/books` (returns all books sorted by id ascending)
- GET `/api/books/:id` (returns a single book by its id)
- POST `/api/books` (creates a new book)
- PUT `/api/books/:id` (updates an existing book by id)
- DELETE `/api/books/:id` (deletes a book by id)

## Filtering, Sorting, Projection
- Filtering: `/api/books?author=John`
- Sorting: `/api/books?sort=title`
- Projection: `/api/books?fields=title,author`

## How to Test API
Open browser or Postman and try:
http://localhost:3000/api/books – GET all books
http://localhost:3000/api/books/1 – GET book with ID 1
Use POST, PUT, DELETE in Postman with JSON body to manage books

## Contact Form
The contact form includes:
- Name
- Email
- Message

Submitted data is sent to the backend using POST. The server:
- Validates that all fields are filled (returns HTTP 400 if missing)
- Logs the submitted data with `req.body`
- Saves the submitted data into a `contacts.json` file using `fs.writeFile()`

Each entry in `contacts.json` includes:
- `name`
- `email`
- `message`
- `date` (timestamp of submission)


## How to Run the Project
1. Install dependencies:
   ```bash
   npm install



