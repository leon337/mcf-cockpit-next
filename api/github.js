const config = require("../config/mcf-repositories.json");

const OWNER = "leon337";
const API = "https://api.github.com";

function headers() {
  const h = {
    Accept: "application/vnd.github+json",
    "User-Agent": "mcf-cockpit-next"
  };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

async function gh(path) {
  const response = await fetch(API + path, { headers: headers() });
  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`GitHub API ${response.status}`);
    error.status = response.status;
    error.detail = text.slice(0, 300);
    throw error;
  }
  return response.json();
}

function isMcfRepo(repo) {
  const name = String(repo.name || "").toLowerCase();
  const explicit = new Set(config.explicit.map(x => x.toLowerCase()));
  if (explicit.has(name)) return true;
  if (config.dynamicPrefixes.some(prefix => name.startsWith(prefix.toLowerCase()))) return true;
  return config.dynamicTerms.some(term => name.includes(term.toLowerCase()));
}

function normalizeRepo(repo) {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    url: repo.html_url,
    description: repo.description,
    defaultBranch: repo.default_branch,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    archived: repo.archived,
    fork: repo.fork,
    visibility: repo.visibility,
    topics: repo.topics || [],
    pushedAt: repo.pushed_at,
    updatedAt: repo.updated_at
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method && req.method !== "GET") {
    res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  try {
    const [user, repos] = await Promise.all([
      gh(`/users/${OWNER}`),
      gh(`/users/${OWNER}/repos?per_page=100&sort=updated&direction=desc`)
    ]);

    const selected = repos
      .filter(repo => !repo.fork && isMcfRepo(repo))
      .map(normalizeRepo)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.status(200).json({
      ok: true,
      generatedAt: new Date().toISOString(),
      source: "GitHub REST API — public account data",
      account: {
        login: user.login,
        name: user.name,
        avatar: user.avatar_url,
        url: user.html_url,
        bio: user.bio,
        publicRepos: user.public_repos,
        followers: user.followers,
        following: user.following,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      repositories: selected,
      selection: {
        explicitNames: config.explicit,
        dynamicPrefixes: config.dynamicPrefixes,
        dynamicTerms: config.dynamicTerms,
        note: "A seleção define quais repositórios públicos aparecem como parte do ecossistema MCF; os metadados exibidos vêm do GitHub."
      }
    });
  } catch (error) {
    res.status(error.status || 502).json({
      ok: false,
      error: "GITHUB_DATA_UNAVAILABLE",
      message: error.message,
      generatedAt: new Date().toISOString()
    });
  }
};
