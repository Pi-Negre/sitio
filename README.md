# Wedding website

[Open the live website](https://pi-negre.github.io/sitio)

## Project structure

- `index.html` and `style.css` contain the main wedding site. Its page behavior lives in `js/home.js`.
- `giochi/` contains the games landing page and individual games. Each page keeps its styles and behavior in clearly named sibling files.
- `js/language.js` loads the shared translation dictionary from `lang.json`. Add or update Italian and English copy there, including game-specific sections.
- `language-switcher.css` and `navigation.css` provide shared styles used across pages.
- `assets/` contains images and other static media.

## Run locally

Because the pages load `lang.json` with `fetch`, serve the project over HTTP instead of opening an HTML file directly:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.
