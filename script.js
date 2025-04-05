// === SPA Navigation ===
const hamburgerBtn = document.getElementById("hamburgerBtn");
const navMenu = document.getElementById("navMenu");
const navLinks = document.querySelectorAll(".navbar-links a");
const sections = document.querySelectorAll("main > section");

hamburgerBtn?.addEventListener("click", () => {
  navMenu.classList.toggle("open");
});

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

// === Popup ===
let currentPopupId = null;

function openPopup(item) {
  currentPopupId = item.id;
  const savedChapter = localStorage.getItem(`chapter_${item.id}`) || item.chapter;
  const savedRating = localStorage.getItem(`rating_${item.id}`) || "";
  document.getElementById("ratingInput").value = savedRating;

  document.getElementById("popupCover").src = item.cover;
  document.getElementById("popupTitle").textContent = item.title;
  document.getElementById("popupChapter").textContent = `Current: Chapter ${savedChapter}`;
  document.getElementById("chapterInput").value = savedChapter;
  document.getElementById("popupDescription").textContent = item.description || "No description available.";
  document.getElementById("popupOverlay").classList.remove("hidden");
}

function closePopup() {
  document.getElementById("popupOverlay").classList.add("hidden");
}

function saveChapterProgress() {
  const newChapter = document.getElementById("chapterInput").value;
  const newRating = document.getElementById("ratingInput").value;

  if (currentPopupId && newChapter && Number(newChapter) > 0) {
    localStorage.setItem(`chapter_${currentPopupId}`, newChapter);

    if (newRating) {
      localStorage.setItem(`rating_${currentPopupId}`, newRating);
    }

    closePopup();
    renderAll();
  }
}

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
  renderAll();
}

function isBookmarked(id) {
  return getBookmarks().includes(id);
}

// === Read Progress ===
function toggleRead(id) {
  const isRead = localStorage.getItem(id) === "read";
  isRead ? localStorage.removeItem(id) : localStorage.setItem(id, "read");
  renderAll();
}

// === Status ===
function updateStatus(id, newStatus) {
  const statusMap = JSON.parse(localStorage.getItem("statuses") || "{}");
  statusMap[id] = newStatus;
  localStorage.setItem("statuses", JSON.stringify(statusMap));
  renderAll();
}

function getStatus(id) {
  const statusMap = JSON.parse(localStorage.getItem("statuses") || "{}");
  return statusMap[id] || null;
}

// === Render Cards ===
function renderList(data, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  data.forEach(item => {
    const selectedGenre = document.getElementById("genreFilter")?.value.toLowerCase() || "all";
    const keyword = document.getElementById("searchInput")?.value.toLowerCase() || "";

    if ((selectedGenre !== "all" && item.genre.toLowerCase() !== selectedGenre) ||
        (keyword && !item.title.toLowerCase().includes(keyword))) return;

    const isRead = localStorage.getItem(item.id) === "read";
    const bookmarked = isBookmarked(item.id);
    const savedChapter = localStorage.getItem(`chapter_${item.id}`) || item.chapter;
    const savedRating = localStorage.getItem(`rating_${item.id}`) || "Not rated";

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${item.cover}" alt="${item.title}" class="cover-image" />
      <h3>${item.title}</h3>
      <p>Chapter ${savedChapter}</p>
      <p>⭐ Rating: ${savedRating}</p>
      <button onclick="toggleRead('${item.id}')">${isRead ? "✅ Marked as Read" : "📖 Mark as Read"}</button>
      <button onclick="toggleBookmark('${item.id}')">${bookmarked ? "📌 Bookmarked" : "☆ Add to Library"}</button>
      <select onchange="updateStatus('${item.id}', this.value)">
        <option value="">📂 Set Status</option>
        <option value="reading">📖 Reading</option>
        <option value="completed">🏁 Completed</option>
        <option value="on_hold">⌛ On Hold</option>
        <option value="dropped">❌ Dropped</option>
        <option value="wishlist">💭 Wishlist</option>
      </select>
    `;
    card.querySelector("img").addEventListener("click", () => openPopup(item));
    container.appendChild(card);
  });
}

// === Dashboard Rendering ===
function renderDashboard(data) {
  const dashboardContainer = document.getElementById("dashboard-content");
  if (!dashboardContainer) return;

  dashboardContainer.innerHTML = "";
  const bookmarked = getBookmarks();
  const statusMap = JSON.parse(localStorage.getItem("statuses") || "{}");

  const recent = data.filter(item => bookmarked.includes(item.id) || statusMap[item.id]);

  recent.forEach(item => {
    const savedChapter = localStorage.getItem(`chapter_${item.id}`) || item.chapter;
    const savedRating = localStorage.getItem(`rating_${item.id}`) || "Not rated";

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${item.cover}" alt="${item.title}" class="cover-image" />
      <h3>${item.title}</h3>
      <p>Chapter ${savedChapter}</p>
      <p>⭐ Rating: ${savedRating}</p>
    `;
    dashboardContainer.appendChild(card);
  });
}

// === Firebase Fetch + Render ===
async function fetchManhwaFromFirebase() {
  const snapshot = await db.collection("manhwa").get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function renderAll() {
  const bookmarked = getBookmarks();
  const statusMap = JSON.parse(localStorage.getItem("statuses") || "{}");
  const manhwaList = await fetchManhwaFromFirebase();

  renderList(manhwaList, "currently-reading");
  renderList(manhwaList, "popular-list");
  renderList(manhwaList.filter(m => bookmarked.includes(m.id)), "my-library");
  renderList(manhwaList.filter(m => statusMap[m.id] === "completed"), "status-completed");
  renderList(manhwaList.filter(m => statusMap[m.id] === "on_hold"), "status-onhold");
  renderList(manhwaList.filter(m => statusMap[m.id] === "dropped"), "status-dropped");
  renderList(manhwaList.filter(m => statusMap[m.id] === "wishlist"), "status-wishlist");
}

// === Page Init ===
document.addEventListener("DOMContentLoaded", () => {
  const savedSection = localStorage.getItem("lastSection") || "home";
  showSection(savedSection);

  showLoggedInUser();
  renderAll();

  const profileBtn = document.getElementById("profileBtn");
  if (profileBtn) {
    profileBtn.addEventListener("click", openProfile);
  }

  const dashboardLink = document.querySelector('a[href="#dashboard"]');
  if (dashboardLink) {
    dashboardLink.addEventListener("click", async (e) => {
      e.preventDefault();
      showSection("dashboard");
      const manhwaList = await fetchManhwaFromFirebase();
      renderDashboard(manhwaList);
    });
  }
});
