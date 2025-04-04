// === Static Manhwa Data ===
const staticManhwa = [
  {
    id: "solo-leveling",
    title: "Solo Leveling",
    chapter: 1,
    genre: "Fantasy",
    cover: "https://i.imgur.com/8QKj7cV.jpg",
    description: "The world's weakest hunter gets a powerful second chance."
  },
  {
    id: "tower-of-god",
    title: "Tower of God",
    chapter: 1,
    genre: "Action",
    cover: "https://i.imgur.com/XStvXEF.jpg",
    description: "A boy enters a mysterious tower to find his friend."
  },
  {
    id: "lookism",
    title: "Lookism",
    chapter: 1,
    genre: "Drama",
    cover: "https://i.imgur.com/l9QvVd5.jpg",
    description: "A high schooler wakes up in the body of a model overnight."
  }
];

// === Bookmarks ===
function getBookmarks() {
  return JSON.parse(localStorage.getItem("bookmarks") || "[]");
}

function toggleBookmark(id) {
  let bookmarks = getBookmarks();
  bookmarks = bookmarks.includes(id)
    ? bookmarks.filter(b => b !== id)
    : [...bookmarks, id];

  localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  renderLibrary();
}

function isBookmarked(id) {
  return getBookmarks().includes(id);
}

// === Read Progress ===
function toggleRead(id) {
  const isRead = localStorage.getItem(id) === "read";
  isRead ? localStorage.removeItem(id) : localStorage.setItem(id, "read");
  renderLibrary();
}

// === Status ===
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

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${item.cover}" alt="${item.title}" onclick='openPopup(${JSON.stringify(item)})'>
      <h3>${item.title}</h3>
      <p>Chapter ${savedChapter}</p>
      <button onclick="toggleRead('${item.id}')">${isRead ? "✅ Marked as Read" : "📖 Mark as Read"}</button>
      <button onclick="toggleBookmark('${item.id}')">${bookmarked ? "⭐ Bookmarked" : "☆ Add to Library"}</button>
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
document.getElementById("genreFilter").addEventListener("change", () => {
  renderList(staticManhwa, "popular-list");
});

// === Search ===
document.getElementById("searchInput").addEventListener("input", (e) => {
  const keyword = e.target.value.toLowerCase();
  const filtered = staticManhwa.filter(m => m.title.toLowerCase().includes(keyword));
  renderList(filtered, "popular-list");
});

// === My Library ===
function renderLibrary() {
  const bookmarked = getBookmarks();
  const filtered = staticManhwa.filter(item => bookmarked.includes(item.id));
  renderList(filtered, "my-library");
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
  if (currentPopupId && newChapter && Number(newChapter) > 0) {
    localStorage.setItem(`chapter_${currentPopupId}`, newChapter);
    closePopup();
    renderList(staticManhwa, "popular-list");
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

// === Login Modal ===
const loginBtn = document.querySelector(".login-btn");
const loginModal = document.getElementById("loginModal");
const usernameInput = document.getElementById("usernameInput");

loginBtn?.addEventListener("click", () => {
  loginModal.classList.remove("hidden");
});

function closeLogin() {
  loginModal.classList.add("hidden");
}

function submitLogin() {
  const username = usernameInput.value.trim();
  if (username) {
    localStorage.setItem("username", username);
    alert(`Welcome, ${username}!`);
    closeLogin();
    showLoggedInUser();
  } else {
    alert("Please enter your name.");
  }
}

function showLoggedInUser() {
  const username = localStorage.getItem("username");
  const userDisplay = document.getElementById("userDisplay");
  if (username) {
    userDisplay.textContent = `👋 Hello, ${username}`;
    userDisplay.classList.remove("hidden");
  } else {
    userDisplay.classList.add("hidden");
  }
}

// === SPA Navigation ===
const hamburgerBtn = document.getElementById("hamburgerBtn");
const navMenu = document.getElementById("navMenu");

hamburgerBtn?.addEventListener("click", () => {
  navMenu.classList.toggle("open");
});

const navLinks = document.querySelectorAll(".navbar-links a");
const sections = document.querySelectorAll("main > section");

function showSection(sectionId) {
  sections.forEach(section => section.classList.remove("active-section"));
  const target = document.getElementById(sectionId);
  if (target) target.classList.add("active-section");

  navLinks.forEach(link => {
    link.classList.toggle("active-link", link.getAttribute("href") === `#${sectionId}`);
  });

  localStorage.setItem("lastSection", sectionId);
}

navLinks.forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const id = link.getAttribute("href").substring(1);
    showSection(id);
  });
});

// === Page Load ===
document.addEventListener("DOMContentLoaded", () => {
  const savedSection = localStorage.getItem("lastSection") || "home";
  showSection(savedSection);

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light");
    if (themeToggle) themeToggle.checked = true;
  }

  showLoggedInUser();
  renderList(staticManhwa, "popular-list");
  renderLibrary();
});
