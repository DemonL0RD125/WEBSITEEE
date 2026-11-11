import "./firebase-config.js";
import { 
  getFirestore, 
  doc, 
  runTransaction 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const db = getFirestore();

export async function incrementVisitorCount() {
  const COOLDOWN_TIME = 60 * 60 * 1000; // 1 hour cooldown per visitor
  const lastVisit = localStorage.getItem("dg_last_visit_timestamp");
  const nowTime = Date.now();

  // If this browser already counted a visit within the last hour, stop right here
  if (lastVisit && (nowTime - Number(lastVisit) < COOLDOWN_TIME)) {
    console.log("Visitor already counted recently within this hour.");
    return;
  }

  // Instantly lock it in localStorage so concurrent script loads fail the check
  localStorage.setItem("dg_last_visit_timestamp", nowTime.toString());

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

    console.log("Visitor count successfully incremented by 1!");
  } catch (err) {
    console.error("Error updating visitor count:", err);
    // Remove lock if network fails so they can retry later
    localStorage.removeItem("dg_last_visit_timestamp");
  }
}

// Automatically trigger tracking once
incrementVisitorCount();
