const hierarchy = require("../config/ecosystem-hierarchy.json");

const OWNER = "leon337";
const MCF_REPO = "multiagent-collaboration-framework";
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
    const error = new Error(`GitHub API ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function allOwnerRepos() {
  const out = [];
  for (let page = 1; page <= 10; page += 1) {
    const batch = await gh(
      `/users/${OWNER}/repos?per_page=100&page=${page}&sort=updated&direction=desc`
    );
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}

async function raw(path) {
  const response = await fetch(
    `https://raw.githubusercontent.com/${OWNER}/${MCF_REPO}/main/${path}`,
    { headers: { "User-Agent": "mcf-cockpit-next" } }
  );
  if (!response.ok) throw new Error(`MCF registry file ${response.status}`);
  return response.text();
}

function cleanScalar(value) {
  return String(value || "").trim().replace(/^["']|["']$/g, "");
}

function sectionLines(text, section) {
  const lines = String(text).split(/\r?\n/);
  const start = lines.findIndex(line => line.trim() === `${section}:`);
  if (start < 0) return [];
  const out = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line && !/^\s/.test(line)) break;
    out.push(line);
  }
  return out;
}

function scalarIn(text, section, key) {
  const line = sectionLines(text, section)
    .find(item => item.trim().startsWith(`${key}:`));
  if (!line) return null;
  return cleanScalar(line.trim().slice(key.length + 1));
}

function listIn(text, section, key) {
  const lines = sectionLines(text, section);
  const start = lines.findIndex(line => line.trim() === `${key}:`);
  if (start < 0) return [];
  const result = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (!trimmed.startsWith("- ")) break;
    result.push(cleanScalar(trimmed.slice(2)));
  }
  return result;
}

function parseRegistry(path, text) {
  return {
    id: scalarIn(text, "project", "id"),
    lifecycle: scalarIn(text, "project", "lifecycle"),
    canonicalRepository: scalarIn(text, "identity", "canonical_repository"),
    aliases: listIn(text, "identity", "aliases"),
    capsulePath: scalarIn(text, "context", "capsule_path"),
    entrypoints: listIn(text, "context", "canonical_entrypoints"),
    operationalState: scalarIn(text, "freshness", "operational_state"),
    projectIdentity: scalarIn(text, "freshness", "project_identity"),
    registryPath: path
  };
}

function normalizeRepo(repo) {
  if (!repo) return null;
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
    visibility: repo.visibility,
    updatedAt: repo.updated_at,
    pushedAt: repo.pushed_at
  };
}

function registeredNode(project, repo, group) {
  return {
    id: project.id,
    label: project.aliases[0] || project.id,
    repository: normalizeRepo(repo),
    canonicalRepository: project.canonicalRepository,
    registry: {
      status: "REGISTERED",
      lifecycle: project.lifecycle,
      path: project.registryPath,
      capsulePath: project.capsulePath,
      entrypoints: project.entrypoints,
      operationalState: project.operationalState,
      projectIdentity: project.projectIdentity
    },
    classification: {
      group: group.id,
      relationLabel: group.relationLabel,
      sourceType: group.sourceType,
      canonicalRelation: group.sourceType === "MCF_CURRENT_STATE"
    },
    evidence: hierarchy.structuralRecoveryCore.includes(project.id)
      ? ["PROJECT_REGISTRY", "MCF_CURRENT_STATE_CF_4_OF_4"]
      : ["PROJECT_REGISTRY"]
  };
}

function referencedNode(reference, repo, group) {
  return {
    id: reference.name,
    label: reference.name,
    repository: normalizeRepo(repo),
    canonicalRepository: reference.fullName,
    registry: {
      status: "REFERENCED_NOT_REGISTERED",
      lifecycle: null,
      path: reference.sourcePath,
      capsulePath: null,
      entrypoints: [],
      operationalState: null,
      projectIdentity: null
    },
    classification: {
      group: group.id,
      relationLabel: group.relationLabel,
      sourceType: "PROJECT_REGISTRY_REFERENCE",
      canonicalRelation: false
    },
    evidence: ["PROJECT_REGISTRY_REFERENCE"],
    reference: {
      sourcePath: reference.sourcePath,
      field: reference.reference
    }
  };
}

function discoveredNode(repo, group) {
  return {
    id: repo.name,
    label: repo.name,
    repository: normalizeRepo(repo),
    canonicalRepository: null,
    registry: {
      status: "NOT_IN_PROJECT_REGISTRY",
      lifecycle: null,
      path: null,
      capsulePath: null,
      entrypoints: [],
      operationalState: null,
      projectIdentity: null
    },
    classification: {
      group: group.id,
      relationLabel: group.relationLabel,
      sourceType: group.sourceType,
      canonicalRelation: false
    },
    evidence: ["GITHUB_DISCOVERY"]
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
    const [tree, ownerRepos] = await Promise.all([
      gh(`/repos/${OWNER}/${MCF_REPO}/git/trees/main?recursive=1`),
      allOwnerRepos()
    ]);

    const registryPaths = (tree.tree || [])
      .map(item => item.path)
      .filter(path => /^context\/projects\/[^/]+\.yaml$/.test(path));

    const registryTexts = await Promise.all(registryPaths.map(path => raw(path)));
    const projects = registryPaths
      .map((path, index) => parseRegistry(path, registryTexts[index]))
      .filter(project => project.id && project.canonicalRepository);

    const reposByFullName = new Map(
      ownerRepos.map(repo => [String(repo.full_name).toLowerCase(), repo])
    );
    const reposByName = new Map(
      ownerRepos.map(repo => [String(repo.name).toLowerCase(), repo])
    );
    const projectsById = new Map(projects.map(project => [project.id, project]));

    const coreProject = projectsById.get(hierarchy.coreProjectId);
    const coreRepo = coreProject
      ? reposByFullName.get(String(coreProject.canonicalRepository).toLowerCase())
      : null;

    const groups = hierarchy.groups.map(group => {
      const registered = (group.projectIds || [])
        .map(id => projectsById.get(id))
        .filter(Boolean)
        .map(project => registeredNode(
          project,
          reposByFullName.get(String(project.canonicalRepository).toLowerCase()),
          group
        ));

      const discovered = (group.discoveredRepositories || [])
        .map(name => reposByName.get(String(name).toLowerCase()))
        .filter(Boolean)
        .filter(repo => !projects.some(
          project => String(project.canonicalRepository).toLowerCase() ===
            String(repo.full_name).toLowerCase()
        ))
        .map(repo => discoveredNode(repo, group));

      const referenced = (group.referencedRepositories || []).map(reference =>
        referencedNode(
          reference,
          reposByName.get(String(reference.name).toLowerCase()),
          group
        )
      );

      return {
        id: group.id,
        label: group.label,
        description: group.description,
        relationLabel: group.relationLabel,
        sourceType: group.sourceType,
        nodes: [...registered, ...discovered, ...referenced]
      };
    });

    const core = coreProject
      ? registeredNode(coreProject, coreRepo, {
          id: "core",
          relationLabel: "núcleo",
          sourceType: "PROJECT_REGISTRY"
        })
      : null;

    const allNodes = [core, ...groups.flatMap(group => group.nodes)].filter(Boolean);

    res.status(200).json({
      ok: true,
      generatedAt: new Date().toISOString(),
      sources: {
        registry: `${OWNER}/${MCF_REPO}/context/projects/`,
        currentState: `${OWNER}/${MCF_REPO}/docs/MCF-CURRENT-STATE.md`,
        github: "GitHub REST API — public repository metadata"
      },
      authority: hierarchy.authority,
      core,
      groups,
      inventory: allNodes,
      counts: {
        registryProjects: projects.length,
        representedRegisteredProjects: allNodes.filter(
          node => node.registry.status === "REGISTERED"
        ).length,
        discoveredUnregistered: allNodes.filter(
          node => node.registry.status === "NOT_IN_PROJECT_REGISTRY"
        ).length,
        referencedNotRegistered: allNodes.filter(
          node => node.registry.status === "REFERENCED_NOT_REGISTERED"
        ).length,
        totalNodes: allNodes.length
      },
      structuralRecoveryCore: hierarchy.structuralRecoveryCore,
      provenance: hierarchy.provenance
    });
  } catch (error) {
    res.status(error.status || 502).json({
      ok: false,
      error: "ECOSYSTEM_DATA_UNAVAILABLE",
      message: error.message,
      generatedAt: new Date().toISOString()
    });
  }
};
