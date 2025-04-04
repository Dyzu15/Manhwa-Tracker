// === Firebase Configuration ===
const firebaseConfig = {
  apiKey: "AIzaSyCVZSmhs1Bz8pHa6e5w-0p1lGsdGgFqWWI",
  authDomain: "manhwa-tracker-701f9.firebaseapp.com",
  projectId: "manhwa-tracker-701f9",
  storageBucket: "manhwa-tracker-701f9.appspot.com",
  messagingSenderId: "775288113585",
  appId: "1:775288113585:web:5094032a41980a662e1590",
  measurementId: "G-LFESV3X9JX"
};

// === Initialize Firebase ===
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// === UI Elements ===
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');
const userDisplay = document.getElementById('userDisplay');

// === Google Sign In ===
function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      closeLogin();
    })
    .catch(error => {
      console.error("Login Error:", error);
      alert("Login failed.");
    });
}

// === Logout ===
logoutBtn.addEventListener('click', () => {
  auth.signOut();
});

// === Auth UI Updates ===
auth.onAuthStateChanged(user => {
  if (user) {
    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    userDisplay.textContent = `👋 Hello, ${user.displayName}`;
    userDisplay.classList.remove('hidden');
  } else {
    loginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    userDisplay.classList.add('hidden');
  }
});

// === Modal Toggle ===
loginBtn.addEventListener('click', () => {
  loginModal.classList.remove('hidden');
});

function closeLogin() {
  loginModal.classList.add('hidden');
}

