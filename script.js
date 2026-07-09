// map.js
let map;
let geojsonLayer; //Loads geojson exported from OverpassTurbo
const vehicleMarkers = {};
let playerMarker;
/**
 * -----------------------------------
 * MAP
 * -----------------------------------
 */
function initMap() {
    map = L.map("map").setView([33.98, -118.25], 10);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);
    //loadVehicles();
    //loadGeoJSON();
    loadPlayer();
    //setInterval(loadVehicles, 15000);
    //setInterval(loadPlayer, 15000);
}

async function loadPlayer() {
    try {
        const response = await fetch("http://localhost:31270/get/DriverAid.PlayerInfo", {
            headers: { dtgcommkey: "r17+yo5amdMvudbeGqE1Wm4h+vAu9s8Dt0JavINp8mg=" }
        });
        const data = await response.json();
        if (data.Result !== "Success" || !data.Values?.geoLocation) return;

        const { geoLocation, playerProfileName, cameraMode, currentServiceName } = data.Values;
        const lat = geoLocation.latitude;
        const lon = geoLocation.longitude;
        const popupHTML = `
        <div class="popup-title">
          ${playerProfileName || "Player"}
        </div>
        <b>Service:</b> ${currentServiceName || "Unknown"}<br>
        <b>Camera Mode:</b> ${cameraMode || "Unknown"}
      `;

        if (playerMarker) {
            playerMarker.setLatLng([lat, lon]).setPopupContent(popupHTML);
        } else {
            playerMarker = L.circleMarker([lat, lon], {
                radius: 8,
                weight: 2,
                color: "#ffffff",
                fillColor: "#e91e63",
                fillOpacity: 1
            })
                .addTo(map)
                .bindPopup(popupHTML);
        }

        map.setView([lat, lon], map.getZoom());
    } catch (err) {
        console.error("Failed to load player position:", err);
    }
}
/**
 * -----------------------------------
 * START MAP
 * -----------------------------------
 */
document.addEventListener("DOMContentLoaded", () => {
    initMap();
});
