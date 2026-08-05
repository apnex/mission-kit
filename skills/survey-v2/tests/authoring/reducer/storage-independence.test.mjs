import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const kernelRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../source/authoring/kernel",
);

test(
  "the pure generic reducer derives results without importing or invoking storage, lock, journal, or commit adapters",
  async () => {
    const pending = ["manifest-reducer.mjs"];
    const visited = new Set();
    const forbiddenModules =
      /(?:node:fs|node:net|node:http|node:https|node:dgram|node:child_process)/u;
    const forbiddenRuntime =
      /\b(?:acquireLock|commitMutation|journalAdapter|sessionAdapter|storageAdapter)\b/u;
    while (pending.length > 0) {
      const relative = pending.pop();
      if (visited.has(relative)) continue;
      visited.add(relative);
      const source = await readFile(path.join(kernelRoot, relative), "utf8");
      assert.doesNotMatch(source, forbiddenModules);
      assert.doesNotMatch(source, forbiddenRuntime);
      for (const match of source.matchAll(
        /from\s+"(\.\/[^"]+\.mjs)"/gu,
      )) {
        pending.push(path.basename(match[1]));
      }
    }
    assert.equal(visited.has("manifest-reducer.mjs"), true);
    assert.equal(visited.has("mutation-planner.mjs"), true);
  },
);
