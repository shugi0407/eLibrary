// Authentication state
let isAuthenticated = false;

// Check authentication status on page load
async function checkAuthStatus() {
  try {
    const response = await fetch('/api/auth/status');
    const data = await response.json();
    isAuthenticated = data.authenticated;
    
    updateUIForAuthStatus();
  } catch (error) {
    console.error('Error checking auth status:', error);
    isAuthenticated = false;
  }
}

// Update UI based on authentication status
function updateUIForAuthStatus() {
  const loginBtn = document.querySelector('.login-btn');
  const form = document.getElementById('book-form');
  const deleteBtn = document.getElementById('delete-book');
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
  
  if (isAuthenticated) {
    // Show sign-out button
    if (loginBtn) {
      loginBtn.textContent = 'Sign Out';
      loginBtn.href = '#';
      loginBtn.onclick = async (e) => {
        e.preventDefault();
        await signOut();
      };
    }
    
    // Enable form controls
    if (deleteBtn) deleteBtn.disabled = false;
    if (submitBtn) submitBtn.disabled = false;
  } else {
    // Show login button
    if (loginBtn) {
      loginBtn.textContent = 'Login';
      loginBtn.href = '/sign-in';
      loginBtn.onclick = null;
    }
    
    // Disable form controls
    if (deleteBtn) deleteBtn.disabled = true;
    if (submitBtn) submitBtn.disabled = true;
  }
}

// Sign out function
async function signOut() {
  try {
    const response = await fetch('/api/sign-out', {
      method: 'POST'
    });
    
    if (response.ok) {
      window.location.reload();
    }
  } catch (error) {
    console.error('Error signing out:', error);
    alert('Failed to sign out');
  }
}

// get the books container element
const booksContainer = document.getElementById('books');

// function to fetch books from api with optional sort, fields, and filters
async function loadBooks({ sort, fields, filters } = {}) {
  try {
    // build query string
    let query = '';
    if (sort || fields || (filters && Object.keys(filters).length)) {
      const params = new URLSearchParams();

      // add sort if provided
      if (sort) params.append('sort', sort);

      // add fields if provided
      if (fields) params.append('fields', fields);

      // add filters if provided
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }

      query = `?${params.toString()}`;
    }

    // fetch books from api
    const response = await fetch(`/api/books${query}`);
    const books = await response.json();

    // render books on the page
    renderBooks(books);
  } catch (error) {
    console.error('Error loading books:', error);
    booksContainer.innerHTML = '<p>Failed to load books.</p>';
  }
}

// function to render books in the container
function renderBooks(books) {
  if (!books.length) {
    booksContainer.innerHTML = '<p>No books found.</p>';
    return;
  }

  booksContainer.innerHTML = books
  .map(book => `
    <div class="book-card">
      ${book.title ? `<h3>${book.title}</h3>` : ''}
      ${book.author ? `<p class="author">Author: ${book.author}</p>` : ''}
      ${book.year ? `<p class="year">Year: ${book.year}</p>` : ''}
      ${book.genre ? `<p class="genre">Genre: ${book.genre}</p>` : ''}
      ${book.language ? `<p class="language">Language: ${book.language}</p>` : ''}
      ${book.description ? `<p class="description">${book.description}</p>` : ''}

      ${isAuthenticated ? `
        <button class="edit-btn" data-id="${book._id}">
          Edit
        </button>
      ` : '<p style="color: #999; font-size: 12px;">Login to edit</p>'}
    </div>
  `)
  .join('');

  // add listeners after render
  addEditListeners();
}

// add click listeners to edit buttons
function addEditListeners() {
  const editButtons = document.querySelectorAll('.edit-btn');

  editButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;

      // get full book from api (without projection!)
      const res = await fetch(`/api/books/${id}`);
      const book = await res.json();

      fillForm(book);
    });
  });
}

// fill the form with book data
function fillForm(book) {
  const bookIdInput = document.getElementById('book-id');
  const titleInput = document.getElementById('book-title');
  const authorInput = document.getElementById('book-author');
  const yearInput = document.getElementById('book-year');
  const genreInput = document.getElementById('book-genre');
  const descriptionInput = document.getElementById('book-description');
  const languageInput = document.getElementById('book-language');

  if (bookIdInput) bookIdInput.value = book._id || '';
  if (titleInput) titleInput.value = book.title || '';
  if (authorInput) authorInput.value = book.author || '';
  if (yearInput) yearInput.value = book.year || '';
  if (genreInput) genreInput.value = book.genre || '';
  if (descriptionInput) descriptionInput.value = book.description || '';
  if (languageInput) languageInput.value = book.language || 'English';
}

// get filter and sort elements
const filterAuthorInput = document.getElementById('filter-author');
const sortBySelect = document.getElementById('sort-by');
const applyFiltersBtn = document.getElementById('apply-filters');

// add event listener to apply button
applyFiltersBtn.addEventListener('click', () => {
  const author = filterAuthorInput.value.trim();
  const sort = sortBySelect.value;

  // get selected fields for projection
  const selectedFields = Array.from(
    document.querySelectorAll('.field-checkbox:checked')
  ).map(cb => cb.value);

  const fields = selectedFields.join(',');

  loadBooks({
    sort,
    fields,
    filters: { author }
  });
});

// crud form elements
const form = document.getElementById('book-form');
const bookIdInput = document.getElementById('book-id');
const titleInput = document.getElementById('book-title');
const authorInput = document.getElementById('book-author');
const yearInput = document.getElementById('book-year');
const genreInput = document.getElementById('book-genre');
const descriptionInput = document.getElementById('book-description');
const languageInput = document.getElementById('book-language');
const deleteBtn = document.getElementById('delete-book');

// create or update book
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!isAuthenticated) {
    alert('You must be logged in to perform this action');
    window.location.href = '/sign-in';
    return;
  }

  const id = bookIdInput.value;

  const bookData = {
    title: titleInput.value,
    author: authorInput.value,
    description: descriptionInput.value,
    year: parseInt(yearInput.value),
    genre: genreInput.value,
    language: languageInput.value || 'English'
  };

  try {
    let response;
    
    if (id) {
      // update existing book
      response = await fetch(`/api/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData)
      });
    } else {
      // create new book
      response = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData)
      });
    }

    if (response.status === 401) {
      alert('Session expired. Please login again.');
      window.location.href = '/sign-in';
      return;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Operation failed');
    }

    alert(id ? 'Book updated successfully!' : 'Book created successfully!');
    form.reset();
    loadBooks(); // reload books after change
  } catch (error) {
    console.error('Error:', error);
    alert(error.message || 'Failed to save book');
  }
});

// delete book by id
deleteBtn.addEventListener('click', async () => {
  if (!isAuthenticated) {
    alert('You must be logged in to delete books');
    window.location.href = '/sign-in';
    return;
  }

  const id = bookIdInput.value;

  if (!id) {
    alert('Select a book to delete using edit button');
    return;
  }

  if (!confirm('Are you sure you want to delete this book?')) {
    return;
  }

  try {
    const response = await fetch(`/api/books/${id}`, {
      method: 'DELETE'
    });

    if (response.status === 401) {
      alert('Session expired. Please login again.');
      window.location.href = '/sign-in';
      return;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Delete failed');
    }

    alert('Book deleted successfully!');
    form.reset();
    loadBooks(); // reload books after delete
  } catch (error) {
    console.error('Error:', error);
    alert(error.message || 'Failed to delete book');
  }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
  await loadBooks();
});