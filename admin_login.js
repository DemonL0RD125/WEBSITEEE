const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const errorMsg = document.getElementById("error-msg");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const enteredUser = usernameInput.value.trim();
  const enteredPass = passwordInput.value.trim();

  if (enteredUser === "admin" && enteredPass === "admin123") {
    errorMsg.classList.add("hidden");
    
    sessionStorage.setItem("dg_admin_logged_in", "true");

    window.location.href = "admin.html";
  } else {
    // Show error message
    errorMsg.classList.remove("hidden");
    passwordInput.value = "";
    passwordInput.focus();
  }
});