// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZwBWsqvWb74fp9jWbXN2k7tQ48-Yfp0M",
  authDomain: "dg-s-restaurant.firebaseapp.com",
  projectId: "dg-s-restaurant",
  storageBucket: "dg-s-restaurant.firebasestorage.app",
  messagingSenderId: "757330499554",
  appId: "1:757330499554:web:0a19c1ec4365c660670bbb",
  measurementId: "G-9TWVN0NP8J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

// Export auth so your login script can import it
export { auth };