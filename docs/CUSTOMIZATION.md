# Customization Guide

This guide covers all configuration files and the content workflow for Galaxy Portfolio.

## Content workflow

```
data/*.json  ──copy-data──►  src/data/*.json   (imported by the app)
content/     ──copy-data──►  public/content/   (served as static files)
```

Run `npm run copy-data` manually, or use `npm run dev` / `npm run build` which run it automatically.

Markdown paths in JSON use the `content/...` prefix. At runtime they are fetched from `public/content/...`.

## Planet configuration

Planets live in [`data/planets.json`](../data/planets.json) (copied to `src/data/planets.json`).

Each entry includes:

| Field | Required | Description |
|-------|----------|-------------|
| `name` | yes | Label above the planet |
| `startDate` | yes | Start date (`YYYY-MM-DD`) |
| `endDate` | no | End date (`YYYY-MM-DD`) or omit for ongoing |
| `tabs` | yes | Array of modal tabs (Markdown) |
| `slug` | no | URL slug for deep links (`#/planet/my-slug`). Auto-derived from content folder name if omitted |
| `color` | no | Custom HEX color; otherwise derived from `name` |
| `size` | no | Planet radius; default `1.5 + normalizedDuration` |
| `orbitRadius` | no | Orbit distance; default `12 + index * 6` |
| `rotationSpeed` | no | Orbit speed; default `0.008 / (normalizedDuration + 0.1)` |
| `angle` | no | Starting angle on orbit; computed from sorted index |

Glow ring is always 120% of planet size at 0.1 opacity.

### Tab schema (planets and global tabs)

```json
{
  "title": "Description (EN)",
  "content": "content/my-project/description.en.md"
}
```

### Deep links

Share a specific project:

```
https://your-site.github.io/your-repo/#/planet/galaxy-portfolio
```

Slugs match the content folder name by default (e.g. `content/galaxy-portfolio/` → `galaxy-portfolio`).

## Global tabs

Configure the top panel via [`data/tabs.json`](../data/tabs.json).

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | Button text |
| `type` | `"home"` \| `"modal"` \| `"link"` | Behavior |
| `name` | string | Modal title (for `modal` type) |
| `href` | string | URL (for `link` type) |
| `icon` | string | Optional [Simple Icons](https://simpleicons.org/) slug (e.g. `github`) for `link` tabs |
| `tabs` | array | Tab schema (for `modal` type) |
| `startDate` / `endDate` / `dateLabel` | optional | Shown in modal header |

- **`home`** — returns to the welcome page
- **`modal`** — opens the shared modal component with Markdown tabs
- **`link`** — opens an external URL in a new tab

## Welcome page

Configured via [`data/welcome.json`](../data/welcome.json). Supports multiple languages using locale codes as top-level keys (e.g. `"en"`, `"ru"`, `"sr"`).

Each language block includes a `flag` field — ISO 3166-1 alpha-2 country code for the language switcher ([flag-icons](https://github.com/lipis/flag-icons)): `us`, `ru`, `rs`, etc.

### Language object structure

Top-level per language:

| Field | Description |
|-------|-------------|
| `flag` | Country code for switcher button (e.g. `"us"` for English) |

#### `hero` — Personal information

| Field | Description |
|-------|-------------|
| `name` | Full name |
| `title` | Job title or role |
| `tagline` | Short motto |
| `image` | Path to profile photo (relative to `content/`, e.g. `content/about/photo.webp`) |
| `location` | Location |
| `email` | Email (optional) |

#### `about`

| Field | Description |
|-------|-------------|
| `title` | Section title |
| `content` | About text (plain text or HTML) |

#### `workExperience`

| Field | Description |
|-------|-------------|
| `title` | Section title |
| `items` | Array of entries |

Each work item:

| Field | Description |
|-------|-------------|
| `name` | Company name |
| `startDate` | `YYYY-MM-DD` |
| `endDate` | `YYYY-MM-DD` or `null` for current |
| `description` | Responsibilities |

#### `projects`

| Field | Description |
|-------|-------------|
| `title` | Section title |
| `items` | Array of entries |

Each project:

| Field | Description |
|-------|-------------|
| `name` | Project name |
| `description` | Short description |
| `technologies` | Array of tech names |
| `link` | URL (GitHub, demo, etc.) |

#### `technicalSkills`

| Field | Description |
|-------|-------------|
| `title` | Section title |
| `categories` | Array of `{ name, items[] }` |

#### `education`

| Field | Description |
|-------|-------------|
| `title` | Section title |
| `items` | Array of `{ degree, institution, period, description }` |

#### `contacts`

| Field | Description |
|-------|-------------|
| `title` | Section title |
| `links` | Array of `{ name, url, icon? }` |

Each contact link:

| Field | Description |
|-------|-------------|
| `name` | Link label (e.g. "GitHub", "Telegram") |
| `url` | Full URL |
| `icon` | Optional [Simple Icons](https://simpleicons.org/) slug (`github`, `telegram`, `whatsapp`, `linkedin`, …). Auto-detected from URL if omitted |

#### Buttons

| Field | Description |
|-------|-------------|
| `moreButton` | Text for "Explore My Work" |
| `exportButton` | Text for "Download CV" |

### PDF export labels

Each language object can include `exportSections` with labels for the PDF section picker:

```json
"exportSections": {
  "title": "Select Sections",
  "cancel": "Cancel",
  "confirm": "Export",
  "about": "About",
  "workExperience": "Work Experience"
}
```

## Adding a language

1. Copy an existing language block in `data/welcome.json`
2. Change the top-level key to a locale code (e.g. `"de"`)
3. Set `"flag": "de"` (ISO country code; add SVG import in [`src/icons.js`](../src/icons.js) for new flags)
4. Translate all strings
5. Add corresponding Markdown files under `content/` if needed
6. Run `npm run copy-data`

The first language in the file is the default. User preference is saved in `localStorage` under `galaxy-portfolio-language`.

## Markdown content

Place files under `content/<project-name>/`:

```
content/
├── about/
│   ├── profile.en.md
│   ├── profile.ru.md
│   └── photo.webp
└── my-project/
    ├── description.en.md
    └── description.md
```

Reference them in JSON as `content/my-project/description.en.md`.

Supported in Markdown:

- Standard Markdown (via `marked`)
- Images: `![alt](content/path/to/image.png)`
- Video (WebP): `[video](content/path/to/video.webp)`

## Deployment base path

If your repository name is not `galaxy-portfolio`, update `base` in [`vite.config.js`](../vite.config.js):

```js
base: '/your-repo-name/',
```

Also update OG image URLs in [`index.html`](../index.html) and contact links in your JSON files.

## Fork customization checklist

| File | What to change |
|------|----------------|
| `data/welcome.json` | Name, email, experience, contacts |
| `data/planets.json` | Your projects and work history |
| `data/tabs.json` | GitHub link, About tabs |
| `content/**` | Markdown descriptions and images |
| `vite.config.js` | `base` path for GitHub Pages |
| `index.html` | OG URLs, meta description |
| `#author-link` in `index.html` | Attribution link (optional) |
