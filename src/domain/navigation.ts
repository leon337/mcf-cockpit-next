export const V3_VIEWS = [
  "ecosystem",
  "graph",
  "projects",
  "missions",
  "insights",
] as const;

export type V3View = (typeof V3_VIEWS)[number];

export const PROJECT_TABS = ["overview", "mcf", "github", "activity"] as const;
export type ProjectTab = (typeof PROJECT_TABS)[number];

export const MISSION_FILTERS = ["open", "closed", "all"] as const;
export type MissionFilter = (typeof MISSION_FILTERS)[number];

export type CockpitLocation = {
  view: V3View;
  area: string | null;
  project: string | null;
  tab: ProjectTab;
  mission: number | null;
  missionFilter: MissionFilter;
  q: string;
  graphGroup: string | null;
  graphEvidence: string | null;
};

function enumValue<T extends readonly string[]>(
  values: T,
  value: string | null,
  fallback: T[number],
): T[number] {
  return value && (values as readonly string[]).includes(value) ? (value as T[number]) : fallback;
}

export function readCockpitLocation(href = window.location.href): CockpitLocation {
  const url = new URL(href);
  const missionValue = Number(url.searchParams.get("mission"));
  return normalizeCockpitLocation({
    view: enumValue(V3_VIEWS, url.searchParams.get("view"), "ecosystem"),
    area: clean(url.searchParams.get("area")),
    project: clean(url.searchParams.get("project")),
    tab: enumValue(PROJECT_TABS, url.searchParams.get("tab"), "overview"),
    mission: Number.isInteger(missionValue) && missionValue > 0 ? missionValue : null,
    missionFilter: enumValue(
      MISSION_FILTERS,
      url.searchParams.get("missionState"),
      "open",
    ),
    q: url.searchParams.get("q")?.trim() || "",
    graphGroup: clean(url.searchParams.get("graphGroup")),
    graphEvidence: clean(url.searchParams.get("graphEvidence")),
  });
}

export function normalizeCockpitLocation(state: CockpitLocation): CockpitLocation {
  return {
    ...state,
    area: state.view === "ecosystem" ? state.area : null,
    mission: state.view === "missions" ? state.mission : null,
    graphGroup: state.view === "graph" ? state.graphGroup : null,
    graphEvidence: state.view === "graph" ? state.graphEvidence : null,
    tab: state.project ? state.tab : "overview",
  };
}

export function writeCockpitLocation(
  state: CockpitLocation,
  mode: "push" | "replace" = "push",
) {
  const normalized = normalizeCockpitLocation(state);
  const url = new URL(window.location.href);

  setOrDelete(url, "view", normalized.view === "ecosystem" ? null : normalized.view);
  setOrDelete(url, "area", normalized.area);
  setOrDelete(url, "project", normalized.project);
  setOrDelete(
    url,
    "tab",
    normalized.project && normalized.tab !== "overview" ? normalized.tab : null,
  );
  setOrDelete(url, "mission", normalized.mission ? String(normalized.mission) : null);
  setOrDelete(
    url,
    "missionState",
    normalized.view === "missions" && normalized.missionFilter !== "open"
      ? normalized.missionFilter
      : null,
  );
  setOrDelete(url, "q", normalized.q || null);
  setOrDelete(url, "graphGroup", normalized.graphGroup);
  setOrDelete(url, "graphEvidence", normalized.graphEvidence);

  if (mode === "push") {
    window.history.pushState({ cockpit: true }, "", url);
  } else {
    window.history.replaceState({ cockpit: true }, "", url);
  }
}

function setOrDelete(url: URL, key: string, value: string | null) {
  if (value) url.searchParams.set(key, value);
  else url.searchParams.delete(key);
}

function clean(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
