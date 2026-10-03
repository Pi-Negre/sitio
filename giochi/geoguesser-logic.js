// ⚠️ IMPORTANTE: Sostituisci questo testo con il tuo URL reale di Google Apps Script (lascia le virgolette)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzeRf5-HyXYqula6r3t03VkgZYcjIQk30gxEtbVG9rXDeGiOOUm7nK7dBZTkMhr8GV8/exec";

const langData = {
    it: {
        title: "🗺️ Wedding GeoGuesser", subtitle: "Indovina dove abbiamo scattato questa foto!", progress: "Tappa {current} di {total}", btnCheck: "Invia Risposta 📍", btnNext: "Prossima Tappa ➡️", btnFinish: "Risultato Finale 🎉", back: "⬅️ Torna all'Area Giochi", distText: "La tua scelta dista <strong>{dist} km</strong> dal punto reale.", finalScore: "Gioco Terminato! Errore totale: <strong>{total} km</strong>. Meno km fai, più ci conosci! 😉", nameAlert: "Inserisci il tuo nome!", nameInstruction: "Inserisci il tuo nome e cognome per iniziare:", btnStart: "Inizia il Gioco 🚀", thName: "Invitato", thScore: "Errore Totale", boardTitle: "🏆 Top 10 Classifica", loading: "Caricamento classifica..."
    },
    en: {
        title: "🗺️ Wedding GeoGuesser", subtitle: "Guess where this photo was taken!", progress: "Stage {current} of {total}", btnCheck: "Submit Guess 📍", btnNext: "Next Stage ➡️", btnFinish: "See Final Results 🎉", back: "⬅️ Back to Games Area", distText: "Your guess is <strong>{dist} km</strong> away from the location.", finalScore: "Game Over! Total accumulated error: <strong>{total} km</strong>. Lower is better! 😉", nameAlert: "Please enter your name!", nameInstruction: "Enter your first and last name to start:", btnStart: "Start Game 🚀", thName: "Guest", thScore: "Total Error", boardTitle: "🏆 Top 10 Leaderboard", loading: "Loading leaderboard..."
    }
};

const tappe = [
    { foto: "assets/tappa1.jpg", lat: 45.4642, lng: 9.1900, it: "Milano! La nostra città natale, dove si può mangiare il miglior gelato e la migliore pizza.", en: "Milan! Our hometown, where you can eat the best ice cream and the best pizza." },
    { foto: "assets/tappa2.jpg", lat: 41.3851, lng: 2.1734, it: "Barcellona! Dove abbiamo vissuto negli ultimi anni e dove abbiamo trovato una seconda casa.", en: "Barcelona! Where we have lived for the past few years and where we found a second home." },
    { foto: "assets/tappa3.jpg", lat: 37.4467, lng: 24.9427, it: "Syros! Un paradiso delle Cicladi, unica isola greca in cui si trovi una Lidl.", en: "Syros! A paradise in the Cyclades, and the only Greek island where you can actually find a Lidl." },
    { foto: "assets/tappa4.jpg", lat: 40.5824, lng: -0.2185, it: "Cinctorres! Dove abbiamo visto la nostra prima eclissi totale. Ci sono anche i dinosauri.", en: "Cinctorres! Where we saw our very first total solar eclipse. There are also dinosaurs here." },
    { foto: "assets/tappa5.jpg", lat: 46.5332, lng: 8.9392, it: "Olivone! Tra le maestose montagne svizzere, dove si può trovare la pace e la gioia.", en: "Olivone! Among the majestic Swiss mountains, where you can find peace and joy." },
    { foto: "assets/tappa6.jpg", lat: 47.4979, lng: 19.0402, it: "Budapest! Ci siamo passati per solo otto ore... È carina.", en: "Budapest! We only stopped by for eight hours... It's nice." },
    { foto: "assets/tappa7.jpg", lat: 46.4344, lng: 8.3294, it: "Il Blinnenhorn! Dove abbiamo deciso di sposarci.", en: "The Blinnenhorn! Where we decided to get married." }
];

let currentStage = 0, currentLang = localStorage.getItem('selectedLanguage') || 'it';
let map, userMarker, realMarker, polyline, selectedLat = null, selectedLng = null, hasGuessed = false, totalDistance = 0, gameOverState = false, playerName = "";

function updateTexts() {
    const t = langData[currentLang];
    document.getElementById("game-title").innerText = t.title;
    document.getElementById("game-subtitle").innerText = t.subtitle;
    document.getElementById("link-back").innerText = t.back;
    document.getElementById("name-instruction").innerText = t.nameInstruction;
    document.getElementById("btn-start-label").innerText = t.btnStart;
    document.getElementById("th-name").innerText = t.thName;
    document.getElementById("th-score").innerText = t.thScore;
    document.getElementById("leaderboard-title").innerText = t.boardTitle;
    if (!gameOverState) {
        document.getElementById("progress-text").innerText = t.progress.replace("{current}", currentStage + 1).replace("{total}", tappe.length);
        document.getElementById("action-btn").innerText = !hasGuessed ? t.btnCheck : (currentStage === tappe.length - 1 ? t.btnFinish : t.btnNext);
    }
}

function switchLanguage(lang) {
    currentLang = lang; localStorage.setItem('selectedLanguage', lang); updateTexts();
    if(hasGuessed && !gameOverState) document.getElementById("anecdote-text").innerText = tappe[currentStage][currentLang];
}

function startActualGame() {
    const input = document.getElementById("player-name-input").value.trim();
    if (input === "") { alert(langData[currentLang].nameAlert); return; }
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
    const t = langData[currentLang];
    if (!hasGuessed) {
        if (selectedLat === null) { alert(currentLang === 'it' ? "Clicca sulla mappa!" : "Click on the map!"); return; }
        hasGuessed = true; const reale = tappe[currentStage];
        const d = calculateDistance(selectedLat, selectedLng, reale.lat, reale.lng);
        totalDistance += Math.round(d);
        
        realMarker = L.marker([reale.lat, reale.lng], { icon: L.divIcon({className: 'real-point', html: '📍', iconSize: [30,30], iconAnchor: [15, 30]}) }).addTo(map);
        polyline = L.polyline([[selectedLat, selectedLng], [reale.lat, reale.lng]], {color: '#d4a373', dashArray: '5, 10'}).addTo(map);
        const group = new L.featureGroup([userMarker, realMarker]); map.fitBounds(group.getBounds().pad(0.2));
        
        document.getElementById("distance-result").innerHTML = t.distText.replace("{dist}", Math.round(d));
        document.getElementById("anecdote-text").innerText = reale[currentLang];
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
    const R = 6371; // Raggio terrestre in km
    const dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function salvaPunteggioSuGoogleSheet(nomeInvitato, kmTotali) {
    if (!GOOGLE_SCRIPT_URL) { document.getElementById("leaderboard-body").innerHTML = `<tr><td colspan="3">Database URL missing.</td></tr>`; return; }
    fetch(GOOGLE_SCRIPT_URL, { method: "POST", mode: "no-cors", cache: "no-cache", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ nome: nomeInvitato, punteggio: kmTotali }) })
    .then(() => { setTimeout(caricaClassificaDaGoogleSheet, 1000); })
    .catch(() => { caricaClassificaDaGoogleSheet(); });
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function caricaClassificaDaGoogleSheet() {
    const tbody = document.getElementById("leaderboard-body");
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">${langData[currentLang].loading}</td></tr>`;
    fetch(GOOGLE_SCRIPT_URL).then(r => r.json()).then(data => {
        tbody.innerHTML = "";
        if (!Array.isArray(data) || data.length === 0) { tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No scores.</td></tr>`; return; }
        data.forEach((row, idx) => { tbody.innerHTML += `<tr><td><strong>${idx + 1}</strong></td><td>${escapeHtml(row.nome)}</td><td>${escapeHtml(row.punteggio)} km</td></tr>`; });
    }).catch(() => { tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Error loading.</td></tr>`; });
}

document.getElementById("lang-select").value = currentLang;
updateTexts();