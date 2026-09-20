import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const checks = [];

function expect(name, condition, detail = "") {
  checks.push({ name, pass: Boolean(condition), detail });
  if (!condition) failures.push(name);
}

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

const sourceFiles = [
  "src/App.tsx",
  "src/components/ecosystem/views.tsx",
  "src/components/project/project-card-dialog.tsx",
  "src/styles/globals.css",
].filter((file) => fs.existsSync(path.join(root, file)));

const combined = sourceFiles.map(read).join("\n");

expect("react_entrypoint", fs.existsSync(path.join(root, "src/main.tsx")));
expect("zod_schema", fs.existsSync(path.join(root, "src/data/schema.ts")));
expect("tanstack_query", combined.includes("useQuery") || fs.existsSync(path.join(root, "src/data/queries.ts")));
expect("radix_dialog", combined.includes("DialogContent") || fs.existsSync(path.join(root, "src/components/ui/dialog.tsx")));
expect("github_secondary_action", combined.includes("Ver código no GitHub"));
expect("private_metadata_boundary", !combined.includes("GITHUB_TOKEN"));
expect("no_micro_font_arbitrary_classes", !/text-\[(?:[1-9]|10|11)px\]/.test(combined));

if (fs.existsSync(path.join(root, "src/styles/globals.css"))) {
  const css = read("src/styles/globals.css");
  const tinyPx = [...css.matchAll(/font-size\s*:\s*(\d+(?:\.\d+)?)px/g)]
    .map((match) => Number(match[1]))
    .filter((value) => value < 12);
  expect("no_css_font_below_12px", tinyPx.length === 0, JSON.stringify(tinyPx));
  expect("large_screen_scale", css.includes("@media (min-width: 1920px)"));
  expect("reduced_motion", css.includes("prefers-reduced-motion"));
}

console.log(JSON.stringify({
  status: failures.length ? "FAILED" : "SUCCEEDED",
  checks
}, null, 2));

if (failures.length) process.exit(1);
