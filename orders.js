import "./firebase-config.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const db = getFirestore();
const container = document.getElementById("orders-list-container");

async function fetchAndRenderOrders() {
  try {
    const querySnapshot = await getDocs(collection(db, "orders"));
    const pendingOrders = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data.status || data.status === "pending") {
        pendingOrders.push({ id: docSnap.id, ...data });
      }
    });

    if (!container) return;

    if (pendingOrders.length === 0) {
      container.innerHTML = `<div class="empty-state">No pending orders at the moment.</div>`;
      return;
    }

    pendingOrders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    container.innerHTML = "";

    pendingOrders.forEach((order) => {
      const orderCard = document.createElement("div");
      orderCard.className = "order-card";

      const orderStatus = order.status || "pending";
      const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A";
      const totalAmount = Number(order.totalAmount || 0).toLocaleString();

      let itemsHtml = "";
      if (order.items && Array.isArray(order.items)) {
        itemsHtml = order.items.map(item => `
          <div class="dish-item">
            <span><span class="dish-qty">${item.quantity || 1}x</span> ${item.name || "Unknown Dish"}</span>
            <span>₱${Number(item.price || 0).toLocaleString()}</span>
          </div>
        `).join("");
      } else {
        itemsHtml = `<div class="dish-item">No items listed</div>`;
      }

      const customerName = order.name || order.customerName || order.userName || "N/A";
      const customerPhone = order.phone || order.phoneNumber || order.number || "N/A";
      const customerAddress = order.address || order.deliveryAddress || "N/A";

      // Uses .order-card-top and .order-card-bottom to lock info to the bottom
      orderCard.innerHTML = `
        <div class="order-card-top">
          <div class="order-card-header">
            <span class="order-date">${formattedDate}</span>
            <span class="status-badge status-${orderStatus}">${orderStatus}</span>
          </div>

          <div class="ordered-dishes-section">
            <div class="section-label">Ordered Dishes</div>
            ${itemsHtml}
          </div>
        </div>

        <div class="order-card-bottom">
          <div class="customer-details-section">
            <div class="section-label">Customer Info</div>
            <div class="detail-row"><span>Name:</span> ${customerName}</div>
            <div class="detail-row"><span>Phone:</span> ${customerPhone}</div>
            <div class="detail-row"><span>Address:</span> ${customerAddress}</div>
          </div>

          <div class="order-total-row">
            <span style="font-size: 12px; color: rgba(255,255,255,0.7);">Total Amount:</span>
            <span class="total-amount">₱${totalAmount}</span>
          </div>

          <div class="order-actions">
            <button class="btn-action btn-accept" data-id="${order.id}">Accept</button>
            <button class="btn-action btn-decline" data-id="${order.id}">Decline</button>
          </div>
        </div>
      `;

      container.appendChild(orderCard);
    });

    document.querySelectorAll(".btn-accept").forEach(btn => {
      btn.addEventListener("click", () => updateOrderStatus(btn.dataset.id, "accepted"));
    });

    document.querySelectorAll(".btn-decline").forEach(btn => {
      btn.addEventListener("click", () => updateOrderStatus(btn.dataset.id, "declined"));
    });

  } catch (error) {
    console.error("Error fetching pending orders:", error);
    if (container) {
      container.innerHTML = `<div class="empty-state">Failed to load orders from database.</div>`;
    }
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { status: newStatus });
    fetchAndRenderOrders();
  } catch (err) {
    console.error("Error updating order status:", err);
    alert("Could not update order status.");
  }
}

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

fetchAndRenderOrders();