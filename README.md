# Galaxy Portfolio

**🌐 [Live Demo](https://wantid.github.io/galaxy-portfolio/)**

3D portfolio/resume constructor built with Three.js, inspired by Metroid Prime.

## Overview

The portfolio starts with a static welcome page displaying your resume information (hero section, about, work experience, projects, skills, education, and contacts). Users can export the welcome page to PDF or click "Explore My Work" to enter the interactive 3D universe where each planet represents a project or work experience. Planets orbit the sun, and clicking a planet opens a modal with detailed information.

## Controls

- **Left mouse + drag** – orbit the camera
- **Right mouse + drag** – pan the camera
- **Mouse wheel** – zoom in/out
- **Click planet** – open modal with details

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Planet configuration

Planets live in `data/planets.json` (copied to `src/data/planets.json`). Each entry includes:
- `name` – label above the planet
- `startDate`
- `endDate` (nullable)
- `tabs` – array of modal tabs

### Optional + automatic appearance fields
- `color` – custom HEX; otherwise derived from `name`
- `size` – defaults to `1.5 + normalizedDuration * 1`
- `orbitRadius` – defaults to `12 + index * 6` (sorted index)
- `rotationSpeed` – defaults to `0.008 / (normalizedDuration + 0.1)`
- `angle` – computed from position in sorted array
- `tabs` – same schema as global tabs (Markdown reference)
- glow ring is always 120% of size, opacity 0.1

Override any property in JSON if you need custom values.

## Global tabs

Configure the top panel via `data/tabs.json` (`src/data/tabs.json` at runtime):
- `label` — button text
- `type` — `modal` or `link`
- For `modal`: provide `name`, optional dates, and `tabs` (same schema as planets)
- For `link`: provide `href`

Clicking a tab either opens the same modal component or navigates to an external resource in a new tab.

## Welcome page

The welcome page is configured via `data/welcome.json` (copied to `src/data/welcome.json` at runtime). The file supports multiple languages.

### Structure

Each language object contains:

- **`hero`** – Personal information section
  - `name` – Your full name
  - `title` – Job title or role
  - `tagline` – Short tagline or motto
  - `image` – Path to profile photo (relative to `content/`)
  - `location` – Your location
  - `email` – Email address (optional)

- **`about`** – About section
  - `title` – Section title
  - `content` – About text content

- **`workExperience`** – Work experience section
  - `title` – Section title
  - `items` – Array of work experience entries
    - `name` – Company name
    - `startDate` – Start date (YYYY-MM-DD format)
    - `endDate` – End date (YYYY-MM-DD format, or `null` for current position)
    - `description` – Job description and responsibilities

- **`projects`** – Featured projects section
  - `title` – Section title
  - `items` – Array of project entries
    - `name` – Project name
    - `description` – Project description
    - `technologies` – Array of technology names
    - `link` – Project URL (GitHub, demo, etc.)

- **`technicalSkills`** – Technical skills section
  - `title` – Section title
  - `categories` – Array of skill categories
    - `name` – Category name (e.g., "Frontend", "Backend")
    - `items` – Array of skills in this category

- **`education`** – Education section
  - `title` – Section title
  - `items` – Array of education entries
    - `degree` – Degree name
    - `institution` – Institution name
    - `period` – Study period (e.g., "2022", "2020 - 2024")
    - `description` – Field of study or specialization

- **`contacts`** – Contact links section
  - `title` – Section title
  - `links` – Array of contact links
    - `name` – Link label (e.g., "GitHub", "LinkedIn")
    - `url` – Link URL

- **`moreButton`** – Text for "Explore My Work" button
- **`exportButton`** – Text for "Download CV" button

## GitHub Pages

Deployment is automated through GitHub Actions.

1. Create a repository on GitHub and push the project (main branch)
2. Pages source must be set to GitHub Actions (Settings → Pages)
3. Every push to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes to Pages

If your repository name differs from `galaxy-portfolio`, update `base` in `vite.config.js`:

```js
base: '/your-repo-name/',
```

After the workflow succeeds, the site is available at `https://<username>.github.io/<repo>/`.

## TODO

- [x] Add sample content for the planets/tabs
- [x] Animate modal opening/closing transitions
- [x] Add touch support for planet clicks on mobile
- [x] Overlapping elements over modals
- [x] Loader for modal content
- [ ] Planet tags
- [ ] Filter labels by planet tags
- [x] Clickable planet labels
- [ ] Update planets date format (13 Aug 2025, 13-15 Aug 2025, Aug - Sep 2025 etc.)
- [x] Add button freezing time
- [x] Add static welcome page ("Explore ->")
- [x] Add welcome page example
- [x] Export welcome page to pdf
- [ ] Planet routes

