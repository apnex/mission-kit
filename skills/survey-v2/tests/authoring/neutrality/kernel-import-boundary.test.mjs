import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const kernelRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../source/authoring/kernel"
);

async function modulesBelow(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...await modulesBelow(target));
    } else if (entry.isFile() && entry.name.endsWith(".mjs")) {
      found.push(target);
    }
  }
  return found;
}

test("neutral authoring kernel static imports remain inside its closure or use Node built-ins", async () => {
  const violations = [];
  for (const modulePath of await modulesBelow(kernelRoot)) {
    const source = await readFile(modulePath, "utf8");
    if (/\bimport\s*\(/u.test(source)) {
      violations.push(`${modulePath}:dynamic-import`);
    }
    const specifiers = [
      ...source.matchAll(
        /(?:^|\n)\s*(?:import|export)\s+(?:[^"'()]*?\s+from\s+)?["']([^"']+)["']/gu
      )
    ].map((match) => match[1]);

    for (const specifier of specifiers) {
      if (specifier.startsWith("node:")) continue;
      if (!specifier.startsWith(".")) {
        violations.push(`${modulePath}:non-local:${specifier}`);
        continue;
      }
      const resolved = path.resolve(path.dirname(modulePath), specifier);
      const relative = path.relative(kernelRoot, resolved);
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        violations.push(`${modulePath}:escape:${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});
