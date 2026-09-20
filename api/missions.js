const OWNER = "leon337";
const REPO = "multiagent-collaboration-framework";
const CACHE_TTL_MS = 5 * 60 * 1000;

let memoryCache = null;

function headers() {
  const out = {
    Accept: "application/vnd.github+json",
    "User-Agent": "mcf-cockpit-next",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  if (process.env.GITHUB_TOKEN) {
    out.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return out;
}

async function gh(path) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: headers()
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`GitHub missions request failed: ${response.status}`);
    error.status = response.status;
    error.detail = text.slice(0, 500);
    throw error;
  }

  return response.json();
}

function normalize(issue) {
  const title = String(issue.title || "");
  const codeMatch = title.match(/^([A-Z0-9][A-Z0-9-]{4,})\s+(?:—|–|-)\s+/);

  return {
    id: issue.id,
    number: issue.number,
    code: codeMatch ? codeMatch[1] : null,
    title,
    body: issue.body || null,
    url: issue.html_url,
    state: issue.state,
    stateReason: issue.state_reason || null,
    labels: (issue.labels || []).map((label) =>
      typeof label === "string"
        ? label
        : {
            name: label.name || "",
            color: label.color || null,
            description: label.description || null
          }
    ),
    author: issue.user?.login || null,
    comments: Number(issue.comments || 0),
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    closedAt: issue.closed_at || null
  };
}

async function loadMissions() {
  if (memoryCache && memoryCache.expiresAt > Date.now()) {
    return { ...memoryCache.data, cache: "memory" };
  }

  const issues = await gh(
    `/repos/${OWNER}/${REPO}/issues?state=all&per_page=100&sort=updated&direction=desc`
  );

  const missions = issues
    .filter((issue) => !issue.pull_request)
    .filter((issue) => /^MCF-[A-Z0-9-]+\s+(?:—|–|-)/.test(String(issue.title || "")))
    .map(normalize);

  const data = {
    ok: true,
    generatedAt: new Date().toISOString(),
    source: `GitHub Issues — ${OWNER}/${REPO}`,
    selection: {
      repository: `${OWNER}/${REPO}`,
      rule: "public issues whose title begins with MCF-<code>",
      window: "100 most recently updated issues from GitHub API",
      pullRequestsExcluded: true
    },
    counts: {
      total: missions.length,
      open: missions.filter((mission) => mission.state === "open").length,
      closed: missions.filter((mission) => mission.state === "closed").length
    },
    missions
  };

  memoryCache = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    data
  };

  return { ...data, cache: "fresh" };
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      ok: false,
      error: "METHOD_NOT_ALLOWED"
    });
  }

  try {
    const data = await loadMissions();
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=900");
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.status || 502).json({
      ok: false,
      error: "MISSIONS_DATA_UNAVAILABLE",
      message: error.message,
      detail: error.detail || null
    });
  }
};
