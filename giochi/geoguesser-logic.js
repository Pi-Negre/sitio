// Replace this value with the deployed Google Apps Script URL; keep the quotation marks.
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwZL04nemGa7zkFajxKMpCO2LuzLCNIRHSInqbhMg1I8uwVy9hgy00wB3ocT1q7a63E/exec";

const T = () => window.weddingTranslations[currentLang].geo;

const tappe = [
    { foto: "../assets/images/tappa1.jpeg", lat: 45.491706516674256, lng: 9.1530605076123 },
    { foto: "../assets/images/tappa2.jpeg", lat: 41.42492065563975, lng: 2.185793910563726 },
    { foto: "../assets/images/tappa3.jpeg", lat: 37.445704140675474, lng: 24.94366071688098 },
    { foto: "../assets/images/tappa4.jpeg", lat: 40.5824, lng: -0.2185 },
    { foto: "../assets/images/tappa5.jpeg", lat: 46.57378272007491, lng: 8.988843794065533 },
    { foto: "../assets/images/tappa6.jpeg", lat: 47.4979, lng: 19.0402 },
    { foto: "../assets/images/tappa7.jpeg", lat: 46.42629399216806, lng: 8.307930134573258 }
];

let currentStage = 0, currentLang = 'it';
let map, userMarker, realMarker, polyline, selectedLat = null, selectedLng = null, hasGuessed = false, totalDistance = 0, gameOverState = false, playerName = "";

function updateTexts() {
    const t = T();
    document.getElementById("game-title").innerText = t.title;
    document.title = t.documentTitle;
    document.getElementById("game-subtitle").innerText = t.subtitle;
    document.getElementById("link-back").innerText = t.back;
    document.getElementById("name-instruction").innerText = t.nameInstruction;
    document.getElementById("btn-start-label").innerText = t.btnStart;
    document.getElementById("th-name").innerText = t.thName;
    document.getElementById("th-score").innerText = t.thScore;
    document.getElementById("th-position").innerText = t.position;
    document.getElementById("leaderboard-title").innerText = t.boardTitle;
    document.getElementById("player-name-input").placeholder = t.namePlaceholder;
    document.getElementById("current-photo").alt = t.photoAlt;
    document.getElementById("loading-text").innerText = t.loading;
    document.documentElement.lang = currentLang;
    if (!gameOverState) {
        document.getElementById("progress-text").innerText = t.progress.replace("{current}", currentStage + 1).replace("{total}", tappe.length);
        document.getElementById("action-btn").innerText = !hasGuessed ? t.btnCheck : (currentStage === tappe.length - 1 ? t.btnFinish : t.btnNext);
    } else {
        document.getElementById("distance-result").innerHTML = t.finalScore.replace("{total}", totalDistance);
    }
}

function startActualGame() {
    const input = document.getElementById("player-name-input").value.trim();
    if (input === "") { alert(T().nameAlert); return; }
    playerName = input;
    document.getElementById("name-zone").style.display = "none";
    document.getElementById("game-zone").style.display = "block";
    
    initMap();
    setTimeout(() => map.invalidateSize(), 100);
    document.getElementById("current-photo").src = tappe[currentStage].foto;
}

function initMap() {
    map = L.map('map').setView([44.0, 12.0], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
    map.on('click', function(e) {
        if (hasGuessed) return;
        selectedLat = e.latlng.lat; selectedLng = e.latlng.lng;
        if (userMarker) userMarker.setLatLng(e.latlng); else userMarker = L.marker(e.latlng).addTo(map);
    });
}

function handleButtonClick() {
    const t = T();
    if (!hasGuessed) {
        if (selectedLat === null) { alert(t.mapClick); return; }
        hasGuessed = true; const reale = tappe[currentStage];
        const d = calculateDistance(selectedLat, selectedLng, reale.lat, reale.lng);
        totalDistance += Math.round(d);
        
        realMarker = L.marker([reale.lat, reale.lng], { icon: L.divIcon({className: 'real-point', html: '📍', iconSize: [30,30], iconAnchor: [15, 30]}) }).addTo(map);
        polyline = L.polyline([[selectedLat, selectedLng], [reale.lat, reale.lng]], {color: '#c8432f', dashArray: '5, 10'}).addTo(map);
        const group = new L.featureGroup([userMarker, realMarker]); map.fitBounds(group.getBounds().pad(0.2));
        
        document.getElementById("distance-result").innerHTML = t.distText.replace("{dist}", Math.round(d));
        document.getElementById("anecdote-text").innerText = T().anecdotes[currentStage];
        document.getElementById("result-box").style.display = "block";
        document.getElementById("action-btn").innerText = (currentStage === tappe.length - 1) ? t.btnFinish : t.btnNext;
    } else {
        if (currentStage < tappe.length - 1) {
            currentStage++; resetStageForNext();
        } else {
            gameOverState = true; document.getElementById("progress-text").style.display = "none"; document.getElementById("game-layout").style.display = "none"; document.getElementById("action-btn").style.display = "none";
            document.getElementById("distance-result").innerHTML = t.finalScore.replace("{total}", totalDistance);
            document.getElementById("anecdote-text").style.display = "none"; document.getElementById("leaderboard-zone").style.display = "block";
            salvaPunteggioSuGoogleSheet(playerName, totalDistance);
        }
    }
}

function resetStageForNext() {
    hasGuessed = false; selectedLat = null; selectedLng = null;
    if(userMarker) { map.removeLayer(userMarker); userMarker = null; }
    if(realMarker) { map.removeLayer(realMarker); realMarker = null; }
    if(polyline) { map.removeLayer(polyline); polyline = null; }
    map.setView([44.0, 12.0], 4);
    document.getElementById("current-photo").src = tappe[currentStage].foto;
    document.getElementById("result-box").style.display = "none"; 
    updateTexts();
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's mean radius in kilometres.
    const dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function salvaPunteggioSuGoogleSheet(nomeInvitato, kmTotali) {
    if (!GOOGLE_SCRIPT_URL) { document.getElementById("leaderboard-body").textContent = T().missingUrl; return; }
    fetch(GOOGLE_SCRIPT_URL, { method: "POST", mode: "no-cors", cache: "no-cache", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ nome: nomeInvitato, punteggio: kmTotali }) })
    .then(() => { setTimeout(caricaClassificaDaGoogleSheet, 1000); })
    .catch(() => { caricaClassificaDaGoogleSheet(); });
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function caricaClassificaDaGoogleSheet() {
    const tbody = document.getElementById("leaderboard-body");
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">${T().loading}</td></tr>`;
    fetch(GOOGLE_SCRIPT_URL).then(r => r.json()).then(data => {
        tbody.innerHTML = "";
        if (!Array.isArray(data) || data.length === 0) { tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">${T().empty}</td></tr>`; return; }
        data.forEach((row, idx) => { tbody.innerHTML += `<tr><td><strong>${idx + 1}</strong></td><td>${escapeHtml(row.nome)}</td><td>${escapeHtml(row.punteggio)} km</td></tr>`; });
    }).catch(() => { tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">${T().error}</td></tr>`; });
}

document.addEventListener("languageChanged", event => {
    currentLang = event.detail.language;
    updateTexts();
    if (hasGuessed && !gameOverState) document.getElementById("anecdote-text").innerText = T().anecdotes[currentStage];
});
window.weddingLanguageReady.then(({ language }) => { currentLang = language; updateTexts(); });
