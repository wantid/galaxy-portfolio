# Contributing to Galaxy Portfolio

Thank you for your interest in improving Galaxy Portfolio!

## Development setup

**Prerequisites:** Node.js 18+ (Node 20 recommended — matches CI)

```bash
git clone https://github.com/wantid/galaxy-portfolio.git
cd galaxy-portfolio
npm install
npm run dev
```

Open `http://localhost:5173/galaxy-portfolio/` (Vite dev server with base path).

### Useful commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Copy data + start dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run copy-data` | Sync `data/` → `src/data/` and `content/` → `public/content/` |

### Project structure

```
data/           JSON configuration (source of truth)
content/        Markdown and media for planets and About
src/            Application code (main.js, scene.js, modal.js, styles.css)
scripts/        Build helpers (copy-data.js)
docs/           Documentation and marketing assets
.github/        GitHub Actions deploy workflow
```

## Making changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-improvement`)
3. Edit JSON in `data/` — not `src/data/` (it is generated)
4. Run `npm run dev` to verify locally
5. Run `npm run build` before submitting a PR
6. Open a Pull Request with a clear description and screenshots for UI changes

## Pull request guidelines

- Keep changes focused — one feature or fix per PR
- Match existing code style (vanilla JS, ES modules, no framework)
- Update [`README.md`](../README.md) or [`docs/CUSTOMIZATION.md`](CUSTOMIZATION.md) if behavior or config changes
- Do not commit secrets or personal data

## Reporting issues

Use [GitHub Issues](https://github.com/wantid/galaxy-portfolio/issues) for bugs and feature requests. Include:

- Browser and OS
- Steps to reproduce
- Expected vs actual behavior
- Screenshots or console errors if relevant

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](../LICENSE).
