// map.js
let map;
let geojsonLayer; //Loads geojson exported from OverpassTurbo
const vehicleMarkers = {};
let playerMarker;
let currentSpeed = 0;
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
    loadSpeed();
    loadSignal();
    setInterval(loadPlayer, 1000);
    setInterval(loadSpeed, 1000);
    setInterval(loadSignal, 1000);
    //setInterval(loadVehicles, 15000);
}
async function loadSpeed() {
    const url = 'http://localhost:31270/get/CurrentDrivableActor.Function.HUD_GetSpeed';
    const options = {
        method: 'GET',
        headers: {dtgcommkey: 'r17+yo5amdMvudbeGqE1Wm4h+vAu9s8Dt0JavINp8mg='}
    };
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        if (data.Result !== "Success" || data.Values?.["Speed (ms)"] === undefined) return;
        currentSpeed = data.Values["Speed (ms)"] * 3.6; // m/s -> km/h
        document.querySelector("#speed-display .value").textContent = currentSpeed.toFixed(0);
    } catch (err) {
        console.error("Failed to load speed:", err);
    }
}
async function loadSignal() {
    const url = 'http://localhost:31270/get/DriverAid.Data';
    const options = {
        method: 'GET',
        headers: {dtgcommkey: 'r17+yo5amdMvudbeGqE1Wm4h+vAu9s8Dt0JavINp8mg='}
    };
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        if (data.Result !== "Success" || !data.Values) return;
        const {
            signalAspectClass,
            distanceToSignal,
            speedLimit,
            trackMaxSpeed
        } = data.Values;

        const aspect = signalAspectClass || "Unknown";
        const distanceKm = (distanceToSignal / 1000).toFixed(2);
        const limitKmh = speedLimit?.value ? (speedLimit.value * 3.6).toFixed(0) : "--";
        const trackMaxKmh = trackMaxSpeed?.value && trackMaxSpeed.value < 1e6
            ? (trackMaxSpeed.value * 3.6).toFixed(0)
            : "--";

        const aspectEl = document.querySelector("#signal-display .aspect");
        aspectEl.textContent = aspect;
        aspectEl.className = "aspect " + (aspect === "Stop" ? "aspect-stop" : "aspect-clear");

        document.querySelector("#signal-display .distance").textContent = `${distanceKm} km`;
        document.querySelector("#signal-display .limit").textContent = `${limitKmh} km/h`;
        document.querySelector("#signal-display .track-max").textContent = `${trackMaxKmh} km/h`;
    } catch (err) {
        console.error("Failed to load signal data:", err);
    }
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