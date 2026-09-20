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

expect("v31_plan", has("docs/V3.1-EXECUTION-PLAN.md"));
expect("navigation_state", has("src/domain/navigation.ts"));
expect("mission_detail", has("src/components/v3/mission-detail-dialog.tsx"));

if (has("src/domain/navigation.ts")) {
  const nav = read("src/domain/navigation.ts");
  for (const param of [
    "view",
    "area",
    "project",
    "tab",
    "mission",
    "missionState",
    "q",
    "graphGroup",
    "graphEvidence",
  ]) {
    expect("url_param_" + param, nav.includes(`"${param}"`));
  }
  expect("history_push", nav.includes("pushState"));
  expect("history_replace", nav.includes("replaceState"));
}

if (has("src/App.tsx")) {
  const app = read("src/App.tsx");
  expect("popstate_restore", app.includes('addEventListener("popstate"'));
  expect("project_url_open", app.includes("project: node.id"));
  expect("mission_url_open", app.includes("mission: mission.number"));
  expect("search_url_state", app.includes("{ q: value }"));
  expect("graph_filter_url_state", app.includes("graphGroup") && app.includes("graphEvidence"));
}

if (has("src/components/project/project-card-dialog.tsx")) {
  const card = read("src/components/project/project-card-dialog.tsx");
  expect("project_tab_controlled", card.includes("value={activeTab}") && card.includes("onValueChange"));
  expect("provenance_language", card.includes("Proveniência"));
  expect("privacy_boundary", card.includes("BOUNDARY DE PRIVACIDADE"));
}

if (has("src/components/v3/missions-view.tsx")) {
  const missions = read("src/components/v3/missions-view.tsx");
  expect("mission_detail_in_cockpit", missions.includes("MissionDetailDialog"));
  expect("mission_filter_controlled", !missions.includes("useState<MissionFilter>"));
  expect("mission_internal_action", missions.includes("Abrir no Cockpit"));
}

if (has("api/missions.js")) {
  const api = read("api/missions.js");
  expect("mission_body_public", api.includes("body: issue.body || null"));
  expect("mission_prs_excluded", api.includes("!issue.pull_request"));
  expect("mission_no_progress", !/percentage|percentual|progressPercent/i.test(api));
}

if (has("src/components/v3/insights-view.tsx")) {
  const insights = read("src/components/v3/insights-view.tsx");
  expect("insight_project_navigation", insights.includes("onSelectProject(project.id)"));
  expect("no_health_score", insights.includes("Nada aqui") && insights.includes("score"));
}

if (has("src/components/v3/relationship-graph.tsx")) {
  const graph = read("src/components/v3/relationship-graph.tsx");
  expect("graph_group_filter", graph.includes("groupFilter"));
  expect("graph_evidence_filter", graph.includes("evidenceFilter"));
  expect("graph_keyboard", graph.includes('event.key === "Enter"') && graph.includes('event.key === " "'));
  expect("graph_no_dependency_claim", graph.includes("dependência técnica"));
}

if (has("src/components/ecosystem/views.tsx")) {
  const ecosystem = read("src/components/ecosystem/views.tsx");
  expect("ecosystem_search_visible", ecosystem.includes("visibleGroups"));
  expect("ecosystem_area_controlled", ecosystem.includes("onFocusedGroupChange"));
  expect("no_local_area_url_write", !ecosystem.includes("history.replaceState"));
}

const combined = [
  "src/App.tsx",
  "src/components/v3/missions-view.tsx",
  "src/components/v3/insights-view.tsx",
  "src/components/v3/relationship-graph.tsx",
  "src/components/project/project-card-dialog.tsx",
]
  .filter(has)
  .map(read)
  .join("\n");

expect("no_fake_progress", !/85%|90%|progress:\s*\d|percentual de progresso\s*:/i.test(combined));
expect("no_execution_plane", !/execute mission|run agent|dispatch agent/i.test(combined));

console.log(
  JSON.stringify(
    {
      status: failures.length ? "FAILED" : "SUCCEEDED",
      checks,
      failures,
      mission: "MCF-COCKPIT-V3-1-001",
      cognitiveIndependenceProven: false,
    },
    null,
    2,
  ),
);

if (failures.length) process.exit(1);
