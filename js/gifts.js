
document.documentElement.classList.add("js-enabled");

document.addEventListener("DOMContentLoaded", () => {

    const elements = document.querySelectorAll(".reveal");

    const observer = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.12
        }
    );

    elements.forEach((element) => {
        observer.observe(element);
    });

});

async function copyIban() {
    const ibanElement = document.getElementById("iban");
    const button = document.querySelector(".copy-iban");
    if (!ibanElement || !button) return;

    const iban = ibanElement.textContent.trim();
    const language = document.documentElement.lang || "it";
    const translations = window.weddingTranslations?.[language] || {};
    const originalText = button.textContent;

    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(iban);
        } else {
            // Clipboard API is unavailable on insecure origins and older browsers.
            const field = document.createElement("textarea");
            field.value = iban;
            field.setAttribute("readonly", "");
            field.style.position = "fixed";
            field.style.opacity = "0";
            document.body.appendChild(field);
            field.select();
            const copied = document.execCommand("copy");
            field.remove();
            if (!copied) throw new Error("Copy command failed");
        }

        button.textContent = translations.gifts_copy_success || "IBAN copiato! ✓";
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    } catch {
        alert(translations.gifts_copy_error || "Non è stato possibile copiare l'IBAN.");
    }
}
