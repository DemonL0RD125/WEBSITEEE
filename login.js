import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { incrementVisitorCount } from "./tracker.js";

const loginForm = document.getElementById("login-form"); // Match your login form ID
const emailInput = document.getElementById("email");       // Match your email input ID
const passwordInput = document.getElementById("password"); // Match your password input ID
const loginBtn = document.getElementById("login-btn");     // Match your submit button ID
const message = document.getElementById("message");        // Match your message/error display ID

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    if (message) {
      message.textContent = "Please fill in all fields.";
      message.className = "message error";
    }
    return;
  }

  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.textContent = "Logging In...";
  }

  if (message) message.textContent = "";

  try {
    // Authenticate user with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log("User logged in successfully:", user.email);

    // Force visitor count to go up on login, bypassing session limits
    await incrementVisitorCount(true);

    if (message) {
      message.textContent = "Login successful! Redirecting...";
      message.className = "message success";
    }

    // Redirect to home page after a brief moment
    setTimeout(() => {
      window.location.href = "home.html";
    }, 1000);

  } catch (error) {
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = "Log In";
    }

    console.error("Login Error:", error.code, error.message);

    if (message) {
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        message.textContent = "Invalid email or password.";
      } else if (error.code === "auth/invalid-email") {
        message.textContent = "Please enter a valid email address.";
      } else {
        message.textContent = "Login failed: " + error.message;
      }
      message.className = "message error";
    }
  }
});