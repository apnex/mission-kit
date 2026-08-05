import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(
  new URL("../../../../", import.meta.url),
);
const importPattern =
  /(?:import|export)\s+(?:[^"'`]*?\s+from\s+)?["']([^"']+)["']/gu;

test("the in-memory store static import closure has no domain or runtime-storage dependency", async () => {
  const pending = [
    "source/authoring/runtime/store-port.mjs",
    "source/authoring/adapters/in-memory-store.mjs",
  ];
  const visited = new Set();
  while (pending.length > 0) {
    const relative = pending.pop();
    if (visited.has(relative)) continue;
    visited.add(relative);
    assert.equal(
      relative.startsWith("source/authoring/survey/"),
      false,
      `domain import entered at ${relative}`,
    );
    assert.equal(
      relative.startsWith("source/executables/runtime/"),
      false,
      `runtime-storage import entered at ${relative}`,
    );
    const source = await readFile(
      path.join(packageRoot, relative),
      "utf8",
    );
    for (const match of source.matchAll(importPattern)) {
      const specifier = match[1];
      if (!specifier.startsWith(".")) continue;
      const target = path
        .relative(
          packageRoot,
          path.resolve(
            packageRoot,
            path.dirname(relative),
            specifier,
          ),
        )
        .replaceAll(path.sep, "/");
      assert.equal(
        target.startsWith("../"),
        false,
        `import escaped the package at ${relative}`,
      );
      pending.push(target);
    }
  }
  assert.equal(visited.size > 2, true);
});
