import { auth } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const db = getFirestore();

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const showPasswordBtn = document.getElementById("show-password");
const showConfirmPasswordBtn = document.getElementById("show-confirm-password");
const signup3Form = document.getElementById("signup3-form");
const signupBtn = document.getElementById("signup-btn");
const backBtn = document.getElementById("back-btn");
const message = document.getElementById("message");

backBtn.addEventListener("click", () => {
  window.location.href = "signup2.html";
});

showPasswordBtn.addEventListener("click", () => {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    showPasswordBtn.textContent = "Hide";
  } else {
    passwordInput.type = "password";
    showPasswordBtn.textContent = "Show";
  }
});

showConfirmPasswordBtn.addEventListener("click", () => {
  if (confirmPasswordInput.type === "password") {
    confirmPasswordInput.type = "text";
    showConfirmPasswordBtn.textContent = "Hide";
  } else {
    confirmPasswordInput.type = "password";
    showConfirmPasswordBtn.textContent = "Show";
  }
});

signup3Form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (passwordInput.value !== confirmPasswordInput.value) {
    message.textContent = "Passwords do not match.";
    message.className = "message error";
    return;
  }

  signupBtn.disabled = true;
  signupBtn.textContent = "Creating Account...";
  message.textContent = "";

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      emailInput.value.trim(),
      passwordInput.value
    );

    const user = userCredential.user;

    const userData = {
      firstName: sessionStorage.getItem("signup_firstName") || "",
      middleName: sessionStorage.getItem("signup_middleName") || "",
      lastName: sessionStorage.getItem("signup_lastName") || "",
      birthdate: sessionStorage.getItem("signup_birthdate") || "",
      age: parseInt(sessionStorage.getItem("signup_age")) || 0,
      mobileNumber: sessionStorage.getItem("signup_mobile") || "",
      address: sessionStorage.getItem("signup_address") || "",
      zipCode: sessionStorage.getItem("signup_zip") || "",
      email: emailInput.value.trim(),
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "users", user.uid), userData);

    // Clean up only signup temporary keys so visitor tracker session is preserved
    sessionStorage.removeItem("signup_firstName");
    sessionStorage.removeItem("signup_middleName");
    sessionStorage.removeItem("signup_lastName");
    sessionStorage.removeItem("signup_birthdate");
    sessionStorage.removeItem("signup_age");
    sessionStorage.removeItem("signup_mobile");
    sessionStorage.removeItem("signup_address");
    sessionStorage.removeItem("signup_zip");

    message.textContent = "Account created successfully! Redirecting...";
    message.className = "message success";

    setTimeout(() => {
      window.location.href = "home.html";
    }, 1500);

  } catch (error) {
    signupBtn.disabled = false;
    signupBtn.textContent = "Sign Up";

    console.error("Firebase Signup Error:", error.code, error.message);

    if (error.code === "auth/email-already-in-use") {
      message.textContent = "This email is already registered. Please log in.";
    } else if (error.code === "auth/invalid-email") {
      message.textContent = "Please enter a valid email address.";
    } else if (error.code === "auth/weak-password") {
      message.textContent = "Password is too weak (Firebase requires at least 6 characters).";
    } else {
      message.textContent = "Failed to create account: " + error.message;
    }
    message.className = "message error";
  }
});