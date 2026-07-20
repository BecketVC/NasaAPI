// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesBtn = document.getElementById('getImagesBtn');
const gallery = document.getElementById('gallery');
const factEl = document.getElementById('spaceFact');

// Modal elements
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');
const modalMedia = document.getElementById('modalMedia');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Get your own free key at https://api.nasa.gov/ - DEMO_KEY works but has low rate limits
const NASA_API_KEY = 'DEMO_KEY';
const APOD_URL = 'https://api.nasa.gov/planetary/apod';

// A handful of fun space facts to greet users with on page load
const spaceFacts = [
  "Did You Know? A day on Venus is longer than its year.",
  "Did You Know? Neutron stars can spin up to 600 times per second.",
  "Did You Know? There are more stars in the universe than grains of sand on every beach on Earth.",
  "Did You Know? One million Earths could fit inside the Sun.",
  "Did You Know? Space is completely silent because there's no atmosphere to carry sound.",
  "Did You Know? The footprints on the Moon will last for millions of years since there's no wind to erode them.",
  "Did You Know? Saturn could float in water because it's mostly made of gas.",
  "Did You Know? The Milky Way galaxy is on a collision course with the Andromeda galaxy.",
  "Did You Know? A year on Mercury is just 88 Earth days.",
  "Did You Know? Jupiter's Great Red Spot is a storm that has raged for hundreds of years."
];

function showRandomFact() {
  const fact = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];
  factEl.textContent = `🌌 ${fact}`;
}

showRandomFact();

function showLoading() {
  gallery.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">🔄</div>
      <p>Loading space photos…</p>
    </div>
  `;
}

function showError(message) {
  gallery.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">⚠️</div>
      <p>${message}</p>
    </div>
  `;
}

function createGalleryItem(item) {
  const card = document.createElement('div');
  card.className = 'gallery-item';

  if (item.media_type === 'video') {
    // Show a video thumbnail/link since YouTube videos can't reuse the APOD image sizing
    card.innerHTML = `
      <div class="video-thumb">
        <div class="video-icon">▶️</div>
        <p class="video-label">Video</p>
      </div>
      <h3>${item.title}</h3>
      <p>${item.date}</p>
    `;
  } else {
    card.innerHTML = `
      <img src="${item.url}" alt="${item.title}" loading="lazy" />
      <h3>${item.title}</h3>
      <p>${item.date}</p>
    `;
  }

  card.addEventListener('click', () => openModal(item));
  return card;
}

function renderGallery(items) {
  gallery.innerHTML = '';

  if (!items.length) {
    showError('No space images found for that date range.');
    return;
  }

  items.forEach((item) => {
    gallery.appendChild(createGalleryItem(item));
  });
}

function openModal(item) {
  if (item.media_type === 'video') {
    if (/\.(mp4|mov|webm)$/i.test(item.url)) {
      // Some APOD "video" entries are direct video files rather than YouTube embeds
      modalMedia.innerHTML = `
        <video src="${item.url}" controls></video>
        <p><a href="${item.url}" target="_blank" rel="noopener noreferrer">Open video in new tab ↗</a></p>
      `;
    } else {
      modalMedia.innerHTML = `
        <iframe
          src="${item.url}"
          title="${item.title}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
        <p><a href="${item.url}" target="_blank" rel="noopener noreferrer">Watch full video ↗</a></p>
      `;
    }
  } else {
    modalMedia.innerHTML = `<img src="${item.hdurl || item.url}" alt="${item.title}" />`;
  }

  modalTitle.textContent = item.title;
  modalDate.textContent = item.date;
  modalExplanation.textContent = item.explanation;

  modal.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
  modalMedia.innerHTML = '';
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => {
  if (event.target === modal) closeModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
});

async function fetchApod(startDate, endDate) {
  const url = `${APOD_URL}?api_key=${NASA_API_KEY}&start_date=${startDate}&end_date=${endDate}`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('rate-limited');
    }
    throw new Error(`NASA API error (${response.status})`);
  }

  const data = await response.json();
  // The API returns a single object (not an array) when start_date === end_date
  const items = Array.isArray(data) ? data : [data];

  // Show most recent first, and only keep entries with a usable image or video
  return items
    .filter((item) => item.media_type === 'image' || item.media_type === 'video')
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

async function handleGetImages() {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate) {
    showError('Please select both a start and end date.');
    return;
  }

  showLoading();

  try {
    const items = await fetchApod(startDate, endDate);
    renderGallery(items);
  } catch (error) {
    console.error(error);
    if (error.message === 'rate-limited') {
      showError('NASA\'s DEMO_KEY rate limit was hit. Get your own free key at api.nasa.gov and update NASA_API_KEY in script.js, then try again.');
    } else {
      showError('Something went wrong fetching space photos. Please try again.');
    }
  }
}

getImagesBtn.addEventListener('click', handleGetImages);

// Load the default 9-day range automatically on page load
handleGetImages();
