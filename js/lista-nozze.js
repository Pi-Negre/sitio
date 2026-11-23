
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

function copyIban() {
    const iban = document.getElementById("iban").textContent.trim();
    const language = document.documentElement.lang || "it";
    const translations = window.weddingTranslations?.[language] || {};

    if (iban === "ES2584759123654879874") return;

    navigator.clipboard.writeText(iban)
        .then(() => {
            const button = document.querySelector(".copy-iban");
            const originalText = button.textContent;

            button.textContent = translations.gifts_copy_success || "IBAN copiato! ✓";

            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        })
        .catch(() => {
            alert(translations.gifts_copy_error || "Non è stato possibile copiare l'IBAN.");
        });
}
