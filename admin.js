import { auth } from "./firebase-config.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const db = getFirestore();

// Dropdown Menu Toggle Script
const menuDropdownBtn = document.getElementById("menu-dropdown-btn");
const navDropdownContent = document.getElementById("nav-dropdown-content");

if (menuDropdownBtn && navDropdownContent) {
  menuDropdownBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    navDropdownContent.classList.toggle("hidden");
  });

  window.addEventListener("click", () => {
    if (!navDropdownContent.classList.contains("hidden")) {
      navDropdownContent.classList.add("hidden");
    }
  });
}

// State
let currentCategory = "foods";
let allDishes = [];

// Sub-categories mapping
const subcategoriesMap = {
  foods: ["Beef", "Pork", "Chicken", "Salad"],
  drinks: ["Drinks", "Fresh Fruit Shakes", "Signature Coolers & Mocktails (Specialty)", "Wine (Per Bottle)"],
  desserts: ["Cakes", "Desserts"]
};

// Elements
const categoryButtons = document.querySelectorAll(".cat-btn");
const activeCategoryTitle = document.getElementById("active-category-title");
const adminDishGrid = document.getElementById("admin-dish-grid");

const openModalBtn = document.getElementById("open-add-modal-btn");
const dishModal = document.getElementById("dish-modal");
const modalCloseBtn = document.getElementById("modal-close-btn");
const modalOverlay = document.querySelector(".modal-overlay");
const modalTitle = document.getElementById("modal-title");
const dishForm = document.getElementById("dish-form");

const dishIdInput = document.getElementById("dish-id");
const dishCategorySelect = document.getElementById("dish-category-select");
const dishSubcategorySelect = document.getElementById("dish-subcategory-select");
const dishNameInput = document.getElementById("dish-name-input");
const dishPriceInput = document.getElementById("dish-price-input");
const dishImgInput = document.getElementById("dish-img-input");

// Update subcategory dropdown options based on selected main category
function updateSubcategoryOptions(selectedCategory, selectedSub = "") {
  dishSubcategorySelect.innerHTML = "";
  const options = subcategoriesMap[selectedCategory] || [];
  
  options.forEach(sub => {
    const opt = document.createElement("option");
    opt.value = sub;
    opt.textContent = sub;
    if (sub === selectedSub) opt.selected = true;
    dishSubcategorySelect.appendChild(opt);
  });
}

dishCategorySelect.addEventListener("change", (e) => {
  updateSubcategoryOptions(e.target.value);
});

// Category Bar Switching (Top Tabs)
categoryButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    categoryButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    currentCategory = btn.dataset.category;
    activeCategoryTitle.textContent = `Manage ${currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)}`;
    renderDishes();
  });
});

// Modal Toggles
openModalBtn.addEventListener("click", () => {
  modalTitle.textContent = "Add New Dish";
  dishForm.reset();
  dishIdInput.value = "";
  dishCategorySelect.value = currentCategory;
  updateSubcategoryOptions(currentCategory);
  dishModal.classList.remove("hidden");
});

const closeModal = () => {
  dishModal.classList.add("hidden");
};

modalCloseBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", closeModal);

// Fetch Dishes from Firestore
async function fetchDishes() {
  adminDishGrid.innerHTML = '<p class="loading-text">Loading items from Firestore...</p>';
  try {
    const querySnapshot = await getDocs(collection(db, "dishes"));
    allDishes = [];
    querySnapshot.forEach((docSnap) => {
      allDishes.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderDishes();
  } catch (error) {
    console.error("Error fetching dishes:", error);
    adminDishGrid.innerHTML = '<p class="loading-text" style="color:#ff7b7b;">Failed to load dishes from database.</p>';
  }
}

// Render Dishes for Current Category
function renderDishes() {
  adminDishGrid.innerHTML = "";
  const filteredDishes = allDishes.filter(d => d.category === currentCategory);

  if (filteredDishes.length === 0) {
    adminDishGrid.innerHTML = `<p class="empty-text">No items found in ${currentCategory}. Click "+ Add New Dish" to create one.</p>`;
    return;
  }

  filteredDishes.forEach(dish => {
    const card = document.createElement("div");
    card.className = "admin-card";
    card.innerHTML = `
      <img src="${dish.imageUrl || ''}" alt="${dish.name}" class="admin-card-img" onerror="this.src='https://via.placeholder.com/260x160?text=No+Image'">
      <h3 class="admin-card-title">${dish.name}</h3>
      <p style="font-size: 12px; color: #E8A317; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">${dish.subcategory || 'General'}</p>
      <p class="admin-card-price">₱${Number(dish.price).toLocaleString()}</p>
      <div class="admin-card-actions">
        <button type="button" class="edit-btn" data-id="${dish.id}">Edit</button>
        <button type="button" class="delete-btn" data-id="${dish.id}">Delete</button>
      </div>
    `;
    adminDishGrid.appendChild(card);
  });

  // Attach Edit & Delete Listeners
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", (e) => openEditModal(e.target.dataset.id));
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", (e) => deleteDish(e.target.dataset.id));
  });
}

// Open Edit Modal
function openEditModal(dishId) {
  const dish = allDishes.find(d => d.id === dishId);
  if (!dish) return;

  modalTitle.textContent = "Edit Dish";
  dishIdInput.value = dish.id;
  dishCategorySelect.value = dish.category || "foods";
  updateSubcategoryOptions(dish.category || "foods", dish.subcategory);
  dishNameInput.value = dish.name;
  dishPriceInput.value = dish.price;
  dishImgInput.value = dish.imageUrl || "";

  dishModal.classList.remove("hidden");
}

// Save Dish (Add or Update)
dishForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const dishId = dishIdInput.value;
  const category = dishCategorySelect.value;
  const subcategory = dishSubcategorySelect.value;
  const name = dishNameInput.value.trim();
  const price = parseFloat(dishPriceInput.value);
  const imageUrl = dishImgInput.value.trim();

  try {
    if (dishId) {
      const dishRef = doc(db, "dishes", dishId);
      await updateDoc(dishRef, { name, price, imageUrl, category, subcategory });
    } else {
      await addDoc(collection(db, "dishes"), { name, price, imageUrl, category, subcategory, createdAt: new Date().toISOString() });
    }

    closeModal();
    fetchDishes();
  } catch (error) {
    console.error("Error saving dish:", error);
    alert("Failed to save dish. Please check your Firestore security rules.");
  }
});

// Delete Dish
async function deleteDish(dishId) {
  if (!confirm("Are you sure you want to delete this dish?")) return;

  try {
    await deleteDoc(doc(db, "dishes", dishId));
    fetchDishes();
  } catch (error) {
    console.error("Error deleting dish:", error);
    alert("Failed to delete dish.");
  }
}

// Initial Load
fetchDishes();