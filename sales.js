import "./firebase-config.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  runTransaction 
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

async function trackVisitor() {
  if (sessionStorage.getItem("visited_this_session")) {
    return;
  }

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const yearStr = String(now.getFullYear());

  const visitorRef = doc(db, "analytics", "visitors");
  
  try {
    await runTransaction(db, async (transaction) => {
      const vDoc = await transaction.get(visitorRef);
      
      let data;
      if (vDoc.exists()) {
        data = vDoc.data();
        if (!data.daily) data.daily = {};
        if (!data.monthly) data.monthly = {};
        if (!data.yearly) data.yearly = {};
      } else {
        data = { daily: {}, monthly: {}, yearly: {}, totalCount: 0 };
      }

      data.totalCount = (data.totalCount || 0) + 1;
      data.daily[dateStr] = (data.daily[dateStr] || 0) + 1;
      data.monthly[monthStr] = (data.monthly[monthStr] || 0) + 1;
      data.yearly[yearStr] = (data.yearly[yearStr] || 0) + 1;

      transaction.set(visitorRef, data);
    });

    sessionStorage.setItem("visited_this_session", "true");
  } catch (err) {
    console.error("Error updating visitor count:", err);
  }
}

trackVisitor();

let purchasesChartInstance = null;
let dishesPieChartInstance = null;
let visitorsChartInstance = null;

const timeFilterSelect = document.getElementById("time-filter");

async function fetchAndRenderDashboard() {
  try {
    // Fetch dishes first so we can map dish names to their main category (foods, drinks, desserts)
    const dishesSnapshot = await getDocs(collection(db, "dishes"));
    const dishCategoryMap = {};
    dishesSnapshot.forEach(docSnap => {
      const dish = docSnap.data();
      if (dish.name) {
        dishCategoryMap[dish.name.trim().toLowerCase()] = dish.category || "foods";
      }
    });

    const ordersSnapshot = await getDocs(collection(db, "orders"));
    const acceptedOrders = [];

    ordersSnapshot.forEach(docSnap => {
      const orderData = docSnap.data();
      // Only count orders that have been explicitly accepted[cite: 7]
      if (orderData.status === "accepted") {
        acceptedOrders.push(orderData);
      }
    });

    const visitorsSnapshot = await getDocs(collection(db, "analytics"));
    let visitorData = { daily: {}, monthly: {}, yearly: {}, totalCount: 0 };
    visitorsSnapshot.forEach(docSnap => {
      if (docSnap.id === "visitors") {
        visitorData = docSnap.data();
      }
    });

    document.getElementById("total-visitors-count").textContent = (visitorData.totalCount || 0).toLocaleString();
    document.getElementById("total-orders-count").textContent = acceptedOrders.length.toLocaleString();

    const filterMode = timeFilterSelect.value;

    const purchaseRevenueMap = {};
    const categoryItemCounts = {
      foods: {},
      drinks: {},
      desserts: {}
    };
    let grandTotalRevenue = 0;

    acceptedOrders.forEach(order => {
      let dateObj = order.createdAt ? new Date(order.createdAt) : new Date();
      if (isNaN(dateObj)) dateObj = new Date();

      let key = dateObj.toISOString().split("T")[0];
      if (filterMode === "month") {
        key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      } else if (filterMode === "year") {
        key = String(dateObj.getFullYear());
      }

      const orderTotal = Number(order.totalAmount) || 0;
      purchaseRevenueMap[key] = (purchaseRevenueMap[key] || 0) + orderTotal;
      grandTotalRevenue += orderTotal;

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const name = item.name || "Unknown Dish";
          const qty = item.quantity || 1;
          const lookupName = name.trim().toLowerCase();
          
          // Determine category based on Firestore dishes collection, default to 'foods'
          const cat = dishCategoryMap[lookupName] || "foods";
          if (categoryItemCounts[cat]) {
            categoryItemCounts[cat][name] = (categoryItemCounts[cat][name] || 0) + qty;
          }
        });
      }
    });

    // Extract top 3 items for each category
    const topDishes = [];
    Object.keys(categoryItemCounts).forEach(cat => {
      const sortedCatItems = Object.entries(categoryItemCounts[cat])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3); // Take top 3 per category
      
      sortedCatItems.forEach(([name, count]) => {
        topDishes.push({ name, count, category: cat });
      });
    });

    document.getElementById("total-revenue-value").textContent = `₱${grandTotalRevenue.toLocaleString()}`;

    renderPurchasesLineChart(purchaseRevenueMap);
    renderDishesPieChart(topDishes);
    renderVisitorsChart(visitorData, filterMode);

  } catch (error) {
    console.error("Error fetching analytics data from Firestore:", error);
  }
}

function renderPurchasesLineChart(purchaseMap) {
  const ctx = document.getElementById("purchasesChart").getContext("2d");
  const sortedKeys = Object.keys(purchaseMap).sort();
  const dataValues = sortedKeys.map(k => purchaseMap[k]);

  if (purchasesChartInstance) purchasesChartInstance.destroy();

  purchasesChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sortedKeys.length > 0 ? sortedKeys : ["No Data"],
      datasets: [{
        label: 'Total Purchases Amount (₱)',
        data: sortedKeys.length > 0 ? dataValues : [0],
        backgroundColor: 'rgba(232, 163, 23, 0.15)',
        borderColor: '#E8A317',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#E8A317',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { 
          ticks: { color: '#ffffff', font: { size: 10 } }, 
          grid: { color: 'rgba(255,255,255,0.08)' } 
        },
        y: { 
          ticks: { 
            color: '#ffffff', 
            font: { size: 10 },
            callback: function(value) { return '₱' + value.toLocaleString(); } 
          }, 
          grid: { color: 'rgba(255,255,255,0.08)' } 
        }
      },
      plugins: { 
        legend: { display: false }
      }
    }
  });
}

function renderDishesPieChart(topDishes) {
  const ctx = document.getElementById("dishesPieChart").getContext("2d");
  
  const labels = topDishes.map(item => `${item.name} (${item.category.toUpperCase()})`);
  const values = topDishes.map(item => item.count);

  // Generate strictly unique colors across the color wheel so no two slices share the same hue
  const backgroundColors = labels.map((_, index, arr) => {
    if (index === 0) {
      return '#E8A317'; // Absolute #1 top seller gets your signature Gold
    }
    const hue = Math.round((index / arr.length) * 360);
    return `hsl(${hue}, 75%, 52%)`;
  });

  if (dishesPieChartInstance) dishesPieChartInstance.destroy();

  dishesPieChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels.length > 0 ? labels : ["No Sales Recorded"],
      datasets: [{
        data: values.length > 0 ? values : [1],
        backgroundColor: labels.length > 0 ? backgroundColors : ['#E8A317'],
        borderWidth: 1,
        borderColor: '#0A1930'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { 
          position: 'bottom', 
          labels: { 
            color: '#ffffff', 
            boxWidth: 10, 
            font: { size: 9 } 
          } 
        } 
      }
    }
  });
}

function renderVisitorsChart(visitorData, filterMode) {
  const ctx = document.getElementById("visitorsChart").getContext("2d");
  let targetSource = visitorData.daily || {};
  if (filterMode === "month") targetSource = visitorData.monthly || {};
  if (filterMode === "year") targetSource = visitorData.yearly || {};

  const sortedKeys = Object.keys(targetSource).sort();
  const dataValues = sortedKeys.map(k => targetSource[k]);

  if (visitorsChartInstance) visitorsChartInstance.destroy();

  visitorsChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedKeys.length > 0 ? sortedKeys : ["No Traffic Data"],
      datasets: [{
        label: 'Visitor Traffic Count',
        data: sortedKeys.length > 0 ? dataValues : [0],
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
        borderWidth: 1,
        borderRadius: 4,
        maxBarThickness: 30
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: '#ffffff', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.08)' } },
        y: { ticks: { color: '#ffffff', precision: 0, font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.08)' } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

timeFilterSelect.addEventListener("change", fetchAndRenderDashboard);

fetchAndRenderDashboard();