// Fade the page out before navigating to another page.
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    document.querySelectorAll("a[href]").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (
          reduceMotion ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0 ||
          link.target === "_blank"
        ) {
          return;
        }

        event.preventDefault();
        document.body.classList.add("leaving");

        setTimeout(() => {
          window.location.href = link.href;
        }, 300);
      });
    });

    window.addEventListener("pageshow", () => {
      document.body.classList.remove("leaving");
    });
