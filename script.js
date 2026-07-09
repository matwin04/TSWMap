// map.js
let map;
let geojsonLayer; //Loads geojson exported from OverpassTurbo
const vehicleMarkers = {};
let playerMarker;
let currentSpeed = 0;
const KEY = "r17+yo5amdMvudbeGqE1Wm4h+vAu9s8Dt0JavINp8mg=";
/**
 * -----------------------------------
 * MAP
 * -----------------------------------
 */
function initMap() {
    map = L.map("map").setView([33.98, -118.25], 10);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; OpenStreetMap contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20
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
    const url = "http://localhost:31270/get/CurrentDrivableActor.Function.HUD_GetSpeed";
    const options = {
        method: "GET",
        headers: { dtgcommkey: KEY }
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
            trackMaxSpeed,
            gradient,
            bSignalIsPermissive,
            currentSpeedLimitSource,
            nextSpeedLimit,
            distanceToNextSpeedLimit,
            nextSignals
        } = data.Values;

        const aspect = signalAspectClass || "Unknown";
        const distanceKm = (distanceToSignal / 1000).toFixed(2);
        const limitKmh = speedLimit?.value ? (speedLimit.value * 3.6).toFixed(0) : "--";
        const trackMaxKmh = trackMaxSpeed?.value && trackMaxSpeed.value < 1e6
            ? (trackMaxSpeed.value * 3.6).toFixed(0)
            : "--";

        const aspectEl = document.querySelector("#signal-display .aspect");
        aspectEl.textContent = aspect + (bSignalIsPermissive ? " (Permissive)" : "");
        aspectEl.className = "aspect " + (aspect === "Stop" ? "aspect-stop" : "aspect-clear");

        document.querySelector("#signal-display .distance").textContent = `${distanceKm} km`;
        document.querySelector("#signal-display .limit").textContent = `${limitKmh} km/h`;
        document.querySelector("#signal-display .track-max").textContent = `${trackMaxKmh} km/h`;

        // ---- Gradient ----
        const gradientPct = ((gradient || 0) * 100).toFixed(1);
        const gradientEl = document.querySelector("#route-display .gradient");
        gradientEl.textContent = `${gradientPct > 0 ? "+" : ""}${gradientPct}%`;
        gradientEl.className = "gradient " + (gradient > 0 ? "grade-up" : gradient < 0 ? "grade-down" : "");

        // ---- Speed limit source ----
        document.querySelector("#route-display .limit-source").textContent =
            currentSpeedLimitSource || "Unknown";

        // ---- Next speed limit ----
        const nextLimitKmh = nextSpeedLimit?.value ? (nextSpeedLimit.value * 3.6).toFixed(0) : "--";
        const nextLimitDistKm = distanceToNextSpeedLimit ? (distanceToNextSpeedLimit / 1000).toFixed(2) : "--";
        document.querySelector("#route-display .next-limit").textContent =
            nextLimitKmh !== "--" && nextLimitKmh !== "0" ? `${nextLimitKmh} km/h in ${nextLimitDistKm} km` : "None";

        // ---- Next signal preview ----
        const upcoming = nextSignals?.[0];
        const nextSigEl = document.querySelector("#route-display .next-signal");
        if (upcoming) {
            const distKm = (upcoming.distanceToNextSignal / 1000).toFixed(2);
            nextSigEl.textContent = `${upcoming.value} in ${distKm} km`;
            nextSigEl.className = "next-signal " + (upcoming.value === "Stop" ? "aspect-stop" : "aspect-clear");
        } else {
            nextSigEl.textContent = "None";
            nextSigEl.className = "next-signal";
        }
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
