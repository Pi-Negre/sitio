// Paste the deployed Google Apps Script /exec URL here to enable RSVP submissions.
        const RSVP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx0jAJ3EqsdIt_wEyQf3s-CM9SGQ7Xm51rfMruCpFllTc3dzXqG8Xw0hgTp4KWnVcdwhQ/exec";

        (function () {
            const form = document.getElementById("rsvp-form");
            const status = document.getElementById("form-status");
            let language = localStorage.getItem("wedding-language") || localStorage.getItem("selectedLanguage") || "it";
            const messages = { sending: "form_sending", ok: "form_success", error: "form_error", config: "form_config" };
            const say = (key, cls) => {
                status.className = "form-status " + (cls || "");
                status.textContent = window.weddingTranslations?.[language]?.[messages[key]] || "";
            };
            document.addEventListener("languageChanged", event => { language = event.detail.language; });

            form.addEventListener("submit", async (e) => {
                e.preventDefault();
                if (!RSVP_SCRIPT_URL) { say("config", "err"); return; }
                const f = new FormData(form);
                const btn = form.querySelector("button[type=submit]");
                btn.disabled = true; say("sending");
                try {
                    await fetch(RSVP_SCRIPT_URL, {
                        method: "POST", mode: "no-cors", cache: "no-cache",
                        headers: { "Content-Type": "text/plain;charset=utf-8" },
                        body: JSON.stringify({ nome: f.get("nome"), email: f.get("email"), presenza: f.get("presenza"), note: f.get("note"), website: f.get("website") })
                    });
                    form.reset(); say("ok", "ok");
                } catch (err) { say("error", "err"); }
                btn.disabled = false;
            });
        })();

        // Generate the wheat stalks that sway in the hero scene.
        (function () {
            const box = document.querySelector(".wheat"); if (!box) return;
            const n = Math.round(innerWidth / 34); let html = "";
            for (let i = 0; i < n; i++) {
                const hgt = 70 + Math.random() * 90, left = (i / n) * 100 + Math.random() * 1.5;
                html += `<svg class="stalk" viewBox="0 0 24 120" style="left:${left}%;height:${hgt}px;width:${hgt * 0.2}px;opacity:${0.75 + Math.random() * 0.25};animation-duration:${3 + Math.random() * 3}s;animation-delay:${-Math.random() * 5}s"><use href="#ear"/></svg>`;
            }
            box.innerHTML = html;
        })();

        // Reveal content as it enters view and add a shadow to the navbar on scroll.
        (function () {
            const nav = document.querySelector(".navbar");
            const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 10);
            addEventListener("scroll", onScroll, { passive: true }); onScroll();

            if (!("IntersectionObserver" in window)) return;
            const els = document.querySelectorAll(".container h2, .container > p, .card, .rsvp-form");
            document.querySelectorAll(".grid").forEach(g => [...g.children].forEach((c, i) => c.style.setProperty("--d", i * 0.15 + "s")));
            const io = new IntersectionObserver((entries) => entries.forEach(en => {
                if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
            }), { threshold: 0.15 });
            els.forEach(el => { el.classList.add("reveal"); io.observe(el); });
        })();
