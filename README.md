# E-Library Web Application  
Assignment 3 – Part 2: Deployment and Production Web Application

---

## 1. Project Overview

This project is a full-stack web application developed as part of Assignment 3 – Part 2.  
The application represents an electronic library system (E-Library) that allows users to manage book records through a web interface.
The system provides full CRUD (Create, Read, Update, Delete) functionality and is deployed in a production environment with proper configuration of environment variables.

Team members:
- Rafikova Shugyla, SE-2427
- Dmukhailo Darya, SE-2427

---

## 2. Objectives

The main objectives of this project are:

- To deploy a full-stack web application to a public hosting platform
- To connect a frontend user interface to a backend API
- To implement and demonstrate full CRUD functionality
- To configure environment variables for production
- To understand the differences between local and production environments

---

## 3. Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB
- MongoDB Node.js Driver

### Frontend
- HTML
- CSS
- JavaScript
- Fetch API

### Deployment
- Render (Cloud Hosting Platform)
- MongoDB Atlas (Cloud Database)

### Version Control
- Git
- GitHub

---

## 4. Features
- Displaying a list of books in the web interface
- Adding new books using a form
- Updating existing book records
- Deleting books
- Dynamic loading of data from the backend API
- Stable operation in a production environment

All CRUD operations are implemented and accessible through the web interface.

---

## 5. New Features Added

- User authentication and role-based access (admin and regular users)
- Conditional rendering of book actions based on ownership and user role
- Form clear functionality properly resets inputs and disables delete button
- Enhanced UI feedback: messages for edit permissions and login status

## 6. Production Environment (Render)
In production, environment variables are configured via the Render dashboard:
MONGO_URI
DB_NAME
PORT (automatically assigned by Render)
Hardcoded secrets are not used in the source code.

---

## 7. Deployed Application
Public URL: https://elibrary-n1ps.onrender.com
