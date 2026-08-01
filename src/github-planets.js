import { getPlanetSlug } from './routes.js';

const CACHE_KEY = 'galaxy-portfolio-github-repos-v2';
const CACHE_TTL_MS = 30 * 60 * 1000;

function humanizeRepoName(name) {
    return name
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function repoToPlanet(repo, username) {
    const slug = repo.name.toLowerCase();

    return {
        name: humanizeRepoName(repo.name),
        slug,
        startDate: repo.created_at.slice(0, 10),
        endDate: repo.pushed_at ? repo.pushed_at.slice(0, 10) : undefined,
        source: 'github',
        githubUrl: repo.html_url,
        githubDescription: repo.description || '',
        defaultBranch: repo.default_branch || 'main',
        tabs: [
            {
                title: 'Description',
                githubRepo: `${username}/${repo.name}`,
            },
        ],
    };
}

async function fetchAllRepos(username) {
    const repos = [];
    let page = 1;

    while (true) {
        const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}&sort=created&direction=desc`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const batch = await response.json();
        if (!batch.length) {
            break;
        }

        repos.push(...batch);

        if (batch.length < 100) {
            break;
        }

        page += 1;
    }

    return repos;
}

export async function fetchGithubPlanets(config) {
    const { username, includeForks = false, excludeRepos = [] } = config;
    const excludeSet = new Set(excludeRepos.map((repo) => repo.toLowerCase()));

    try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
            const { timestamp, data, cachedUsername } = JSON.parse(cached);
            if (cachedUsername === username && Date.now() - timestamp < CACHE_TTL_MS) {
                return data;
            }
        }
    } catch (_) {
        // Ignore cache read errors
    }

    const repos = await fetchAllRepos(username);
    const planets = repos
        .filter((repo) => !repo.private && (includeForks || !repo.fork))
        .filter((repo) => !excludeSet.has(repo.name.toLowerCase()))
        .map((repo) => repoToPlanet(repo, username));

    try {
        sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
                timestamp: Date.now(),
                cachedUsername: username,
                data: planets,
            })
        );
    } catch (_) {
        // Ignore cache write errors
    }

    return planets;
}

export function mergePlanets(manualPlanets, githubPlanets) {
    const manualSlugs = new Set(
        manualPlanets.map((planet) => getPlanetSlug(planet).toLowerCase())
    );

    const filteredGithubPlanets = githubPlanets.filter(
        (planet) => !manualSlugs.has(getPlanetSlug(planet).toLowerCase())
    );

    return [...manualPlanets, ...filteredGithubPlanets];
}
