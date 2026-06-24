/**
 * Hash-based routes for deep linking:
 *   #/welcome (or empty) — welcome page
 *   #/universe — 3D scene
 *   #/planet/{slug} — 3D scene + planet modal
 */

export function getPlanetSlug(planetData) {
    if (planetData.slug) {
        return planetData.slug;
    }
    const path = planetData.tabs?.[0]?.content || '';
    const match = path.match(/content\/([^/]+)\//);
    if (match) {
        return match[1];
    }
    return planetData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

export function parseRoute(hash) {
    const normalized = (hash || '').replace(/^#/, '').replace(/^\/?/, '/');
    if (!normalized || normalized === '/') {
        return { view: 'welcome' };
    }
    if (normalized === '/welcome') {
        return { view: 'welcome' };
    }
    if (normalized === '/universe') {
        return { view: 'universe' };
    }
    const planetMatch = normalized.match(/^\/planet\/(.+)$/);
    if (planetMatch) {
        return { view: 'planet', slug: decodeURIComponent(planetMatch[1]) };
    }
    return null;
}

export function setRoute(route) {
    if (!route || route.view === 'welcome') {
        const base = window.location.pathname + window.location.search;
        history.replaceState(null, '', base);
        return;
    }
    if (route.view === 'universe') {
        history.replaceState(null, '', '#/universe');
        return;
    }
    if (route.view === 'planet' && route.slug) {
        history.replaceState(null, '', `#/planet/${encodeURIComponent(route.slug)}`);
    }
}
