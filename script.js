let fetchedManhwa = [];

// === Fetch Real Manhwa from MangaDex API ===
async function fetchManhwaFromAPI() {
  const url = "https://api.mangadex.org/manga?limit=20&includedTags[]=e197df38-a02b-4c30-9c14-35c3d7535285&contentRating[]=safe&includes[]=cover_art";

  try {
    console.log("📡 Fetching from MangaDex...");
    const res = await fetch(url);
    const json = await res.json();

    const formatted = json.data.map(manga => {
      const title = manga.attributes.title?.en || Object.values(manga.attributes.title)[0] || "Untitled";
      const description = manga.attributes.description?.en || "No description.";
      const id = manga.id;
      const tags = manga.attributes.tags;
      const genreTag = tags.find(tag => tag.attributes.name?.en);
      const genre = genreTag ? genreTag.attributes.name.en : "Unknown";

      const coverRel = manga.relationships.find(rel => rel.type === "cover_art");
      const coverFile = coverRel?.attributes?.fileName || "placeholder.png";
      const coverUrl = `https://uploads.mangadex.org/covers/${id}/${coverFile}`;

      return {
        id,
        title,
        chapter: 1,
        genre,
        cover: coverUrl,
        description
      };
    });

    fetchedManhwa = formatted;
    console.log("✅ Rendered:", formatted.length, "manhwa");
    renderList(fetchedManhwa, 'popular-list');
  } catch (error) {
    console.error("❌ Failed to fetch manhwa:", error);
  }
}

// === Bookmarks ===
function getBookmarks() {
  return JSON.parse(localStorage.getItem("bookmarks") || "[]");
}

function toggleBookmark(id) {
  let bookmarks = getBookmarks();
  if (bookmarks.includes(id)) {
    bookmarks = bookmarks.filter(b => b !== id);
  } else {
    bookmarks.push(id);
  }
  localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  renderLibrary();
}

function isBookmarked(id) {
  return getBookmarks().includes(id);
}

// === Read Progress ===
function toggleRead(id) {
  const isRead = localStorage.getItem(id) === "read";
  if (isRead) {
    localStorage.removeItem(id);
  } else {
    localStorage.setItem(id, "read");
  }
  renderLibrary();
}

// === Update Status ===
function updateStatus(id, newStatus) {
  const statusMap = JSON.parse(localStorage.getItem("statuses") || "{}");
  statusMap[id] = newStatus;
  localStorage.setItem("statuses", JSON.stringify(statusMap));
  renderLibrary();
}

function getStatus(id) {
  const statusMap = JSON.parse(localStorage.getItem("statuses") || "{}");
  return statusMap[id] || null;
}

// === Render Cards ===
function renderList(data, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const selectedGenre = document.getElementById("genreFilter")?.value || "all";

  data.forEach(item => {
    if (selectedGenre !== "all" && item.genre !== selectedGenre) return;

    const isRead = localStorage.getItem(item.id) === "read";
    const bookmarked = isBookmarked(item.id);
    const savedChapter = localStorage.getItem(`chapter_${item.id}`) || item.chapter;

    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <img src="${item.cover}" alt="${item.title}" onerror="this.src='./fallback.jpg'">
      <h3>${item.title}</h3>
      <p>Chapter ${savedChapter}</p>
      <button onclick="toggleRead('${item.id}')">
        ${isRead ? "✅ Marked as Read" : "📖 Mark as Read"}
      </button>
      <button onclick="toggleBookmark('${item.id}')">
        ${bookmarked ? "⭐ Bookmarked" : "☆ Add to Library"}
      </button>
      <select onchange="updateStatus('${item.id}', this.value)">
        <option value="">📂 Set Status</option>
        <option value="reading">📖 Reading</option>
        <option value="completed">🏁 Completed</option>
        <option value="on_hold">⌛ On Hold</option>
        <option value="dropped">❌ Dropped</option>
        <option value="wishlist">💭 Wishlist</option>
      </select>
    `;

    container.appendChild(card);
  });
}

// === Genre Filter ===
document.getElementById('genreFilter').addEventListener('change', () => {
  renderList(fetchedManhwa, 'popular-list');
});

// === My Library ===
function renderLibrary() {
  const allCards = document.querySelectorAll('#popular-list .card');
  const bookmarked = getBookmarks();

  const bookmarkedCards = Array.from(allCards).filter(card =>
    bookmarked.includes(card.querySelector('button[onclick^="toggleRead"]').getAttribute('onclick').match(/'(.+)'/)[1])
  );

  const libraryContainer = document.getElementById('my-library');
  libraryContainer.innerHTML = '';
  bookmarkedCards.forEach(card => libraryContainer.appendChild(card.cloneNode(true)));
}

// === Popup ===
let currentPopupId = null;

function openPopup(item) {
  currentPopupId = item.id;

  const savedChapter = localStorage.getItem(`chapter_${item.id}`) || item.chapter;

  document.getElementById("popupCover").src = item.cover;
  document.getElementById("popupTitle").textContent = item.title;
  document.getElementById("popupChapter").textContent = `Current: Chapter ${savedChapter}`;
  document.getElementById("chapterInput").value = savedChapter;
  document.getElementById("popupDescription").textContent = item.description || "No description available yet.";

  document.getElementById("popupOverlay").classList.remove("hidden");
}

function closePopup() {
  document.getElementById("popupOverlay").classList.add("hidden");
}

function saveChapterProgress() {
  const newChapter = document.getElementById("chapterInput").value;
  if (currentPopupId && newChapter) {
    localStorage.setItem(`chapter_${currentPopupId}`, newChapter);
    closePopup();
    renderList(fetchedManhwa, 'popular-list');
    renderLibrary();
  }
}

// === Theme Toggle ===
const themeToggle = document.getElementById("themeToggle");

if (themeToggle) {
  themeToggle.addEventListener("change", () => {
    document.body.classList.toggle("light");
    localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
  });
}

// === Login Modal Logic ===
const loginBtn = document.querySelector('.login-btn');
const loginModal = document.getElementById('loginModal');
const usernameInput = document.getElementById('usernameInput');

loginBtn.addEventListener('click', () => {
  loginModal.classList.remove('hidden');
});

function closeLogin() {
  loginModal.classList.add('hidden');
}

function submitLogin() {
  const username = usernameInput.value.trim();
  if (username) {
    localStorage.setItem('username', username);
    alert(`Welcome, ${username}!`);
    closeLogin();
    showLoggedInUser();
  } else {
    alert("Please enter your name.");
  }
}

function showLoggedInUser() {
  const username = localStorage.getItem('username');
  const userDisplay = document.getElementById('userDisplay');

  if (username) {
    userDisplay.textContent = `👋 Hello, ${username}`;
    userDisplay.classList.remove('hidden');
  } else {
    userDisplay.classList.add('hidden');
  }
}

// === SPA-style Section Navigation ===
const hamburgerBtn = document.getElementById('hamburgerBtn');
const navMenu = document.getElementById('navMenu');

hamburgerBtn.addEventListener('click', () => {
  navMenu.classList.toggle('open');
});

const navLinks = document.querySelectorAll('.navbar-links a');
const sections = document.querySelectorAll('main > section');

function showSection(sectionId) {
  sections.forEach(section => {
    section.classList.remove('active-section');
  });

  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    void targetSection.offsetWidth;
    targetSection.classList.add('active-section');
  }

  navLinks.forEach(link => {
    link.classList.toggle('active-link', link.getAttribute('href') === `#${sectionId}`);
  });

  localStorage.setItem('lastSection', sectionId);
}

// === On Page Load ===
document.addEventListener('DOMContentLoaded', () => {
  const savedSection = localStorage.getItem('lastSection') || 'home';
  showSection(savedSection);

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light");
    if (themeToggle) {
      themeToggle.checked = true;
    }
  }

  showLoggedInUser();
  fetchManhwaFromAPI();
  renderLibrary();
});

// Attach section switching
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href').substring(1);
    showSection(targetId);
  });
});

// === Service Worker ===
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('service-worker.js').then(function (reg) {
      console.log('✅ Service worker registered.', reg);
    }).catch(function (err) {
      console.log('❌ Service worker registration failed:', err);
    });
  });
}







