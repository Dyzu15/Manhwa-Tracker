
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

  // 🔁 Set dynamic background based on section
  document.body.className = document.body.className
    .split(' ')
    .filter(cls => !cls.startsWith('section-'))
    .join(' ')
    .trim();
  document.body.classList.add(`section-${sectionId}`);

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

  const ratingInput = document.getElementById("ratingInput");
  const chapterInput = document.getElementById("chapterInput");

  if (ratingInput) ratingInput.value = savedRating;
  if (chapterInput) chapterInput.value = savedChapter;

  document.getElementById("popupCover").src = item.cover;
  document.getElementById("popupTitle").textContent = item.title;
  document.getElementById("popupChapter").textContent = `Current: Chapter ${savedChapter}`;
  document.getElementById("popupDescription").textContent = item.description || "No description available.";
  document.getElementById("popupOverlay").classList.remove("hidden");
  loadComments(item.id); // load comments based on the clicked manhwa
}

function loadComments(seriesId) {
  const commentsList = document.getElementById("commentsList");
  commentsList.innerHTML = "Loading comments...";

  db.collection("comments")
    .where("seriesId", "==", seriesId)
    .orderBy("timestamp", "desc")
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        commentsList.innerHTML = "<p>No comments yet.</p>";
        return;
      }

      commentsList.innerHTML = "";
      snapshot.forEach(doc => {
        const data = doc.data();
        const div = document.createElement("div");
        div.className = "comment";
        div.innerHTML = `
          <strong>${data.user}</strong><br />
          ${data.message}
        `;
        commentsList.appendChild(div);
      });
    })
    .catch(err => {
      commentsList.innerHTML = "❌ Error loading comments.";
      console.error("Error loading comments:", err);
    });
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

    localStorage.setItem("lastRead", currentPopupId);
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
  localStorage.setItem("lastRead", id);
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

  const genreValue = document.getElementById("genreFilter")?.value.toLowerCase() || "all";
  const statusValue = document.getElementById("statusFilter")?.value || "all";
  const sortValue = document.getElementById("sortBy")?.value || "default";
  const keyword = document.getElementById("searchInput")?.value.toLowerCase() || "";

  let filtered = data.filter(item => {
    const matchesGenre = genreValue === "all" || item.genre.toLowerCase() === genreValue;
    const matchesSearch = !keyword || item.title.toLowerCase().includes(keyword);
    const savedStatus = getStatus(item.id);
    const matchesStatus = statusValue === "all" || savedStatus === statusValue;
    return matchesGenre && matchesSearch && matchesStatus;
  });

  // Sort logic
  if (sortValue === "title_asc") {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortValue === "title_desc") {
    filtered.sort((a, b) => b.title.localeCompare(a.title));
  } else if (sortValue === "rating_high") {
    filtered.sort((a, b) => {
      const rA = parseInt(localStorage.getItem(`rating_${a.id}`)) || 0;
      const rB = parseInt(localStorage.getItem(`rating_${b.id}`)) || 0;
      return rB - rA;
    });
  } else if (sortValue === "rating_low") {
    filtered.sort((a, b) => {
      const rA = parseInt(localStorage.getItem(`rating_${a.id}`)) || 0;
      const rB = parseInt(localStorage.getItem(`rating_${b.id}`)) || 0;
      return rA - rB;
    });
  }

  filtered.forEach(item => {
    const isRead = localStorage.getItem(item.id) === "read";
    const bookmarked = isBookmarked(item.id);
    const savedChapter = localStorage.getItem(`chapter_${item.id}`) || item.chapter;
    const savedRating = localStorage.getItem(`rating_${item.id}`) || "Not rated";

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${item.cover}" alt="${item.title}" class="cover-image" style="cursor: pointer;" />
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

    card.addEventListener("click", (e) => {
      const isInteractive = e.target.closest("button") || e.target.closest("select") || e.target.tagName === "OPTION";
      if (!isInteractive) {
        openPopup(item);
      }
    });

    container.appendChild(card);
  });
}


// === Dashboard Rendering ===
function renderDashboard(data) {
  const recentId = localStorage.getItem("lastRead");
  const recentItem = data.find(item => item.id === recentId);
  const recentList = document.querySelector("#recently-read ul");
  recentList.innerHTML = "";
  if (recentItem) {
    const li = document.createElement("li");
    li.textContent = recentItem.title;
    recentList.appendChild(li);
  }

  const rated = data
    .map(item => {
      const rating = parseInt(localStorage.getItem(`rating_${item.id}`));
      return rating ? { ...item, rating } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  const topRatedList = document.querySelector("#top-rated ul");
  topRatedList.innerHTML = "";
  rated.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.title} (${item.rating}/10)`;
    topRatedList.appendChild(li);
  });

  const bookmarks = getBookmarks();
  const bookmarkedItems = data.filter(item => bookmarks.includes(item.id)).slice(0, 5);
  const bookmarkedList = document.querySelector("#most-bookmarked ul");
  bookmarkedList.innerHTML = "";
  bookmarkedItems.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item.title;
    bookmarkedList.appendChild(li);
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

  renderDashboard(manhwaList);
}
// === Admin Email Config ===
const adminEmail = "tacpack10@gmail.com";

// === User Display ===
function showLoggedInUser() {
  updateProfileDisplay();

  const username = localStorage.getItem("username");
  const email = localStorage.getItem("userEmail"); // get from localStorage after login
  const userDisplay = document.getElementById("userDisplay");
  const adminPanel = document.getElementById("admin-panel");

  if (userDisplay) {
    if (username) {
      userDisplay.textContent = `👋 Hello, ${username}`;
      userDisplay.classList.remove("hidden");

      // 👑 Show admin panel if email matches
      if (email === adminEmail && adminPanel) {
        adminPanel.classList.remove("hidden");
      }
    } else {
      userDisplay.classList.add("hidden");
    }
  }
}


// === Profile Modal Functions ===
function openProfile() {
  const username = localStorage.getItem("username") || "Guest";
  const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
  const statuses = JSON.parse(localStorage.getItem("statuses") || "{}");

  let completed = 0, dropped = 0;
  for (let key in statuses) {
    if (statuses[key] === "completed") completed++;
    if (statuses[key] === "dropped") dropped++;
  }

  document.getElementById("profileName").textContent = username;
  document.getElementById("totalLibrary").textContent = bookmarks.length;
  document.getElementById("totalCompleted").textContent = completed;
  document.getElementById("totalDropped").textContent = dropped;

  document.getElementById("profileModal").classList.remove("hidden");
}

function closeProfile() {
  document.getElementById("profileModal").classList.add("hidden");
}

// === Edit Profile Modal Functions ===
function openEditProfile() {
  const currentName = localStorage.getItem("username") || "Guest";
  const currentAvatar = localStorage.getItem("avatar");

  document.getElementById("displayNameInput").value = currentName;
  document.querySelectorAll(".avatar-option").forEach(img => {
    img.classList.remove("selected");
    if (currentAvatar && img.src.includes(currentAvatar)) {
      img.classList.add("selected");
    }
  });

  document.getElementById("editProfileModal").classList.remove("hidden");
}

function closeEditProfile() {
  document.getElementById("editProfileModal").classList.add("hidden");
}

function selectAvatar(imgElement) {
  document.querySelectorAll(".avatar-option").forEach(img => img.classList.remove("selected"));
  imgElement.classList.add("selected");
}

function saveProfileChanges() {
  const newName = document.getElementById("displayNameInput").value.trim();
  const selectedAvatar = document.querySelector(".avatar-option.selected");

  if (newName) localStorage.setItem("username", newName);
  if (selectedAvatar) {
    const avatarSrc = selectedAvatar.getAttribute("src");
    localStorage.setItem("avatar", avatarSrc);
  }

  closeEditProfile();
  updateProfileDisplay();
}

function updateProfileDisplay() {
  const username = localStorage.getItem("username") || "Guest";
  const avatar = localStorage.getItem("avatar") || "./icons/icon-192.png";
  document.getElementById("profileName").textContent = username;
  document.getElementById("userDisplay").textContent = `👋 Hello, ${username}`;
  document.getElementById("profilePic").src = avatar;
  document.getElementById("navAvatar").src = avatar;

  // Fallback for iOS web rendering issues
  document.getElementById("profilePic").onerror = () => {
    document.getElementById("profilePic").src = "./icons/icon-192.png";
  };
  document.getElementById("navAvatar").onerror = () => {
    document.getElementById("navAvatar").src = "./icons/icon-192.png";
  };
}

// === Page Init ===
document.addEventListener("DOMContentLoaded", () => {
  const savedSection = localStorage.getItem("lastSection") || "home";
  showSection(savedSection);

  const savedTheme = localStorage.getItem("theme");
  const themeToggle = document.getElementById("themeToggle");
  if (savedTheme === "light") {
    document.body.classList.add("light");
    if (themeToggle) themeToggle.checked = true;
  }

  const profileModal = document.getElementById("profileModal");
  if (profileModal && !profileModal.classList.contains("hidden")) {
    profileModal.classList.add("hidden");
  }

  showLoggedInUser();
  renderAll();

 const addManhwaForm = document.getElementById("addManhwaForm");

if (addManhwaForm) {
  addManhwaForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("titleInput").value.trim();
    const genre = document.getElementById("genreInput").value.trim().toLowerCase();
    const cover = document.getElementById("coverInput").value.trim();
    const description = document.getElementById("descriptionInput").value.trim();
    const chapter = document.getElementById("chapterInput").value.trim();
    const statusMsg = document.getElementById("adminStatusMsg");

    if (!title || !genre || !cover || !chapter) {
      statusMsg.textContent = "❌ Please fill in all required fields.";
      return;
    }

    try {
      await db.collection("manhwa").add({
        title,
        genre,
        cover,
        description,
        chapter: parseInt(chapter),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      statusMsg.textContent = "✅ Manhwa added successfully!";
      addManhwaForm.reset();
      renderAll(); // refresh UI
    } catch (error) {
      console.error("Error adding manhwa:", error);
      statusMsg.textContent = "❌ Failed to add manhwa.";
    }
  });
}
  
document.getElementById("searchInput").addEventListener("input", () => {
  renderAll();
});
document.getElementById("genreFilter").addEventListener("change", () => {
  renderAll();
});
document.getElementById("statusFilter").addEventListener("change", () => {
  renderAll();
});
document.getElementById("sortBy").addEventListener("change", () => {
  renderAll();
});


  const profileBtn = document.getElementById("profileBtn");
  if (profileBtn) {
    profileBtn.addEventListener("click", openProfile);
  }

  document.getElementById("profileModal").addEventListener("click", function (e) {
    if (e.target === this) closeProfile();
  });

  document.getElementById("popupOverlay").addEventListener("click", function (e) {
    if (e.target === this) closePopup();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closePopup();
      closeProfile();
      closeEditProfile();
    }
  });

  document.querySelectorAll(".close-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.closest("#profileModal")) closeProfile();
      if (btn.closest("#popupOverlay")) closePopup();
      if (btn.closest("#editProfileModal")) closeEditProfile();
    });
  });

  setTimeout(() => {
    document.querySelectorAll('.card img').forEach(img => {
      img.addEventListener('load', () => img.classList.add('loaded'));
      if (img.complete) img.classList.add('loaded');
    });
  }, 100);
    // === Post Comment Handler ===
  document.getElementById("postCommentBtn").addEventListener("click", async () => {
    const message = document.getElementById("commentInput").value.trim();
    if (!message || !currentPopupId) return;

    const username = localStorage.getItem("username") || "Guest";

    try {
      await db.collection("comments").add({
        seriesId: currentPopupId,
        user: username,
        message: message,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      document.getElementById("commentInput").value = "";
      loadComments(currentPopupId);
    } catch (error) {
      console.error("❌ Failed to post comment:", error);
    }
  });
});

// === PWA Service Worker Registration ===
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('✅ Service Worker registered:', reg.scope))
      .catch(err => console.error('❌ Service Worker registration failed:', err));
  });
}
