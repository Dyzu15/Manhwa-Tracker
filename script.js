// === Local Static Manhwa Data ===
let fetchedManhwa = [
  {
    id: "solo-leveling",
    title: "Solo Leveling",
    chapter: 1,
    genre: "Action",
    cover: "https://uploads.mangadex.org/covers/faked-id/solo-leveling.jpg",
    description: "A weak hunter becomes the world's strongest."
  },
  {
    id: "omniscient-reader",
    title: "Omniscient Reader",
    chapter: 1,
    genre: "Fantasy",
    cover: "https://uploads.mangadex.org/covers/faked-id/omniscient-reader.jpg",
    description: "A reader of a webnovel finds himself inside the story."
  },
  {
    id: "tower-of-god",
    title: "Tower of God",
    chapter: 1,
    genre: "Drama",
    cover: "https://uploads.mangadex.org/covers/faked-id/tower-of-god.jpg",
    description: "Climb the mysterious tower to have your wishes granted."
  }
];

// === Render Cards Function ===
function renderList(data, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const selectedGenre = document.getElementById("genreFilter")?.value || "all";

  data.forEach(item => {
    if (selectedGenre !== "all" && item.genre !== selectedGenre) return;

    const isRead = localStorage.getItem(item.id) === "read";
    const bookmarked = getBookmarks().includes(item.id);
    const savedChapter = localStorage.getItem(`chapter_${item.id}`) || item.chapter;

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${item.cover}" alt="${item.title}" onclick='openPopup(${JSON.stringify(item)})'>
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

// === Support Functions (Same as Before) ===
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

function toggleRead(id) {
  const isRead = localStorage.getItem(id) === "read";
  if (isRead) {
    localStorage.removeItem(id);
  } else {
    localStorage.setItem(id, "read");
  }
  renderLibrary();
}

function updateStatus(id, newStatus) {
  const statusMap = JSON.parse(localStorage.getItem("statuses") || "{}");
  statusMap[id] = newStatus;
  localStorage.setItem("statuses", JSON.stringify(statusMap));
  renderLibrary();
}

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

// === Initialize ===
document.addEventListener('DOMContentLoaded', () => {
  renderList(fetchedManhwa, 'popular-list');
  renderLibrary();
});






