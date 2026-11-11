import "./firebase-config.js";
import { 
  getFirestore, 
  collection, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const db = getFirestore();
const container = document.getElementById("history-content-container");

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

async function fetchAndRenderHistory() {
  try {
    const querySnapshot = await getDocs(collection(db, "orders"));
    const pastOrders = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status === "accepted" || data.status === "declined") {
        pastOrders.push({ id: docSnap.id, ...data });
      }
    });

    if (!container) return;

    if (pastOrders.length === 0) {
      container.innerHTML = `<div class="empty-state">No processed order history found.</div>`;
      return;
    }

    const groupedOrders = {};

    pastOrders.forEach(order => {
      let dateObj = order.createdAt ? new Date(order.createdAt) : new Date();
      if (isNaN(dateObj)) dateObj = new Date();

      const dateKey = dateObj.toLocaleDateString("en-US", {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      if (!groupedOrders[dateKey]) {
        groupedOrders[dateKey] = [];
      }
      groupedOrders[dateKey].push(order);
    });

    container.innerHTML = "";

    Object.keys(groupedOrders).forEach(dateHeader => {
      const groupOrders = groupedOrders[dateHeader];
      groupOrders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      const groupSection = document.createElement("div");
      groupSection.className = "date-group";

      let cardsHtml = groupOrders.map(order => {
        const timeStr = order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A";
        const status = order.status || "accepted";
        const totalAmount = Number(order.totalAmount || 0).toLocaleString();

        let itemsHtml = "";
        if (order.items && Array.isArray(order.items)) {
          itemsHtml = order.items.map(item => `
            <div class="dish-item">
              <span><span class="dish-qty">${item.quantity || 1}x</span> ${item.name || "Unknown Dish"}</span>
              <span>₱${Number(item.price || 0).toLocaleString()}</span>
            </div>
          `).join("");
        }

        const customerName = order.name || order.customerName || order.userName || "N/A";
        const customerPhone = order.phone || order.phoneNumber || order.number || "N/A";
        const customerAddress = order.address || order.deliveryAddress || "N/A";

        return `
          <div class="history-card">
            <div class="history-card-top">
              <div class="card-top">
                <span class="card-time">${timeStr}</span>
                <span class="status-badge status-${status}">${status}</span>
              </div>
              <div class="dish-list">${itemsHtml}</div>
            </div>

            <div class="history-card-bottom">
              <div class="customer-info-box">
                <div><span class="info-label">Customer:</span> ${customerName}</div>
                <div><span class="info-label">Phone:</span> ${customerPhone}</div>
                <div><span class="info-label">Address:</span> ${customerAddress}</div>
              </div>

              <div class="history-card-footer">
                <span style="color: rgba(255,255,255,0.6);">Total:</span>
                <span class="history-total">₱${totalAmount}</span>
              </div>
            </div>
          </div>
        `;
      }).join("");

      groupSection.innerHTML = `
        <div class="date-header">
          <h2 class="date-title">${dateHeader}</h2>
          <span class="date-count">${groupOrders.length} Order(s)</span>
        </div>
        <div class="history-grid">${cardsHtml}</div>
      `;

      container.appendChild(groupSection);
    });

  } catch (error) {
    console.error("Error fetching order history:", error);
    if (container) {
      container.innerHTML = `<div class="empty-state">Failed to load order history from database.</div>`;
    }
  }
}

fetchAndRenderHistory();