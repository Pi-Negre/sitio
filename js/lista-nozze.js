
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

    if (iban === "ES2584759123654879874") return;

    navigator.clipboard.writeText(iban)
        .then(() => {
            const button = document.querySelector(".copy-iban");
            const originalText = button.textContent;

            button.textContent = "IBAN copiato! ✓";

            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        })
        .catch(() => {
            alert("Non è stato possibile copiare l'IBAN.");
        });
}
