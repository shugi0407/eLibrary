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
      ${book.description ? `<p class="description">${book.description}</p>` : ''}

      <button class="edit-btn" data-id="${book._id}">
        Edit
      </button>
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
  bookIdInput.value = book._id || '';
  titleInput.value = book.title || '';
  authorInput.value = book.author || '';
  yearInput.value = book.year || '';
  genreInput.value = book.genre || '';
  descriptionInput.value = book.description || '';
}



// initial load of all books
loadBooks();

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
const deleteBtn = document.getElementById('delete-book');

// create or update book
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = bookIdInput.value;

  const bookData = {
  title: titleInput.value,
  author: authorInput.value,
  description: descriptionInput.value,
  year: parseInt(yearInput.value),
  genre: genreInput.value
};


  if (id) {
    // update existing book
    await fetch(`/api/books/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookData)
    });
  } else {
    // create new book
    await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookData)
    });
  }

  form.reset();
  loadBooks(); // reload books after change
});

// delete book by id
deleteBtn.addEventListener('click', async () => {
  const id = bookIdInput.value;

  if (!id) {
    alert('select a book to delete using edit button');
    return;
  }

  await fetch(`/api/books/${id}`, {
    method: 'DELETE'
  });

  form.reset();
  loadBooks(); // reload books after delete
});
