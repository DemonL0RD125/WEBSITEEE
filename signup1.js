const firstNameInput = document.getElementById("first-name");
const middleNameInput = document.getElementById("middle-name");
const lastNameInput = document.getElementById("last-name");
const birthdateInput = document.getElementById("birthdate-input");
const ageInput = document.getElementById("age");
const signup1Form = document.getElementById("signup1-form");
const message = document.getElementById("message");

const customCalendar = document.getElementById("custom-calendar");
const calMonthSelect = document.getElementById("cal-month-select");
const calYearSelect = document.getElementById("cal-year-select");
const calPrevBtn = document.getElementById("cal-prev");
const calNextBtn = document.getElementById("cal-next");
const calendarDays = document.getElementById("calendar-days");

let selectedDate = null;
let currentCalMonth = new Date().getMonth();
let currentCalYear = new Date().getFullYear();

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function initCalendarOptions() {
  calMonthSelect.innerHTML = "";
  months.forEach((month, index) => {
    const opt = document.createElement("option");
    opt.value = index;
    opt.textContent = month;
    calMonthSelect.appendChild(opt);
  });

  calYearSelect.innerHTML = "";
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= 1900; year--) {
    const opt = document.createElement("option");
    opt.value = year;
    opt.textContent = year;
    calYearSelect.appendChild(opt);
  }
}

function renderCalendar() {
  calMonthSelect.value = currentCalMonth;
  calYearSelect.value = currentCalYear;
  calendarDays.innerHTML = "";

  const firstDayIndex = new Date(currentCalYear, currentCalMonth, 1).getDay();
  const daysInMonth = new Date(currentCalYear, currentCalMonth + 1, 0).getDate();

  for (let i = 0; i < firstDayIndex; i++) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "cal-day empty";
    calendarDays.appendChild(emptyDiv);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "cal-day";
    dayDiv.textContent = day;

    if (
      selectedDate &&
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentCalMonth &&
      selectedDate.getFullYear() === currentCalYear
    ) {
      dayDiv.classList.add("selected");
    }

    dayDiv.addEventListener("click", () => {
      selectedDate = new Date(currentCalYear, currentCalMonth, day);
      birthdateInput.value = selectedDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      calculateAge(selectedDate);
      customCalendar.classList.add("hidden");
    });

    calendarDays.appendChild(dayDiv);
  }
}

function calculateAge(dob) {
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
  ageInput.value = calculatedAge;
}

birthdateInput.addEventListener("click", () => {
  customCalendar.classList.toggle("hidden");
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".custom-calendar-container")) {
    customCalendar.classList.add("hidden");
  }
});

calMonthSelect.addEventListener("change", function () {
  currentCalMonth = parseInt(this.value);
  renderCalendar();
});

calYearSelect.addEventListener("change", function () {
  currentCalYear = parseInt(this.value);
  renderCalendar();
});

calPrevBtn.addEventListener("click", () => {
  currentCalMonth--;
  if (currentCalMonth < 0) {
    currentCalMonth = 11;
    currentCalYear--;
  }
  renderCalendar();
});

calNextBtn.addEventListener("click", () => {
  currentCalMonth++;
  if (currentCalMonth > 11) {
    currentCalMonth = 0;
    currentCalYear++;
  }
  renderCalendar();
});

signup1Form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!birthdateInput.value) {
    message.textContent = "Please select your birthdate.";
    message.className = "message error";
    return;
  }

  // Store data in sessionStorage for multi-page flow
  sessionStorage.setItem("signup_firstName", firstNameInput.value.trim());
  sessionStorage.setItem("signup_middleName", middleNameInput.value.trim());
  sessionStorage.setItem("signup_lastName", lastNameInput.value.trim());
  sessionStorage.setItem("signup_birthdate", birthdateInput.value);
  sessionStorage.setItem("signup_age", ageInput.value);

  window.location.href = "signup2.html";
});

initCalendarOptions();
renderCalendar();