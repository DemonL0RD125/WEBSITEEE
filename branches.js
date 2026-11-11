const branches = [
  { name: "Manila Branch", region: "Luzon", lat: 14.5995, lng: 120.9842 },
  { name: "Baguio Branch", region: "Luzon", lat: 16.4023, lng: 120.596 },
  { name: "Laoag Branch", region: "Luzon", lat: 18.1978, lng: 120.5936 },
  { name: "Legazpi Branch", region: "Luzon", lat: 13.1391, lng: 123.7438 },

  { name: "Himamaylan Branch", region: "Visayas", lat: 10.0997, lng: 122.8697 },
  { name: "Cebu Branch", region: "Visayas", lat: 10.3157, lng: 123.8854 },
  { name: "Tacloban Branch", region: "Visayas", lat: 11.2543, lng: 124.9632 },

  { name: "Davao Branch", region: "Mindanao", lat: 7.1907, lng: 125.4553 },
  { name: "Cagayan de Oro Branch", region: "Mindanao", lat: 8.4542, lng: 124.6319 },
  { name: "Zamboanga Branch", region: "Mindanao", lat: 6.9214, lng: 122.079 }
];

const regions = ["Luzon", "Visayas", "Mindanao"];
const toggle = document.getElementById("map-toggle");
const mapSection = document.getElementById("map-section");
const list = document.getElementById("branch-list");

let map = null;
const markers = {};

const pinIcon = L.divIcon({
  className: "pin",
  html: '<svg viewBox="0 0 24 32" width="30" height="40"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="#E8A317" stroke="#0A1930" stroke-width="1.5"/><circle cx="12" cy="12" r="4.5" fill="#0A1930"/></svg>',
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -36]
});

function buildList() {
  let html = "";

  regions.forEach(function (region) {
    html += '<h3 class="region-title">' + region + "</h3>";

    branches.forEach(function (b, i) {
      if (b.region === region) {
        html += '<button type="button" data-index="' + i + '" class="branch-btn">' + b.name + "</button>";
      }
    });
  });

  list.innerHTML = html;
}

function initMap() {
  map = L.map("map", { scrollWheelZoom: false }).setView([12.8797, 121.774], 6);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  branches.forEach(function (b, i) {
    const marker = L.marker([b.lat, b.lng], { icon: pinIcon }).addTo(map);
    marker.bindPopup("<strong>DG's Restaurant</strong><br>" + b.name + "<br>" + b.region + "<br>Mon - Sat: 7:00 AM to 12:00 AM");
    markers[i] = marker;
  });

  buildList();
}

toggle.addEventListener("click", function () {
  const isHidden = mapSection.classList.toggle("hidden");

  if (isHidden) {
    toggle.textContent = "View Branch Map";
    return;
  }

  toggle.textContent = "Hide Branch Map";

  if (!map) {
    initMap();
  }

  map.invalidateSize();
  map.fitBounds(branches.map(function (b) { return [b.lat, b.lng]; }), { padding: [40, 40] });
  mapSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

list.addEventListener("click", function (e) {
  const btn = e.target.closest(".branch-btn");
  if (!btn) return;

  const b = branches[btn.dataset.index];
  map.flyTo([b.lat, b.lng], 10);
  markers[btn.dataset.index].openPopup();
});