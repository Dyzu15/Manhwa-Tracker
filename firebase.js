const firebaseConfig = {
  apiKey: "AIzaSyCVZSmhs1Bz8pHa6e5w-0p1lGsdGgFqWWI",
  authDomain: "manhwa-tracker-701f9.firebaseapp.com",
  projectId: "manhwa-tracker-701f9",
  storageBucket: "manhwa-tracker-701f9.firebasestorage.app",
  messagingSenderId: "775288113585",
  appId: "1:775288113585:web:5094032a41980a662e1590",
  measurementId: "G-LFESV3X9JX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firestore
const db = firebase.firestore();

// Expose `db` globally so other files like script.js can use it
window.db = db;
