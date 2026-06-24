import {
    siGithub,
    siGmail,
    siTelegram,
    siWhatsapp,
} from 'simple-icons';
import flagUs from 'flag-icons/flags/4x3/us.svg?url';
import flagRu from 'flag-icons/flags/4x3/ru.svg?url';
import flagRs from 'flag-icons/flags/4x3/rs.svg?url';

const BRAND_ICONS = {
    github: siGithub,
    telegram: siTelegram,
    whatsapp: siWhatsapp,
    gmail: siGmail,
};

const FLAG_URLS = {
    us: flagUs,
    ru: flagRu,
    rs: flagRs,
};

const LEGACY_LANGUAGE_MAP = {
    '🇺🇸': 'en',
    '🇷🇺': 'ru',
    '🇷🇸': 'sr',
};

export function migrateLanguageCode(code) {
    return LEGACY_LANGUAGE_MAP[code] || code;
}

export function renderFlag(countryCode) {
    if (!countryCode) return '';
    const code = String(countryCode).toLowerCase();
    const src = FLAG_URLS[code];
    if (!src) return '';
    return `<img class="flag-icon" src="${src}" alt="" aria-hidden="true" width="20" height="15" loading="lazy">`;
}

export function getBrandIcon(slug) {
    if (!slug) return null;
    return BRAND_ICONS[String(slug).toLowerCase()] || null;
}

export function detectIconFromUrl(url) {
    if (!url) return null;
    const normalized = url.toLowerCase();

    if (normalized.includes('github.com')) return 'github';
    if (normalized.includes('t.me') || normalized.includes('telegram.')) return 'telegram';
    if (normalized.includes('wa.me') || normalized.includes('whatsapp.com')) return 'whatsapp';
    if (normalized.startsWith('mailto:')) return 'gmail';

    return null;
}

export function renderBrandIcon(slug, options = {}) {
    const {
        size = 20,
        useBrandColor = true,
        className = 'icon-brand',
        decorative = true,
    } = options;

    const icon = getBrandIcon(slug);
    if (!icon) return '';

    const color = useBrandColor ? `#${icon.hex}` : 'currentColor';
    const a11y = decorative
        ? ' aria-hidden="true"'
        : (icon.title ? ` role="img" aria-label="${icon.title}"` : ' role="img"');

    return `<svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24"${a11y} xmlns="http://www.w3.org/2000/svg"><path fill="${color}" d="${icon.path}"/></svg>`;
}

export function resolveLinkIcon(link) {
    if (!link) return null;
    if (link.icon) return link.icon;
    return detectIconFromUrl(link.url);
}
