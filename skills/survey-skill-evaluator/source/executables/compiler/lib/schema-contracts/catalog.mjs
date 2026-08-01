import { ANALYTICAL_SCHEMA_CONTRACTS } from "../../../statistics/contracts.mjs";
import { EXECUTION_SCHEMA_FACTORIES } from "./execution.mjs";
import { GOVERNANCE_SCHEMA_FACTORIES } from "./governance.mjs";
import { HANDOFF_SCHEMA_FACTORIES } from "./handoffs.mjs";

function mergeDisjoint(namedMaps) {
  const merged = {};
  for (const [label, map] of namedMaps) {
    for (const [filename, factory] of Object.entries(map)) {
      if (Object.hasOwn(merged, filename)) {
        throw new Error(
          `duplicate sovereign schema contract ownership for ${filename} (${label})`,
        );
      }
      if (typeof factory !== "function") {
        throw new Error(`schema contract factory is not callable: ${filename}`);
      }
      merged[filename] = factory;
    }
  }
  return Object.freeze(merged);
}

export const SOVEREIGN_SCHEMA_FACTORIES = mergeDisjoint([
  ["governance", GOVERNANCE_SCHEMA_FACTORIES],
  ["execution", EXECUTION_SCHEMA_FACTORIES],
  ["handoffs", HANDOFF_SCHEMA_FACTORIES],
]);

const analyticalNames = new Set(Object.keys(ANALYTICAL_SCHEMA_CONTRACTS));
for (const filename of Object.keys(SOVEREIGN_SCHEMA_FACTORIES)) {
  if (analyticalNames.has(filename)) {
    throw new Error(
      `sovereign schema duplicates analytical facade authority: ${filename}`,
    );
  }
}

export const DECLARATIVE_SCHEMA_NAMES = Object.freeze(
  [
    ...Object.keys(ANALYTICAL_SCHEMA_CONTRACTS),
    ...Object.keys(SOVEREIGN_SCHEMA_FACTORIES),
  ].sort(),
);

export function declarativeSchemaContract(
  filename,
  { lifecycleManifest } = {},
) {
  if (Object.hasOwn(ANALYTICAL_SCHEMA_CONTRACTS, filename)) {
    return ANALYTICAL_SCHEMA_CONTRACTS[filename];
  }
  const factory = SOVEREIGN_SCHEMA_FACTORIES[filename];
  return factory ? factory({ lifecycleManifest }) : null;
}

