// Builds output/top-langs.svg and output/top-langs-dark.svg from the GitHub API.
// Runs in CI with GITHUB_TOKEN (public repos) or STATS_TOKEN (a PAT, includes private repos).
import { mkdirSync, writeFileSync } from "node:fs";

const USER = process.env.GH_USER || "AdityaManojA";
const TOKEN = process.env.STATS_TOKEN || process.env.GITHUB_TOKEN || "";
const USE_PAT = Boolean(process.env.STATS_TOKEN);
const COUNT = 8;
const EXCLUDE = new Set(["Jupyter Notebook", "TeX", "Batchfile", "Procfile", "Makefile", "Dockerfile", "Standard ML"]);
const EXCLUDE_REPOS = new Set([USER]);

const COLORS = {
  Python: "#3572A5", JavaScript: "#f1e05a", TypeScript: "#3178c6", HTML: "#e34c26",
  CSS: "#563d7c", "C++": "#f34b7d", C: "#555555", PHP: "#4F5D95", Dart: "#00B4AB",
  Java: "#b07219", Kotlin: "#A97BFF", Swift: "#F05138", Go: "#00ADD8", Rust: "#dea584",
  Shell: "#89e051", PowerShell: "#012456", SCSS: "#c6538c", Vue: "#41b883",
  Svelte: "#ff3e00", "C#": "#178600", Ruby: "#701516", CMake: "#DA3434", GLSL: "#5686a5",
};

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": `${USER}-readme-stats`,
      ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }),
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return res.json();
}

async function listRepos() {
  const repos = [];
  for (let page = 1; ; page++) {
    const batch = USE_PAT
      ? await gh(`/user/repos?affiliation=owner&per_page=100&page=${page}`)
      : await gh(`/users/${USER}/repos?type=owner&per_page=100&page=${page}`);
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  return repos.filter((r) => !r.fork && !r.archived && !EXCLUDE_REPOS.has(r.name));
}

async function languageTotals(repos) {
  const totals = {};
  for (const repo of repos) {
    const langs = await gh(`/repos/${repo.full_name}/languages`);
    for (const [lang, bytes] of Object.entries(langs)) {
      if (!EXCLUDE.has(lang)) totals[lang] = (totals[lang] || 0) + bytes;
    }
  }
  const sum = Object.values(totals).reduce((a, b) => a + b, 0);
  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, COUNT)
    .map(([name, bytes]) => ({ name, pct: (bytes / sum) * 100, color: COLORS[name] || "#8b949e" }));
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function render(langs, theme) {
  const t = theme === "dark"
    ? { bg: "#0d1117", border: "#30363d", title: "#58a6ff", text: "#c9d1d9", muted: "#8b949e", track: "#21262d" }
    : { bg: "#ffffff", border: "#d0d7de", title: "#0969da", text: "#1f2328", muted: "#656d76", track: "#eaeef2" };
  const W = 420, PAD = 24, barW = W - PAD * 2;
  const rows = Math.ceil(langs.length / 2);
  const H = 100 + rows * 26;

  let x = PAD;
  const segments = langs.map((l, i) => {
    const w = i === langs.length - 1 ? PAD + barW - x : (l.pct / 100) * barW;
    const rect = `<rect x="${x.toFixed(2)}" y="58" width="${Math.max(w, 0).toFixed(2)}" height="10" fill="${l.color}"/>`;
    x += w;
    return rect;
  }).join("");

  const legend = langs.map((l, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const lx = PAD + col * (barW / 2), ly = 98 + row * 26;
    return `<g class="item" style="animation-delay:${150 + i * 80}ms" transform="translate(${lx},${ly})">
      <circle cx="5" cy="-4" r="5" fill="${l.color}"/>
      <text x="16" y="0" class="lang">${esc(l.name)}</text>
      <text x="${barW / 2 - 12}" y="0" class="pct" text-anchor="end">${l.pct.toFixed(1)}%</text>
    </g>`;
  }).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t">
  <title id="t">Most used languages</title>
  <style>
    .title { font: 600 16px 'Segoe UI', Ubuntu, 'Helvetica Neue', sans-serif; fill: ${t.title}; }
    .lang { font: 500 13px 'Segoe UI', Ubuntu, 'Helvetica Neue', sans-serif; fill: ${t.text}; }
    .pct { font: 400 12px 'Segoe UI', Ubuntu, 'Helvetica Neue', sans-serif; fill: ${t.muted}; }
    .item { opacity: 0; animation: fade .4s ease-out forwards; }
    @keyframes fade { to { opacity: 1; } }
  </style>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10" fill="${t.bg}" stroke="${t.border}"/>
  <text x="${PAD}" y="38" class="title">Most Used Languages</text>
  <clipPath id="bar"><rect x="${PAD}" y="58" width="${barW}" height="10" rx="5"/></clipPath>
  <rect x="${PAD}" y="58" width="${barW}" height="10" rx="5" fill="${t.track}"/>
  <g clip-path="url(#bar)">${segments}</g>
  ${legend}
</svg>
`;
}

const repos = await listRepos();
const langs = await languageTotals(repos);
if (!langs.length) throw new Error("No language data returned");
mkdirSync("output", { recursive: true });
writeFileSync("output/top-langs.svg", render(langs, "light"));
writeFileSync("output/top-langs-dark.svg", render(langs, "dark"));
console.log(`Scanned ${repos.length} repos:`, langs.map((l) => `${l.name} ${l.pct.toFixed(1)}%`).join(", "));
