
// === SPA Navigation ===
const hamburgerBtn = document.getElementById("hamburgerBtn");
const navMenu = document.getElementById("navMenu");
const navLinks = document.querySelectorAll(".navbar-links a");


hamburgerBtn?.addEventListener("click", () => {
  navMenu.classList.toggle("open");
});

function showSection(sectionId) {
  const sections = document.querySelectorAll("main > section:not(#feature-banner)");
  sections.forEach(section => {
  if (section.id !== "feature-banner") {
    section.classList.remove("active-section");
  }
});

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


// === Bookmarks Helper ===
async function getBookmarksFromFirestore() {
  const userId = currentUserId;
  if (!userId) return [];

  const snapshot = await db.collection("users").doc(userId).collection("library")
    .where("bookmarked", "==", true)
    .get();

  return snapshot.docs.map(doc => doc.id);
}


// === Popup ===
let currentPopupId = null;
let userData = {};


function openPopup(item) {
  currentPopupId = item.id;
  const savedChapter = 
  userData[item.id]?.chapter !== undefined
    ? userData[item.id].chapter
    : item.chapter;
  const savedRating = userData[item.id]?.rating || "";

  const ratingInput = document.getElementById("ratingInput");
  const chapterInput = document.getElementById("chapterInput");

  if (ratingInput) ratingInput.value = savedRating;
  if (chapterInput && !chapterInput.value) {
  chapterInput.value = savedChapter;
}


  document.getElementById("popupCover").src = item.cover;
  document.getElementById("popupTitle").textContent = item.title;
  document.getElementById("popupChapter").textContent = `Current: Chapter ${savedChapter}`;
  const genreLine = document.getElementById("popupGenres");
if (Array.isArray(item.genre)) {
  genreLine.textContent = `Genres: ${item.genre.join(", ")}`;
} else if (typeof item.genre === "string") {
  genreLine.textContent = `Genre: ${item.genre}`;
} else {
  genreLine.textContent = "Genre: Unknown";
}

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

async function saveChapterProgress() {
  const newChapter = document.getElementById("popupChapterInput").value;
  const newRating = document.getElementById("ratingInput").value;

  console.log("📥 Raw chapter input value:", newChapter);
  console.log("⭐ Raw rating input value:", newRating);

  const user = firebase.auth().currentUser;
  const userId = user?.uid || currentUserId;
  if (!user || !userId || !currentPopupId) {
    showAuthWarning();
    return;
  }

  const userDocRef = db.collection("users").doc(userId).collection("library").doc(currentPopupId);
  
  // ✅ Get previous rating BEFORE update
  const prevSnap = await userDocRef.get();
  const prevData = prevSnap.exists ? prevSnap.data() : {};
  const prevRating = typeof prevData.rating === "number" ? prevData.rating : null;


  const dataToUpdate = {};
  const intChapter = parseInt(newChapter);
  const intRating = parseInt(newRating);

  if (!isNaN(intChapter) && intChapter >= 0) {
  dataToUpdate.chapter = intChapter;
}

  if (!isNaN(intRating) && intRating >= 1 && intRating <= 10) {
  dataToUpdate.rating = intRating;
}

  console.log("📘 Chapter being saved:", dataToUpdate.chapter);

  try {
    await userDocRef.set(dataToUpdate, { merge: true });
    await userDocRef.set({ status: "reading" }, { merge: true });
  } catch (error) {
    console.error("❌ Failed to save chapter/rating:", error);
    return;
  }

  // ✅ Global rating update
const manhwaRef = db.collection("manhwa").doc(currentPopupId);
await db.runTransaction(async (transaction) => {
  const manhwaDoc = await transaction.get(manhwaRef);
  const data = manhwaDoc.exists ? manhwaDoc.data() : {};

  let ratingSum = data.ratingSum || 0;
  let ratingCount = data.ratingCount || 0;

  if (!isNaN(intRating)) {
    if (prevRating > 0) {
      ratingSum = ratingSum - prevRating + intRating;
    } else {
      ratingSum += intRating;
      ratingCount += 1;
    }
    console.log("🔥 Updated ratingSum:", ratingSum, "ratingCount:", ratingCount);

    transaction.set(manhwaRef, {
      ratingSum,
      ratingCount
    }, { merge: true });
  }
});

  closePopup();
  renderAll();
}



function showAuthWarning() {
  const el = document.getElementById("authWarning");
  el?.classList.remove("hidden");

  // Optional auto-close after 4 seconds
  setTimeout(() => {
    el?.classList.add("hidden");
  }, 5000);
}

function closeLogin() {
  document.getElementById("loginModal")?.classList.add("hidden");
}


function closeAuthWarning() {
  document.getElementById("authWarning")?.classList.add("hidden");
}


// === Bookmarks ===
async function toggleBookmark(id) {
  const user = firebase.auth().currentUser;
  if (!user) {
    showAuthWarning();
    return;
  }

  const userId = user.uid;
  const docRef = db.collection("users").doc(userId).collection("library").doc(id);

  try {
    const doc = await docRef.get();
    const isBookmarked = doc.exists && doc.data().bookmarked === true;
    await docRef.set({ bookmarked: !isBookmarked }, { merge: true });
    const manhwaRef = db.collection("manhwa").doc(id);
    await db.runTransaction(async (transaction) => {
     const manhwaDoc = await transaction.get(manhwaRef);
     const current = manhwaDoc.exists && manhwaDoc.data()?.bookmarkCount || 0;
     const newCount = isBookmarked ? current - 1 : current + 1;
  transaction.update(manhwaRef, { bookmarkCount: Math.max(newCount, 0) });
});

    renderAll();
  } catch (error) {
    console.error("Failed to toggle bookmark:", error);
  }
}




function isBookmarked(item) {
  return item.bookmarked === true;
}


function getUserManhwaDoc(id) {
  return db.doc(`users/${currentUserId}/library/${id}`);
}


// === Read Progress ===
async function toggleRead(id) {
  const userId = currentUserId;
  if (!userId) {
    showAuthWarning();
    return;
  }

  const docRef = db.collection("users").doc(userId).collection("library").doc(id);
  try {
    const doc = await docRef.get();
    const alreadyRead = doc.exists && doc.data().status === "read";
    const newStatus = alreadyRead ? null : "read";

    await docRef.set({ status: newStatus || "reading" }, { merge: true });
    await docRef.set({ lastRead: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });

    renderAll();
  } catch (error) {
    console.error("Failed to toggle read status:", error);
  }
}



// === Status ===
async function updateStatus(id, newStatus) {
  const user = firebase.auth().currentUser;
  if (!firebase.auth().currentUser) {
  showAuthWarning();
  return;
}

  const userId = user.uid;
  const docRef = db.collection("users").doc(userId).collection("library").doc(id);

  try {
    await docRef.set({ status: newStatus }, { merge: true });
    renderAll();
  } catch (error) {
    console.error("Failed to update status:", error);
  }
}

function getStatus(id) {
  return userData[id]?.status || null;
}
  

// === Render Cards ===
function renderList(data, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = ""; // Clear the container before rendering new items

  const genreValue = document.getElementById("genreFilter")?.value.toLowerCase() || "all";
  const statusValue = document.getElementById("statusFilter")?.value || "all";
  console.log("🟨 Selected Genre:", genreValue);
  console.log("🟨 Selected Status:", statusValue);
  console.log("🟨 Data sample:", data[0]);
  const sortValue = document.getElementById("sortBy")?.value || "default";
  const keyword = document.getElementById("searchInput")?.value.toLowerCase() || "";

  let filtered = data.filter(item => {
    const matchesGenre = genreValue === "all" || (Array.isArray(item.genre) ? item.genre.includes(genreValue) : item.genre?.toLowerCase?.() === genreValue);
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
      const rA = userData[a.id]?.rating || 0;
      const rB = userData[b.id]?.rating || 0;
      return rB - rA;
    });
  } else if (sortValue === "rating_low") {
    filtered.sort((a, b) => {
      const rA = userData[a.id]?.rating || 0;
      const rB = userData[b.id]?.rating || 0;
      return rA - rB;
    });
  }

  filtered.forEach(item => {
    const isRead = userData[item.id]?.status === "read";
    const bookmarked = isBookmarked(item.id);
    const savedChapter =
  userData[item.id]?.chapter !== undefined && userData[item.id]?.chapter !== null
    ? userData[item.id].chapter
    : item.chapter;
    const globalRatingCount = item.ratingCount || 0;
    const globalRatingSum = item.ratingSum || 0;

    const card = document.createElement("div");
    const savedStatus = getStatus(item.id) || "";
    const averageRating =
  item.ratingCount > 0
    ? Math.min(10, (item.ratingSum / item.ratingCount)).toFixed(1)
    : "N/A";



card.className = "card";
card.innerHTML = `
  <img src="${item.cover}" alt="${item.title}" class="cover-image" />
  <div class="card-content">
    <h3>${item.title}</h3>
    <div class="genre-tags">
  ${Array.isArray(item.genre)
    ? item.genre.map(g => `<span class="genre-badge">${g}</span>`).join(" ")
    : `<span class="genre-badge">${item.genre || "unknown"}</span>`}
   </div>
    <p>Chapter ${savedChapter}</p>
    <p>⭐ Average Rating: ${averageRating}</p>
    <p>🧍 Your Rating: ${userData[item.id]?.rating || "Not rated"}</p>
    <div class="actions">
  <button onclick="toggleRead('${item.id}')">${isRead ? "✅ Marked as Read" : "📖 Mark as Read"}</button>
  <button onclick="toggleBookmark('${item.id}')">${bookmarked ? "📌 Bookmarked" : "☆ Add to Library"}</button>
  <select onchange="updateStatus('${item.id}', this.value)" data-id="${item.id}" class="status-select">
    <option value="" ${savedStatus === "" ? "selected" : ""}>📂 Set Status</option>
    <option value="reading" ${savedStatus === "reading" ? "selected" : ""}>📖 Reading</option>
    <option value="completed" ${savedStatus === "completed" ? "selected" : ""}>🏁 Completed</option>
    <option value="on_hold" ${savedStatus === "on_hold" ? "selected" : ""}>⏸️ On Hold</option>
    <option value="dropped" ${savedStatus === "dropped" ? "selected" : ""}>❌ Dropped</option>
    <option value="wishlist" ${savedStatus === "wishlist" ? "selected" : ""}>💭 Wishlist</option>
  </select>
  ${localStorage.getItem("userEmail") === adminEmail ? `
  <button onclick="editGenre('${item.id}', \`${Array.isArray(item.genre) ? item.genre.join(", ") : item.genre || ""}\`)">✏️ Edit Genre</button>
  <button onclick="deleteManhwa('${item.id}')">🗑️ Delete</button>
` : ""}

</div>
  </div>
`;


    card.addEventListener("click", (e) => {
      const isInteractive = e.target.closest("button") || e.target.closest("select") || e.target.tagName === "OPTION";
      if (!isInteractive) {
        openPopup(item);
      }
    });

    container.appendChild(card);

setTimeout(() => {
  document.querySelectorAll(".status-select").forEach(select => {
  select.addEventListener("change", function () {
    const id = this.getAttribute("data-id");
    const value = this.value;
    updateStatus(id, value);
  });
});
}, 0);

  });
}

// === Admin Edit/Delete Functions ===
function editGenre(id, currentGenreStr) {
  const newGenre = prompt("Enter new genre(s), comma-separated:", currentGenreStr);
  if (newGenre !== null) {
    const genreArray = newGenre.split(",").map(g => g.trim().toLowerCase()).filter(Boolean);
    db.collection("manhwa").doc(id).update({ genre: genreArray })
      .then(() => {
        alert("✅ Genre updated!");
        renderAll();
      })
      .catch(err => {
        console.error("❌ Failed to update genre:", err);
        alert("Failed to update genre.");
      });
  }
}


function deleteManhwa(id) {
  if (confirm("Are you sure you want to delete this manhwa?")) {
    db.collection("manhwa").doc(id).delete()
      .then(() => {
        alert("🗑️ Manhwa deleted.");
        renderAll();
      })
      .catch(err => {
        console.error("❌ Failed to delete manhwa:", err);
        alert("Failed to delete manhwa.");
      });
  }
}


// === Dashboard Rendering ===
async function renderDashboard(data) {
  const recentId = localStorage.getItem("lastRead");  // ⬅ still optional for visual continuity
  const recentItem = data.find(item => item.id === recentId);
  const recentList = document.querySelector("#recently-read ul");
  const recentStats = document.getElementById("recentStats");
  recentList.innerHTML = "";

  if (recentItem) {
    const li = document.createElement("li");
    li.textContent = recentItem.title;
    recentList.appendChild(li);
  }
  recentStats.textContent = `Total Recently Read: ${recentList.children.length}`;

  const rated = data
    .map(item => {
      const rating = userData[item.id]?.rating;
      return rating ? { ...item, rating } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  const topRatedList = document.querySelector("#top-rated ul");
  const topRatedStats = document.getElementById("topRatedStats");
  topRatedList.innerHTML = "";
  rated.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.title} (${item.rating}/10)`;
    topRatedList.appendChild(li);
  });
  topRatedStats.textContent = `Top Rated: ${rated.length}`;

  const bookmarks = await getBookmarksFromFirestore();
  const bookmarkedItems = data.filter(item => bookmarks.includes(item.id)).slice(0, 5);
  const bookmarkedList = document.querySelector("#most-bookmarked ul");
  const bookmarkedStats = document.getElementById("bookmarkedStats");
  bookmarkedList.innerHTML = "";
  bookmarkedItems.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item.title;
    bookmarkedList.appendChild(li);
  });
  bookmarkedStats.textContent = `Most Bookmarked: ${bookmarkedItems.length}`;
}



// === Firebase Fetch + Render ===
async function fetchManhwaFromFirebase() {
  const snapshot = await db.collection("manhwa").get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

 async function renderAll() {
 const bookmarked = await getBookmarksFromFirestore(); // ✅ resolves the actual array
  const manhwaList = await fetchManhwaFromFirebase();
  let userLibrary = {};
  userData = {}; 

if (window.currentUserId) {
  const snapshot = await db
    .collection("users")
    .doc(window.currentUserId)
    .collection("library")
    .get();

  snapshot.forEach(doc => {
    userLibrary[doc.id] = doc.data();
  });
}

 userData = userLibrary;


  const genreValue = document.getElementById("genreFilter")?.value.toLowerCase() || "all";
  const statusValue = document.getElementById("statusFilter")?.value || "all";
  const sortValue = document.getElementById("sortBy")?.value || "default";
  const keyword = document.getElementById("searchInput")?.value.toLowerCase() || "";

  // === FILTER + SEARCH
  let filtered = manhwaList.filter(item => {
    const matchesGenre = genreValue === "all" || 
  (Array.isArray(item.genre) 
    ? item.genre.includes(genreValue)
    : (item.genre?.toLowerCase?.() || "") === genreValue);
    const matchesSearch = !keyword || item.title.toLowerCase().includes(keyword);
    const status = getStatus(item.id);
    const matchesStatus = statusValue === "all" || status === statusValue;
    return matchesGenre && matchesSearch && matchesStatus;
  });

  // === SORT
  if (sortValue === "title_asc") {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortValue === "title_desc") {
    filtered.sort((a, b) => b.title.localeCompare(a.title));
  } else if (sortValue === "rating_high") {
    filtered.sort((a, b) => {
      const rA = userData[a.id]?.rating || 0;
      const rB = userData[b.id]?.rating || 0;
      return rB - rA;
    });
  } else if (sortValue === "rating_low") {
    filtered.sort((a, b) => {
      const rA = userData[a.id]?.rating || 0;
      const rB = userData[b.id]?.rating || 0;
      return rA - rB;
    });
  }

  // ✅ Home — show ALL manhwa with no filters
renderList(manhwaList, "currently-reading");

// ✅ My Library — only items that have any status set
const statusItems = manhwaList.filter(item => getStatus(item.id) !== null);
renderList(statusItems, "my-library-list");


// ✅ Popular – based on average rating
const topRated = manhwaList
  .filter(item => item.ratingCount > 0)
  .sort((a, b) => {
    const aAvg = a.ratingSum / a.ratingCount;
    const bAvg = b.ratingSum / b.ratingCount;
    return bAvg - aAvg;
  })
  .slice(0, 10);

console.log("🔥 Top Rated List:", topRated);

renderList(topRated, "popular-list");


// ✅ New Releases — sort by Firestore timestamp descending
const sortedByDate = [...manhwaList].sort((a, b) => {
  const aDate = a.createdAt?.seconds || 0;
  const bDate = b.createdAt?.seconds || 0;
  return bDate - aDate;
}).reverse().slice(0, 10);
renderList(sortedByDate, "new-releases");

// ✅ Dashboard — always use full list
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
async function openProfile() {
  let username = "Guest";
try {
  const user = firebase.auth().currentUser;
  if (user) {
    const doc = await db.collection("users").doc(user.uid).get();
    const data = doc.exists ? doc.data() : {};
    username = data.username || "Guest";
  }
} catch (err) {
  console.error("❌ Failed to load username:", err);
}

  let completed = 0, dropped = 0;

try {
  const userId = currentUserId;
  if (userId) {
    const snapshot = await db.collection("users").doc(userId).collection("library").get();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === "completed") completed++;
      if (data.status === "dropped") dropped++;
    });
  }
} catch (err) {
  console.error("❌ Failed to fetch statuses from Firestore:", err);
}

  

  // 🔁 Fetch total bookmarks from Firestore
  let bookmarkCount = 0;
  try {
    const userId = currentUserId;
    if (userId) {
      const snapshot = await db.collection("users").doc(userId).collection("library")
        .where("bookmarked", "==", true)
        .get();
      bookmarkCount = snapshot.size;
    }
  } catch (err) {
    console.error("❌ Failed to fetch bookmarks:", err);
  }

  document.getElementById("profileName").textContent = username;
  document.getElementById("totalLibrary").textContent = bookmarkCount;
  document.getElementById("totalCompleted").textContent = completed;
  document.getElementById("totalDropped").textContent = dropped;

  document.getElementById("profileModal").classList.remove("hidden");
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

function closeProfile() {
  document.getElementById("profileModal")?.classList.add("hidden");
}


function selectAvatar(imgElement) {
  document.querySelectorAll(".avatar-option").forEach(img => img.classList.remove("selected"));
  imgElement.classList.add("selected");
}

async function saveProfileChanges() {
  const newName = document.getElementById("displayNameInput").value.trim();
  const selectedAvatar = document.querySelector(".avatar-option.selected");

const user = firebase.auth().currentUser;
if (!user) return;

const updates = {};
if (newName) updates.username = newName;
if (selectedAvatar) {
  const avatarSrc = selectedAvatar.getAttribute("src");
  updates.avatar = avatarSrc;
}

try {
  console.log("Trying to write as:", firebase.auth().currentUser?.uid);
  await db.collection("users").doc(user.uid).set(updates, { merge: true });
  closeEditProfile();
  updateProfileDisplay(); // will also change
} catch (error) {
  console.error("❌ Failed to save profile:", error);
}



  closeEditProfile();
  updateProfileDisplay();
}

async function updateProfileDisplay() {
  const user = firebase.auth().currentUser;
  const avatarFallback = "./icons/icon-192.png";

  if (!user) {
    document.getElementById("profileName").textContent = "Guest";
    document.getElementById("userDisplay").textContent = "👋 Hello, Guest";
    document.getElementById("profilePic").src = avatarFallback;
    document.getElementById("navAvatar").src = avatarFallback;
    return;
  }

  try {
    const doc = await db.collection("users").doc(user.uid).get();
    const data = doc.exists ? doc.data() : {};
    const username = data.username || "Guest";
    const avatar = data.avatar || avatarFallback;

    document.getElementById("profileName").textContent = username;
    document.getElementById("userDisplay").textContent = `👋 Hello, ${username}`;
    document.getElementById("profilePic").src = avatar;
    document.getElementById("navAvatar").src = avatar;
  } catch (err) {
    console.error("❌ Failed to load profile info:", err);
  }
}

let currentUserId = null;

firebase.auth().onAuthStateChanged(user => {
  if (user) {
    currentUserId = user.uid;
    console.log("✅ Logged in as:", currentUserId);
    showLoggedInUser?.();
    renderAll();
  } else {
    console.warn("⚠️ No user logged in");
    currentUserId = null;
  }
});


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
  populateGenreDropdown();

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

  // 🛡️ Prevent filter select from triggering anchor navigation
document.querySelectorAll('.filter-bar select').forEach(select => {
  select.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent bubble to nav or hash links
  });
});

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
// === Click and Drag Horizontal Scroll for Card Lists ===
document.querySelectorAll('.card-list').forEach(container => {
  let isDown = false;
  let startX;
  let scrollLeft;

  container.addEventListener('mousedown', (e) => {
    isDown = true;
    container.classList.add('dragging');
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
  });

  container.addEventListener('mouseleave', () => {
    isDown = false;
    container.classList.remove('dragging');
  });

  container.addEventListener('mouseup', () => {
    isDown = false;
    container.classList.remove('dragging');
  });

  container.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 2; // speed
    container.scrollLeft = scrollLeft - walk;
  });
// === Admin Import from API ===
const searchBtn = document.getElementById("searchManhwaBtn");
const searchInput = document.getElementById("searchManhwaInput");
const searchResults = document.getElementById("searchResults");

if (searchBtn && searchInput && searchResults) {
  let lastSearchTime = 0; // Track the last time a search was made
  searchBtn.addEventListener("click", async () => {
    const now = Date.now();
if (now - lastSearchTime < 10000) {
  searchResults.innerHTML = `<p>🕒 Please wait a few seconds before searching again.</p>`;
  return;
}
lastSearchTime = now;

// Disable the button temporarily
searchBtn.disabled = true;
setTimeout(() => {
  searchBtn.disabled = false;
}, 5000);

const query = searchInput.value.trim();
if (!query) return;

    

    searchResults.innerHTML = "<p>🔍 Searching...</p>";

    try {
      const res = await fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=10`);
      
      // Handle rate limiting (429)
      if (res.status === 429) {
        searchResults.innerHTML = `
          <p>🚫 Too many requests to the Jikan API (429).</p>
          <p>Try again in a few seconds.</p>
        `;
        return;
      }

      const data = await res.json();

      // Check for valid response
      if (!data.data || !Array.isArray(data.data)) {
        searchResults.innerHTML = "<p>❌ No results found or malformed response.</p>";
        return;
      }

      searchResults.innerHTML = "";

      data.data.forEach(manga => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <img src="${manga.images?.jpg?.image_url || './fallback.jpg'}" alt="${manga.title}" class="cover-image" />
          <div class="card-content">
            <h3>${manga.title}</h3>
            <p>${(manga.synopsis && typeof manga.synopsis === 'string') ? manga.synopsis.slice(0, 150) : "No description."}</p>
            <button>Add to DB</button>
          </div>
        `;

        card.querySelector("button").addEventListener("click", async () => {
          try {
            await db.collection("manhwa").add({
              title: manga.title,
              genre: manga.genres?.map(g => g.name.toLowerCase()) || ["unknown"],
              cover: manga.images?.jpg?.image_url || '',
              description: manga.synopsis || "",
              chapter: 0,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            card.querySelector("button").textContent = "✅ Added!";
          } catch (e) {
            console.error("❌ Failed to add:", e);
            card.querySelector("button").textContent = "❌ Error";
          }
        });

        searchResults.appendChild(card);
      });

    } catch (err) {
      console.error("❌ Fetch error:", err);
      searchResults.innerHTML = "<p>❌ Error fetching results. Please check your connection or try again later.</p>";
    }
  });
}

});

// === PWA Service Worker Registration ===
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('✅ Service Worker registered:', reg.scope))
      .catch(err => console.error('❌ Service Worker registration failed:', err));
  });
}

// Featured Slider Logic
const slides = document.querySelectorAll('.featured-slide');
const dots = document.querySelectorAll('.featured-dots .dot');
let currentSlide = 0;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
    dots[i].classList.toggle('active', i === index);
  });
  currentSlide = index;
}

// Automatically rotate every 5 seconds
setInterval(() => {
  const next = (currentSlide + 1) % slides.length;
  showSlide(next);
}, 5000);

// Dot click event
dots.forEach((dot, i) => {
  dot.addEventListener('click', () => showSlide(i));
});

// === Dynamically Populate Genre Dropdown ===
async function populateGenreDropdown() {
  const genreSelect = document.getElementById("genreFilter");
  if (!genreSelect) return;

  const snapshot = await db.collection("manhwa").get();
  const genreSet = new Set();

  snapshot.forEach(doc => {
    const data = doc.data();
    if (Array.isArray(data.genre)) {
      data.genre.forEach(g => genreSet.add(g.trim().toLowerCase()));
    } else if (typeof data.genre === "string") {
      genreSet.add(data.genre.trim().toLowerCase());
    }
  });

  // Clear existing options
  genreSelect.innerHTML = "";

  // Add default "All Genres"
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All Genres";
  genreSelect.appendChild(allOption);

  // Add sorted genres
  Array.from(genreSet)
    .sort()
    .forEach(genre => {
      const option = document.createElement("option");
      option.value = genre;
      option.textContent = genre.charAt(0).toUpperCase() + genre.slice(1);
      genreSelect.appendChild(option);
    });
}

// === Welcome Banner ===
document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("welcomeDismissed")) {
    document.getElementById("welcomeBanner").classList.remove("hidden");
  }

  const dismissBtn = document.getElementById("dismissBannerBtn");
  if (dismissBtn) {
    dismissBtn.addEventListener("click", () => {
      document.getElementById("welcomeBanner").classList.add("hidden");
      localStorage.setItem("welcomeDismissed", "true");
    });
  }
});
