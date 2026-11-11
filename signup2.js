const mobileInput = document.getElementById("mobile-number");
const addressInput = document.getElementById("address");
const zipInput = document.getElementById("zip-code");
const signup2Form = document.getElementById("signup2-form");
const backBtn = document.getElementById("back-btn");

backBtn.addEventListener("click", () => {
  window.location.href = "signup1.html";
});

signup2Form.addEventListener("submit", (e) => {
  e.preventDefault();

  sessionStorage.setItem("signup_mobile", mobileInput.value.trim());
  sessionStorage.setItem("signup_address", addressInput.value.trim());
  sessionStorage.setItem("signup_zip", zipInput.value.trim());

  window.location.href = "signup3.html";
});