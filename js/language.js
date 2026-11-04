
const LANGUAGE_KEY = "wedding-language";
const LEGACY_LANGUAGE_KEY = "selectedLanguage";
const DEFAULT_LANGUAGE = "it";
const SUPPORTED_LANGUAGES = ["it", "en"];

let translations = {};

async function initLanguage() {
  const script = document.querySelector('script[data-language-file]');
  const languageFile = script?.dataset.languageFile || "lang.json";

  try {
    const response = await fetch(languageFile);

    if (!response.ok) {
      throw new Error(`Unable to load ${languageFile}: ${response.status}`);
    }

    translations = await response.json();
    window.weddingTranslations = translations;

    // Read the current preference, falling back to the key used by older game pages.
    const oldLanguage = localStorage.getItem(LEGACY_LANGUAGE_KEY);
    const savedLanguage = localStorage.getItem(LANGUAGE_KEY) || oldLanguage;

    const initialLanguage = isSupported(savedLanguage)
      ? savedLanguage
      : DEFAULT_LANGUAGE;

    applyLanguage(initialLanguage);

    // Move the saved preference to the shared key after reading the legacy key.
    localStorage.setItem(LANGUAGE_KEY, initialLanguage);
    localStorage.removeItem(LEGACY_LANGUAGE_KEY);

    document.querySelectorAll("#lang-select").forEach((selector) => {
      selector.value = initialLanguage;
      selector.addEventListener("change", () => setWeddingLanguage(selector.value));
    });

    return { language: initialLanguage, translations };
  } catch (error) {
    console.error("Language initialization failed:", error);
    return { language: DEFAULT_LANGUAGE, translations: {} };
  }
}

function isSupported(language) {
  return (
    SUPPORTED_LANGUAGES.includes(language) &&
    translations[language] !== undefined
  );
}

function applyLanguage(language) {
  const dictionary = translations[language];

  if (!dictionary) return;

  document.documentElement.lang = language;

  // Translate regular text.
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;

    if (dictionary[key] !== undefined) {
      element.textContent = dictionary[key];
    }
  });

  // Translate input placeholders.
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder;

    if (dictionary[key] !== undefined) {
      element.placeholder = dictionary[key];
    }
  });

  // Translate accessibility labels.
  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    const key = element.dataset.i18nAriaLabel;

    if (dictionary[key] !== undefined) {
      element.setAttribute("aria-label", dictionary[key]);
    }
  });

  // Translate metadata used by browser previews and search results.
  document.querySelectorAll("[data-i18n-content]").forEach((element) => {
    const key = element.dataset.i18nContent;

    if (dictionary[key] !== undefined) {
      element.setAttribute("content", dictionary[key]);
    }
  });

  // Translate document title.
  const titleElement = document.querySelector("[data-i18n-title]");

  if (titleElement) {
    const key = titleElement.dataset.i18nTitle;

    if (dictionary[key] !== undefined) {
      document.title = dictionary[key];
    }
  }

  // Keep the selector synchronized.
  const selector = document.getElementById("lang-select");

  if (selector) {
    selector.value = language;
  }

  // Notify other scripts, such as the RSVP form, that the language changed.
  document.dispatchEvent(
    new CustomEvent("languageChanged", {
      detail: { language }
    })
  );
}

function setWeddingLanguage(language) {
  if (!isSupported(language)) return;

  localStorage.setItem(LANGUAGE_KEY, language);
  localStorage.removeItem(LEGACY_LANGUAGE_KEY);
  applyLanguage(language);
}

window.setWeddingLanguage = setWeddingLanguage;
window.weddingLanguageReady = new Promise((resolve) => {
  const start = () => initLanguage().then(resolve);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
});
