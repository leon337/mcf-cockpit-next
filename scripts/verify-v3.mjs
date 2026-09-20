import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];
const failures = [];

function has(file) {
  return fs.existsSync(path.join(root, file));
}

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function expect(name, condition, detail = "") {
  const pass = Boolean(condition);
  checks.push({ name, pass, detail });
  if (!pass) failures.push(name);
}

expect("project_capsule", has(".mcf/project-capsule.yaml"));
expect("execution_plan", has("docs/V3-EXECUTION-PLAN.md"));
expect("app_shell", has("src/components/v3/app-shell.tsx"));
expect("relationship_graph", has("src/components/v3/relationship-graph.tsx"));
expect("missions_api", has("api/missions.js"));
expect("missions_view", has("src/components/v3/missions-view.tsx"));
expect("insights_engine", has("src/domain/insights.ts"));
expect("insights_view", has("src/components/v3/insights-view.tsx"));

if (has("src/components/v3/app-shell.tsx")) {
  const shell = read("src/components/v3/app-shell.tsx");
  for (const label of ["Ecossistema", "Grafo", "Projetos", "Missões", "Insights"]) {
    expect("nav_" + label.toLowerCase(), shell.includes(label));
  }
}

if (has("src/components/v3/relationship-graph.tsx")) {
  const graph = read("src/components/v3/relationship-graph.tsx");
  expect("graph_provenance", graph.includes("Project Registry") && graph.includes("Current State"));
  expect("graph_no_dependency_claim", graph.includes("não") && graph.includes("dependência"));
}

if (has("api/missions.js")) {
  const api = read("api/missions.js");
  expect("missions_exclude_prs", api.includes("!issue.pull_request"));
  expect("missions_real_source", api.includes("multiagent-collaboration-framework"));
  expect("missions_no_progress", !/progress|percentage|percentual/i.test(api));
}

if (has("src/domain/insights.ts")) {
  const insights = read("src/domain/insights.ts");
  expect("insights_30_day_rule", insights.includes("INACTIVITY_DAYS = 30"));
  expect("insights_registry_rule", insights.includes("NOT_IN_PROJECT_REGISTRY"));
  expect("insights_reference_rule", insights.includes("REFERENCED_NOT_REGISTERED"));
  expect("insights_privacy_rule", insights.includes("REGISTERED") && insights.includes("!node.repository"));
}

if (has("src/components/v3/insights-view.tsx")) {
  const view = read("src/components/v3/insights-view.tsx");
  expect("insights_no_health_score", view.includes("Nada aqui") && view.includes("score"));
  expect("insights_rule_source_visible", view.includes("Regra:") && view.includes("Fonte:"));
}

const sourceFiles = [
  "src/App.tsx",
  "src/components/v3/app-shell.tsx",
  "src/components/v3/relationship-graph.tsx",
  "src/components/v3/ecosystem-dashboard.tsx",
  "src/components/v3/missions-view.tsx",
  "src/components/v3/insights-view.tsx",
].filter(has);

const combined = sourceFiles.map(read).join("\n");
expect("no_micro_arbitrary_fonts", !/text-\[(?:[1-9]|10|11)px\]/.test(combined));
expect("no_fake_health_score", !/85%|health score|saúde geral/i.test(combined));

if (has("src/components/project/project-card-dialog.tsx")) {
  const card = read("src/components/project/project-card-dialog.tsx");
  expect("private_boundary_preserved", card.includes("BOUNDARY DE PRIVACIDADE"));
  expect("github_secondary", card.includes("Ver código no GitHub"));
}

console.log(JSON.stringify({
  status: failures.length ? "FAILED" : "SUCCEEDED",
  checks,
  failures,
  cognitiveIndependenceProven: false,
}, null, 2));

if (failures.length) process.exit(1);
