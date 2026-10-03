const langData = {
    it: {
        title: "🚲 Bike Escape - Wedding Edition",
        subtitle: "Schiva gli ostacoli e arriva al matrimonio!",
        char: "1. Scegli il Personaggio:",
        city: "2. Scegli l'Ambientazione:",
        sposo: "🤵 Sposo", sposa: "👰 Sposa",
        play: "Gioca! 🚀", back: "⬅️ Torna all'Area Giochi",
        controls: "Usa le Frecce Sinistra / Destra della tastiera per muoverti.",
        over: "GAME OVER! Ti sei scontrato!",
        win: "CE L'HAI FATTA! Sei arrivato in tempo! 🎉",
        restart: "Clicca per rigiocare"
    },
    en: {
        title: "🚲 Bike Escape - Wedding Edition",
        subtitle: "Dodge the obstacles and reach the wedding!",
        char: "1. Choose your Character:",
        city: "2. Choose the Location:",
        sposo: "🤵 Groom", sposa: "👰 Bride",
        play: "Play! 🚀", back: "⬅️ Back to Games Area",
        controls: "Use Left / Right arrow keys on your keyboard to move.",
        over: "GAME OVER! You crashed!",
        win: "YOU MADE IT! You arrived in time! 🎉",
        restart: "Click to play again"
    }
};

let currentLang = localStorage.getItem('selectedLanguage') || 'it';
let activeChar = 'sposo';
let activeCity = 'milano';

function updateTexts() {
    const t = langData[currentLang];
    document.getElementById("game-title").innerText = t.title;
    document.getElementById("game-subtitle").innerText = t.subtitle;
    document.getElementById("label-char").innerText = t.char;
    document.getElementById("label-city").innerText = t.city;
    document.getElementById("btn-sposo").innerText = t.sposo;
    document.getElementById("btn-sposa").innerText = t.sposa;
    document.getElementById("btn-play").innerText = t.play;
    document.getElementById("link-back").innerText = t.back;
    document.getElementById("controls-text").innerText = t.controls;
}

function switchLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('selectedLanguage', lang);
    updateTexts();
}

function selectChar(char) {
    activeChar = char;
    document.getElementById("btn-sposo").classList.toggle("active", char === 'sposo');
    document.getElementById("btn-sposa").classList.toggle("active", char === 'sposa');
}

function selectCity(city) {
    activeCity = city;
    document.getElementById("btn-milano").classList.toggle("active", city === 'milano');
    document.getElementById("btn-barcellona").classList.toggle("active", city === 'barcellona');
}

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let gameInterval;
let isLooping = false;

let player = { x: 165, y: 430, width: 30, height: 50, emoji: '🤵' };
let obstacles = [];
let score = 0;
let targetScore = 1500; 
let gameOver = false;
let gameWon = false;

const obstaclesPool = {
    milano: ['🚶', '🐕', '🗑️', '🦔', '🚋'], 
    barcellona: ['🚶', '🐕', '🗑️', '🌴', '🛴'] 
};

function startGame() {
    document.getElementById("setup-screen").style.display = "none";
    document.getElementById("canvas-container").style.display = "block";
    
    player.emoji = activeChar === 'sposo' ? '🤵' : '👰';
    player.x = 165;
    obstacles = [];
    score = 0;
    gameOver = false;
    gameWon = false;

    if(!isLooping) {
        gameInterval = setInterval(updateGame, 20);
        isLooping = true;
    }
}

function updateGame() {
    if (gameOver || gameWon) return;

    ctx.fillStyle = activeCity === 'milano' ? '#9fb8ad' : '#ebd8b6'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(40, 0, 10, canvas.height);
    ctx.fillRect(canvas.width - 50, 0, 10, canvas.height);

    score += 2;

    if (score >= targetScore) {
        gameWon = true;
        drawEndScreen(langData[currentLang].win);
        return;
    }

    ctx.font = "30px Arial";
    ctx.fillText(player.emoji, player.x, player.y + 10);
    ctx.font = "20px Arial";
    ctx.fillText("🚲", player.x + 5, player.y + 38);

    if (Math.random() < 0.02) {
        const pool = obstaclesPool[activeCity];
        const randomEmoji = pool[Math.floor(Math.random() * pool.length)];
        obstacles.push({
            x: Math.random() * (canvas.width - 100) + 50,
            y: -40,
            width: 30,
            height: 30,
            emoji: randomEmoji,
            speed: Math.random() * 3 + 2
        });
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        let o = obstacles[i];
        o.y += o.speed; 

        ctx.font = "30px Arial";
        ctx.fillText(o.emoji, o.x, o.y + 25);

        if (player.x < o.x + o.width &&
            player.x + player.width > o.x &&
            player.y < o.y + o.height &&
            player.y + player.height > o.y) {
                gameOver = true;
                drawEndScreen(langData[currentLang].over);
        }

        if (o.y > canvas.height) {
            obstacles.splice(i, 1);
        }
    }

    ctx.fillStyle = "#333";
    ctx.font = "bold 14px sans-serif";
    const cityLabel = activeCity.charAt(0).toUpperCase() + activeCity.slice(1);
    ctx.fillText(`${cityLabel} - Dest: ${targetScore - score}m`, 15, 25);
}

function drawEndScreen(message) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "white";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#d4a373";
    ctx.fillText(langData[currentLang].restart, canvas.width / 2, canvas.height / 2 + 20);
    ctx.textAlign = "start"; 
}

function movePlayerLeft() {
    if (player.x > 50) player.x -= 25;
}

function movePlayerRight() {
    if (player.x < canvas.width - 80) player.x += 25;
}

window.addEventListener("keydown", function(e) {
    if (e.key === "ArrowLeft") movePlayerLeft();
    if (e.key === "ArrowRight") movePlayerRight();
});

canvas.addEventListener("click", function() {
    if (gameOver || gameWon) {
        document.getElementById("canvas-container").style.display = "none";
        document.getElementById("setup-screen").style.display = "flex";
    }
});

document.getElementById("lang-select").value = currentLang;
updateTexts();
