# Welcome to our wedding website!

🤍 [Link here](https://pi-negre.github.io/sitio)

## Translations

The Italian and English translation dictionaries live in `lang.json`. Shared site and games-menu strings are at the top level of each language entry. Game-specific strings are grouped under `bike`, `geo`, and `lidl`. HTML keeps Italian fallback text for the initial page display.

Pages load translations through `js/language.js`. Game scripts read their page section from `window.weddingTranslations` and update when the shared `languageChanged` event fires. Add new user-facing copy to `lang.json` instead of creating another in-script translation dictionary.
