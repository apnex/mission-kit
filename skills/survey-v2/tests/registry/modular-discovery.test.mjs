import assert from "node:assert/strict";
import {
  readFile,
  readdir
} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { surveyRoot } from "../fixtures/root.mjs";

async function discover(directory, prefix = "") {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      paths.push(...await discover(path.join(directory, entry.name), relative));
    } else if (entry.isFile() && entry.name.endsWith(".test.mjs")) {
      paths.push(`tests/${relative}`);
    }
  }
  return paths.sort();
}

test("registered tests are modular, orthogonal and one behavior each", async () => {
  const manifest = JSON.parse(
    await readFile(`${surveyRoot}/tests/test-evidence.manifest.json`, "utf8")
  );
  const descriptors = await Promise.all(manifest.tests.map(async (entry) => JSON.parse(
    await readFile(path.join(surveyRoot, entry.descriptorPath), "utf8")
  )));
  assert.deepEqual(
    descriptors.map((descriptor) => descriptor.id),
    manifest.tests.map((entry) => entry.id)
  );
  const executables = descriptors.map((descriptor) => descriptor.executable).sort();
  assert.equal(new Set(executables).size, executables.length);
  assert.deepEqual(executables, await discover(path.join(surveyRoot, "tests")));
  for (const descriptor of descriptors) {
    const source = await readFile(path.join(surveyRoot, descriptor.executable), "utf8");
    assert.equal(source.match(/(?:^|\n)test\s*\(/g)?.length ?? 0, 1, descriptor.executable);
  }
  for (const area of [
    "dependencies",
    "envelope",
    "fragments",
    "projection",
    "protocol",
    "schemas",
    "state"
  ]) {
    assert.ok(executables.some((executable) => executable.startsWith(`tests/${area}/`)), area);
  }
});
