#!/usr/bin/env node

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  canonicalize,
  prettyJson
} from "../../source/executables/runtime/lib/canonical.mjs";

function argumentsOf(argv) {
  const parsed = new Map();
  for (const argument of argv) {
    const match = argument.match(/^--([a-z-]+)=(.+)$/u);
    if (!match || parsed.has(match[1])) {
      throw new TypeError("options must be unique --name=value arguments");
    }
    parsed.set(match[1], match[2]);
  }
  for (const name of ["installed-root", "repository-root"]) {
    if (!parsed.has(name) || !path.isAbsolute(parsed.get(name))) {
      throw new TypeError(`--${name} must be an absolute path`);
    }
  }
  if (parsed.size !== 2) throw new TypeError("unknown discovery probe option");
  return parsed;
}

function skillName(text) {
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---/u)?.[1];
  return frontmatter?.match(/^name:\s*(.+)$/mu)?.[1]?.trim() ?? null;
}

async function entries(root, prefix) {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
    const target = path.join(root, entry.name, "SKILL.md");
    const text = await readFile(target, "utf8").catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (text === null) continue;
    const name = skillName(text);
    if (name !== null) {
      result.push({
        folder: entry.name,
        name,
        entrypoint: `${prefix}/${entry.name}/SKILL.md`
      });
    }
  }
  return result;
}

const parsed = argumentsOf(process.argv.slice(2));
const repositoryRoot = path.normalize(parsed.get("repository-root"));
const installedRoot = path.normalize(parsed.get("installed-root"));
const repositoryEntries = await entries(
  path.join(repositoryRoot, "skills"),
  "skills"
);
const repositoryMap = new Map();
const warnings = [];
for (const entry of repositoryEntries) {
  if (entry.folder !== entry.name) {
    warnings.push(
      `WARN  ${entry.folder}/SKILL.md declares name '${entry.name}' (should match folder)`
    );
  }
  repositoryMap.set(entry.name, entry);
}
const installedEntries = await entries(installedRoot, installedRoot);
const installedSurvey = installedEntries.filter(
  (entry) => entry.name === "survey"
);
const repositorySurvey = repositoryEntries.filter(
  (entry) => entry.name === "survey"
);
const observation = {
  schemaVersion: "1.0.0",
  kind: "SurveyDiscoveryProbe",
  operationalDiscovery: {
    skillName: "survey",
    matchingEntrypoints: installedSurvey.map((entry) => entry.entrypoint),
    resolvedEntrypoint:
      installedSurvey.length === 1 ? installedSurvey[0].entrypoint : null,
    unambiguous: installedSurvey.length === 1
  },
  repositoryCatalogObservation: {
    tool: "tools/skill-graph.mjs",
    skillName: "survey",
    matchingEntrypoints: repositorySurvey.map((entry) => entry.entrypoint),
    warning:
      warnings.find((warning) => warning.includes("survey-v2/")) ?? null,
    resolutionRule: "later-map-write-wins",
    resolvedEntrypoint: repositoryMap.get("survey")?.entrypoint ?? null,
    operationallyActive: false
  }
};
const freeze = JSON.parse(
  await readFile(
    new URL("./discovery-routing.freeze.json", import.meta.url),
    "utf8"
  )
);
if (
  canonicalize(observation.operationalDiscovery) !==
    canonicalize(freeze.operationalDiscovery) ||
  canonicalize(observation.repositoryCatalogObservation) !==
    canonicalize(freeze.repositoryCatalogObservation)
) {
  throw new Error("live discovery observation differs from the frozen boundary");
}
process.stdout.write(prettyJson(observation));
