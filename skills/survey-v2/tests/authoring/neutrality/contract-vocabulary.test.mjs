import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);

async function filesBelow(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...await filesBelow(target));
    } else if (entry.isFile()) {
      found.push(target);
    }
  }
  return found;
}

test("neutral authoring contracts and kernel contain no Survey-domain or producer-specific vocabulary", async () => {
  const authorities = [
    ...await filesBelow(path.join(packageRoot, "schemas/authoring")),
    ...await filesBelow(path.join(packageRoot, "source/authoring"))
  ].sort();
  const forbidden = /\b(?:survey|round|question|director|openai|anthropic|claude|gemini|gpt)\b/iu;
  const violations = [];

  for (const authority of authorities) {
    const content = await readFile(authority, "utf8");
    const match = forbidden.exec(content);
    if (match) {
      violations.push(
        `${path.relative(packageRoot, authority)}:${match[0]}`
      );
    }
  }

  assert.deepEqual(violations, []);
});
