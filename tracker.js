import "./firebase-config.js";
import { 
  getFirestore, 
  doc, 
  runTransaction 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const db = getFirestore();

export async function incrementVisitorCount(force = false) {
  // If not forced (like a login event), check session storage
  if (!force && sessionStorage.getItem("visited_this_session")) {
    console.log("Visitor already counted this session.");
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
    console.log("Visitor count successfully incremented!");
  } catch (err) {
    console.error("Error updating visitor count:", err);
  }
}

if (!sessionStorage.getItem("global_visit_recorded")) {
  sessionStorage.setItem("global_visit_recorded", "true");

}

// Automatically track normal page visits on load
incrementVisitorCount(false);
