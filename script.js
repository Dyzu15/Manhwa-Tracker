const manhwaData = {
  currentlyReading: [
    {
      id: "solo_leveling",
      title: "Solo Leveling",
      chapter: "125",
      genre: "Action",
      cover: "https://i.imgur.com/KyXbRXK.jpg",
      description: "A weak E-rank hunter discovers a mysterious system that allows him to grow stronger."
    },
    {
      id: "omniscient_reader",
      title: "Omniscient Reader",
      chapter: "102",
      genre: "Fantasy",
      cover: "https://i.imgur.com/0JcCqvx.jpg",
      description: "A reader is thrust into his favorite webnovel world — and he's the only one who knows how it ends."
    },
    {
      id: "second_life_ranker",
      title: "Second Life Ranker",
      chapter: "145",
      genre: "Action",
      cover: "https://i.imgur.com/D5WlfBr.jpg",
      description: "A man enters a mysterious tower to avenge his brother and claim his destiny."
    }
  ],
  popular: [
    {
      id: "tower_of_god",
      title: "Tower of God",
      chapter: "514",
      genre: "Fantasy",
      cover: "https://i.imgur.com/s7qI1RW.jpg",
      description: "A boy climbs a dangerous tower to reunite with his best friend."
    },
    {
      id: "the_boxer",
      title: "The Boxer",
      chapter: "76",
      genre: "Drama",
      cover: "https://i.imgur.com/WxRLdkk.jpg",
      description: "A cold, empty prodigy boxer fights with nothing to lose and everything to prove."
    },
    {
      id: "lookism",
      title: "Lookism",
      chapter: "440",
      genre: "Drama",
      cover: "https://i.imgur.com/3gFLs0e.jpg",
      description: "A bullied student wakes up in a new, handsome body — and begins living a double life."
    },
    {
      id: "weak_hero",
      title: "Weak Hero",
      chapter: "250",
      genre: "Action",
      cover: "https://i.imgur.com/VuZQYdn.jpg",
      description: "A seemingly weak boy with a sharp brain becomes the school’s most feared fighter."
    },
    {
      id: "unordinary",
      title: "Unordinary",
      chapter: "310",
      genre: "Supernatural",
      cover: "https://i.imgur.com/Gcnemht.jpg",
      description: "In a world where everyone has powers, one powerless boy hides a dark secret."
    }
  ],
  newReleases: [
    {
      id: "viral_hit",
      title: "Viral Hit",
      chapter: "80",
      genre: "Action",
      cover: "https://i.imgur.com/kZplb1D.jpg",
      description: "A shy student learns street fighting from a YouTube channel — and becomes a viral sensation."
    },
    {
      id: "eleceed",
      title: "Eleceed",
      chapter: "242",
      genre: "Comedy",
      cover: "https://i.imgur.com/dqGn0Wz.jpg",
      description: "A lightning-fast boy and a sassy cat fight evil in this heartwarming supernatural tale."
    },
    {
      id: "manager_kim",
      title: "Manager Kim",
      chapter: "91",
      genre: "Action",
      cover: "https://i.imgur.com/GSmP4h1.jpg",
      description: "A peaceful manager turns into a ruthless operative to save his kidnapped daughter."
    },
    {
      id: "my_s_class",
      title: "My S-Class Hunters",
      chapter: "79",
      genre: "Fantasy",
      cover: "https://i.imgur.com/gjTRbEz.jpg",
      description: "A man returns to the past with the power to raise weak hunters into S-class legends."
    },
    {
      id: "jujutsu_kaisen",
      title: "Jujutsu Kaisen",
      chapter: "252",
      genre: "Supernatural",
      cover: "https://i.imgur.com/dKyoNDv.jpg",
      description: "A boy swallows a cursed object and joins a school of sorcerers to protect humanity."
    },
    {
      id: "nano_machine",
      title: "Nano Machine",
      chapter: "180",
      genre: "Martial Arts",
      cover: "https://i.imgur.com/6bfedh5.jpg",
      description: "A rejected prince is injected with future nano-tech and revolutionizes martial arts."
    }
  ]
};


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
  renderAllSections(); // Refresh UI
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
    localStorage.setItem(id, "read", "read");
  }
  renderAllSections();
}

// === Render Cards ===
function renderList(data, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = ""; // Clear container

  const selectedGenre = document.getElementById("genreFilter")?.value || "all";

  data.forEach(item => {
    // Filter by genre
    if (selectedGenre !== "all" && item.genre !== selectedGenre) return;

    const isRead = localStorage.getItem(item.id) === "read";
    const bookmarked = isBookmarked(item.id);
    const savedChapter = localStorage.getItem(`chapter_${item.id}`) || item.chapter;

    const card = document.createElement('div');
    card.className = 'card';

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
    `;

    container.appendChild(card);
  });
}

// === Search Function ===
document.getElementById('searchInput').addEventListener('input', function (e) {
  const keyword = e.target.value.toLowerCase();

  function filterList(list) {
    return list.filter(item => item.title.toLowerCase().includes(keyword));
  }

  renderList(filterList(manhwaData.currentlyReading), 'currently-reading');
  renderList(filterList(manhwaData.popular), 'popular-series');
  renderList(filterList(manhwaData.newReleases), 'new-releases');
  renderLibrary();
});

// === Genre Filter ===
document.getElementById('genreFilter').addEventListener('change', () => {
  renderAllSections();
});

// === Render All Sections ===
function renderAllSections() {
  renderList(manhwaData.currentlyReading, 'currently-reading');
  renderList(manhwaData.popular, 'popular-series');
  renderList(manhwaData.newReleases, 'new-releases');
  renderLibrary();
}

// === Render My Library Section ===
function renderLibrary() {
  const all = [
    ...manhwaData.currentlyReading,
    ...manhwaData.popular,
    ...manhwaData.newReleases
  ];
  const bookmarked = getBookmarks();
  const filtered = all.filter(item => bookmarked.includes(item.id));
  renderList(filtered, 'my-library');
}

// === Modal Popup ===
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

// === Save Chapter Progress ===
function saveChapterProgress() {
  const newChapter = document.getElementById("chapterInput").value;
  if (currentPopupId && newChapter) {
    localStorage.setItem(`chapter_${currentPopupId}`, newChapter);
    closePopup();
    renderAllSections(); // Refresh UI
  }
}

// === Theme Toggle ===
const themeToggle = document.getElementById("themeToggle");

themeToggle.addEventListener("change", () => {
  document.body.classList.toggle("light");
  localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
});

// === Load Saved Theme ===
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light");
    themeToggle.checked = true;
  }

  renderAllSections();
});

// === PWA: Register Service Worker ===
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('service-worker.js').then(function (reg) {
      console.log('✅ Service worker registered.', reg);
    }).catch(function (err) {
      console.log('❌ Service worker registration failed:', err);
    });
  });
}











