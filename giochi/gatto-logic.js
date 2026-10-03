const langData = {
    it: {
        title: "🐱 Cat Wedding Catcher",
        subtitle: "Aiuta il gattino a prendere le fedi ed evita i cetrioli!",
        play: "Inizia! 🚀", back: "⬅️ Torna all'Area Giochi",
        controls: "Muovi il mouse o usa le Frecce Sinistra / Destra per muoverti.",
        over: "Miao! Gioco Finito! 😿",
        win: "Urrà! Hai salvato il matrimonio! 🎉💍",
        restart: "Clicca sullo schermo per rigiocare",
        points: "Punti"
    },
    en: {
        title: "🐱 Cat Wedding Catcher",
        subtitle: "Help the kitty catch the rings and avoid cucumbers!",
        play: "Start! 🚀", back: "⬅️ Back to Games Area",
        controls: "Move your mouse or use Left / Right arrow keys to move.",
        over: "Meow! Game Over! 😿",
        win: "Hooray! You saved the wedding! 🎉💍",
        restart: "Click on the screen to play again",
        points: "Points"
    }
};

let currentLang = localStorage.getItem('selectedLanguage') || 'it';
const canvas = document.getElementById("catCanvas");
const ctx = canvas.getContext("2d");

let gameInterval;
let isPlaying = false;
let score = 0;
let gameOver = false;
let gameWon = false;

let cat = { x: 155, y: 430, width: 50, height: 50, emoji: '🐈‍⬛' }; // Puoi cambiarlo con un gatto 🐱 o 🐈
let items = [];

function updateTexts() {
    const t = langData[currentLang];
    document.getElementById("game-title").innerText = t.title;
    document.getElementById("game-subtitle").innerText = t.subtitle;
    document.getElementById("btn-play").innerText = t.play;
    document.getElementById("link-back").innerText = t.back;
    document.getElementById("controls-text").innerText = t.controls;
}

function startGame() {
    document.getElementById("setup-screen").style.display = "none";
    document.getElementById("canvas-container").style.display = "block";
    
    score = 0;
    gameOver = false;
    gameWon = false;
    items = [];
    cat.x = 155;

    if (!isPlaying) {
        gameInterval = setInterval(updateGame, 20);
        isPlaying = true;
    }
}

function updateGame() {
    if (gameOver || gameWon) return;

    // Sfondo rosa confetto romantico
    ctx.fillStyle = '#ffe5ec';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Disegna il gatto
    ctx.font = "45px Arial";
    ctx.fillText(cat.emoji, cat.x, cat.y + 40);

    // Generazione oggetti cadenti
    if (Math.random() < 0.03) {
        // 70% possibilità oggetti buoni, 30% cattivi (cetrioli)
        const isGood = Math.random() > 0.3;
        const emojis = isGood ? ['💍', '💖', '🔔'] : ['🥒', '🏺'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        
        items.push({
            x: Math.random() * (canvas.width - 40),
            y: -30,
            width: 30,
            height: 30,
            emoji: randomEmoji,
            isGood: isGood,
            speed: Math.random() * 2 + 3
        });
    }

    // Spostamento e controllo oggetti
    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        item.y += item.speed;

        // Disegna oggetto
        ctx.font = "30px Arial";
        ctx.fillText(item.emoji, item.x, item.y + 25);

        // Controllo collisione col gatto
        if (item.x < cat.x + cat.width &&
            item.x + item.width > cat.x &&
            item.y < cat.y + cat.height &&
            item.y + item.height > cat.y) {
            
            if (item.isGood) {
                score += item.emoji === '💍' ? 20 : 10; // Le fedi valgono di più!
                items.splice(i, 1);
                
                if (score >= 300) {
                    gameWon = true;
                    drawEndScreen(langData[currentLang].win);
                }
            } else {
                gameOver = true;
                drawEndScreen(langData[currentLang].over);
            }
            continue;
        }

        // Rimuovi se cade fuori dallo schermo
        if (item.y > canvas.height) {
            items.splice(i, 1);
        }
    }

    // Interfaccia punteggio
    ctx.fillStyle = "#6c757d";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(`${langData[currentLang].points}: ${score} / 300`, 15, 30);
}

function drawEndScreen(message) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "white";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#ffb3c1";
    ctx.fillText(langData[currentLang].restart, canvas.width / 2, canvas.height / 2 + 20);
    ctx.textAlign = "start";
}

// CONTROLLI
function moveLeft() { if (cat.x > 0) cat.x -= 30; }
function moveRight() { if (cat.x < canvas.width - 50) cat.x += 30; }

window.addEventListener("keydown", function(e) {
    if (e.key === "ArrowLeft") moveLeft();
    if (e.key === "ArrowRight") moveRight();
});

// Controllo con il mouse sul Canvas
canvas.addEventListener("mousemove", function(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    // Centra il gatto rispetto al mouse
    if (mouseX > 0 && mouseX < canvas.width) {
        cat.x = mouseX - cat.width / 2;
    }
});

canvas.addEventListener("click", function() {
    if (gameOver || gameWon) {
        document.getElementById("canvas-container").style.display = "none";
        document.getElementById("setup-screen").style.display = "block";
    }
});

updateTexts();
