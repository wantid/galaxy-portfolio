# Media assets

Files you maintain for the live site and GitHub README.

## Live site (`content/`)

| File | Used for | Recommendations |
|------|----------|-----------------|
| `content/about/photo.webp` | Profile photo on welcome page | Square or portrait, ~400×400 px+, WebP or PNG/JPG (update path in `welcome.json`) |
| `content/<project>/*.md` | Planet / About modals | Markdown; images via `![alt](content/...)` |
| `content/<project>/*.{jpg,png,webp,gif,mp4}` | Screenshots and videos in modals | Any reasonable size; paths must match Markdown |

These are copied to `public/content/` on `npm run dev` / `npm run build`.

## README & sharing (`docs/`)

| File | Where it appears | Recommendations |
|------|------------------|-----------------|
| `docs/demo.gif` | Top of [`README.md`](../README.md) | 10–15 s screen recording: welcome → Explore → 3D → planet modal. ~720–900 px wide |
| `docs/screenshot-welcome.png` | README screenshots table | PNG of the welcome / CV page |
| `docs/screenshot-universe.png` | README screenshots table | PNG of the 3D galaxy view |
| `docs/og-image.png` | See below | 1280×640 px banner |

## `docs/og-image.png` — what it is for

1. **Social link previews** — when someone shares `https://wantid.github.io/galaxy-portfolio/` on Twitter/X, Discord, Telegram, LinkedIn, etc., platforms read Open Graph tags from [`index.html`](../index.html) and show this image.
2. **GitHub repo card** — upload the same file in **Settings → General → Social preview** (optional but recommended).
3. **Deploy** — `scripts/copy-data.js` copies it to `public/og-image.png` so the live site serves it at `/galaxy-portfolio/og-image.png`.

It is **not** shown inside the app UI — only in external previews and metadata.

## Optional cleanup

Do **not** commit generated folders: `public/` (except `.gitkeep`), `dist/`, `node_modules/`.
