// === Firebase Authentication ===
const auth = firebase.auth();

// === UI Elements ===
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');
const userDisplay = document.getElementById('userDisplay');

// === Secure Context Warning ===
if (!window.isSecureContext) {
  alert("⚠️ Google login only works in secure browsers like Chrome or Safari. Please open this site in a secure browser.");
}

// === Google Sign In ===
function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      const user = result.user;
      if (user) {
      localStorage.setItem("username", user.displayName || "User");
      localStorage.setItem("userEmail", user.email || "");
      }
      closeLogin();
      showLoggedInUser(); // Refresh user display and admin check
    })
    .catch(error => {
      console.error("Login Error:", error);
      alert("Login failed.");
    });
}

// === Logout ===
logoutBtn.addEventListener('click', () => {
  auth.signOut().then(() => {
    localStorage.removeItem("username");
    localStorage.removeItem("userEmail");
    showLoggedInUser(); // Refresh UI on logout
  });
});

// === Auth UI Updates ===
auth.onAuthStateChanged(user => {
  if (user) {
    localStorage.setItem("username", user.displayName);
    localStorage.setItem("userEmail", user.email);

    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    userDisplay.textContent = `👋 Hello, ${user.displayName}`;
    userDisplay.classList.remove('hidden');

    showLoggedInUser(); // Trigger admin visibility check
  } else {
    loginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    userDisplay.classList.add('hidden');

    localStorage.removeItem("username");
    localStorage.removeItem("userEmail");

    showLoggedInUser(); // Reset UI
  }
});

// === Modal Toggle ===
loginBtn.addEventListener('click', () => {
  loginModal.classList.remove('hidden');
});

function closeLogin() {
  loginModal.classList.add('hidden');
}
