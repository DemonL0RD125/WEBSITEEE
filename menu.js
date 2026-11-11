import "./firebase-config.js"; 
import { auth } from "./firebase-config.js";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const db = getFirestore();

const buttons = document.querySelectorAll(".tab-btn");
const sections = document.querySelectorAll(".tab-section");
const sidebar = document.getElementById("sidebar");
const toggle = document.getElementById("sidebar-toggle");

buttons.forEach(function (button) {
  button.addEventListener("click", function () {
    buttons.forEach(function (b) { b.classList.remove("active"); });
    sections.forEach(function (s) { s.classList.add("hidden"); });

    button.classList.add("active");
    document.getElementById(button.dataset.target).classList.remove("hidden");

    if (window.innerWidth < 768) {
      sidebar.classList.add("hidden");
    }
  });
});

toggle.addEventListener("click", function () {
  sidebar.classList.toggle("hidden");
});

window.addEventListener("resize", () => {
  if (window.innerWidth >= 768) {
    sidebar.classList.remove("hidden");
  } else {
    sidebar.classList.add("hidden");
  }
});

async function loadMenuFromFirestore() {
  try {
    const querySnapshot = await getDocs(collection(db, "dishes"));
    
    const subcategoryGrids = document.querySelectorAll(".dish-grid[data-subcategory]");
    subcategoryGrids.forEach(grid => { grid.innerHTML = ""; });

    querySnapshot.forEach((docSnap) => {
      const dish = docSnap.data();
      const targetGrid = document.querySelector(`.dish-grid[data-subcategory="${dish.subcategory}"]`);

      if (targetGrid) {
        const cardHtml = `
          <div class="dish-item" data-name="${dish.name}" data-price="${dish.price}">
            <div class="dish-img-wrap"><img src="${dish.imageUrl || ''}" alt="${dish.name}" onerror="this.src='https://via.placeholder.com/220x180?text=No+Image'"></div>
            <h3 class="dish-name">${dish.name}</h3>
            <p class="dish-price">₱${Number(dish.price).toLocaleString()}</p>
            <button type="button" class="add-cart-btn">Add to Cart</button>
          </div>
        `;
        targetGrid.insertAdjacentHTML("beforeend", cardHtml);
      }
    });

    initCartListeners();

  } catch (error) {
    console.error("Error loading menu from Firestore:", error);
  }
}

let cart = [];

const cartToggleBtn = document.getElementById("cart-toggle-btn");
const cartModal = document.getElementById("cart-modal");
const cartCloseBtn = document.getElementById("cart-close-btn");
const cartOverlay = document.querySelector(".cart-modal-overlay");
const cartCountElem = document.getElementById("cart-count");
const cartItemsList = document.getElementById("cart-items-list");
const cartTotalPriceElem = document.getElementById("cart-total-price");
const orderForm = document.getElementById("order-form");

cartToggleBtn.addEventListener("click", () => {
  cartModal.classList.remove("hidden");
  renderCart();
});

cartCloseBtn.addEventListener("click", () => { cartModal.classList.add("hidden"); });
cartOverlay.addEventListener("click", () => { cartModal.classList.add("hidden"); });

function initCartListeners() {
  const addToCartButtons = document.querySelectorAll(".add-cart-btn");
  addToCartButtons.forEach((btn) => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener("click", (e) => {
      const dishItem = e.target.closest(".dish-item");
      const name = dishItem.dataset.name;
      const price = parseFloat(dishItem.dataset.price);

      // Check if item already exists in cart, if so increase quantity
      const existingItem = cart.find(item => item.name === name);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({ name, price, quantity: 1 });
      }

      updateCartBadge();
      
      const originalText = newBtn.textContent;
      newBtn.textContent = "Added!";
      newBtn.style.backgroundColor = "#E8A317";
      newBtn.style.color = "#0A1930";
      setTimeout(() => {
        newBtn.textContent = originalText;
        newBtn.style.backgroundColor = "";
        newBtn.style.color = "";
      }, 1000);
    });
  });
}

function updateCartBadge() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountElem.textContent = totalCount;
}

function renderCart() {
  cartItemsList.innerHTML = "";

  if (cart.length === 0) {
    cartItemsList.innerHTML = '<p class="empty-cart-text">Your cart is empty.</p>';
    cartTotalPriceElem.textContent = "₱0";
    return;
  }

  let total = 0;
  cart.forEach((item, index) => {
    total += item.price * item.quantity;

    const row = document.createElement("div");
    row.className = "cart-item-row";
    row.innerHTML = `
      <div class="cart-item-info">
        <span class="cart-item-name">${item.name}</span>
        <span class="cart-item-price">₱${(item.price * item.quantity).toLocaleString()}</span>
        <div class="cart-item-controls">
          <button type="button" class="qty-btn decrease-qty" data-index="${index}">-</button>
          <span class="cart-item-qty">${item.quantity}</span>
          <button type="button" class="qty-btn increase-qty" data-index="${index}">+</button>
        </div>
      </div>
      <button type="button" class="cart-item-remove" data-index="${index}">&times;</button>
    `;
    cartItemsList.appendChild(row);
  });

  cartTotalPriceElem.textContent = `₱${total.toLocaleString()}`;

  // Quantity Decrease Listeners
  document.querySelectorAll(".decrease-qty").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.target.dataset.index);
      if (cart[idx].quantity > 1) {
        cart[idx].quantity -= 1;
      } else {
        cart.splice(idx, 1); // Remove item if quantity drops to 0
      }
      updateCartBadge();
      renderCart();
    });
  });

  // Quantity Increase Listeners
  document.querySelectorAll(".increase-qty").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.target.dataset.index);
      cart[idx].quantity += 1;
      updateCartBadge();
      renderCart();
    });
  });

  // Remove Item Listeners
  document.querySelectorAll(".cart-item-remove").forEach((remBtn) => {
    remBtn.addEventListener("click", (e) => {
      const idx = parseInt(e.target.dataset.index);
      cart.splice(idx, 1);
      updateCartBadge();
      renderCart();
    });
  });
}

// Order submission recording quantities in Firestore
orderForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (cart.length === 0) {
    alert("Please add items to your cart before ordering.");
    return;
  }

  const name = document.getElementById("order-name").value.trim();
  const mobile = document.getElementById("order-mobile").value.trim();
  const address = document.getElementById("order-address").value.trim();

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const currentUser = auth.currentUser;

  const orderData = {
    userId: currentUser ? currentUser.uid : "guest",
    userEmail: currentUser ? currentUser.email : "guest@system.com",
    
    name: name,
    customerName: name,
    phone: mobile,
    phoneNumber: mobile,
    address: address,
    deliveryAddress: address,

    customerInfo: {
      name: name,
      mobileNumber: mobile,
      address: address
    },
    // Saves each item along with its selected quantity and price
    items: cart.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity
    })),
    totalAmount: totalAmount,
    createdAt: new Date().toISOString(),
    timestamp: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "orders"), orderData);
    console.log("Order successfully recorded with quantities!");

    cartModal.classList.add("hidden");
    showThankYouPopup(name, address);

    cart = [];
    updateCartBadge();
    orderForm.reset();

  } catch (error) {
    console.error("Error saving order to Firestore:", error);
    alert("Failed to submit order. Please check your Firestore rules.");
  }
});

function showThankYouPopup(customerName, deliveryAddress) {
  const existingPopup = document.getElementById("thank-you-popup");
  if (existingPopup) existingPopup.remove();

  const popupOverlay = document.createElement("div");
  popupOverlay.id = "thank-you-popup";
  popupOverlay.className = "cart-modal"; 
  popupOverlay.innerHTML = `
    <div class="cart-modal-overlay"></div>
    <div class="cart-modal-content thank-you-content" style="text-align: center; max-width: 450px; padding: 40px 30px;">
      <div class="thank-you-icon" style="font-size: 48px; color: #E8A317; margin-bottom: 16px;">✓</div>
      <h2 class="cart-modal-title" style="margin-bottom: 12px;">Thank You, ${customerName}!</h2>
      <p style="color: rgba(255, 255, 255, 0.8); font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
        Your order has been successfully placed and will be delivered to <strong style="color: #E8A317;">${deliveryAddress}</strong> shortly.
      </p>
      <button type="button" id="thank-you-close-btn" class="order-btn" style="max-width: 200px; margin: 0 auto;">Continue</button>
    </div>
  `;

  document.body.appendChild(popupOverlay);

  const closePopup = () => { popupOverlay.remove(); };
  document.getElementById("thank-you-close-btn").addEventListener("click", closePopup);
  popupOverlay.querySelector(".cart-modal-overlay").addEventListener("click", closePopup);
}

loadMenuFromFirestore();