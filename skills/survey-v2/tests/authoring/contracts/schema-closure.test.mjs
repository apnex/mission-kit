import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);
const schemaDirectory = path.join(
  packageRoot,
  "schemas/authoring/v1alpha1"
);

test("K10 authoring schema closure contains exactly sixteen package-bound neutral authorities", async () => {
  const manifest = JSON.parse(
    await readFile(path.join(packageRoot, "survey-v2.package.json"), "utf8")
  );
  const files = (await readdir(schemaDirectory))
    .filter((name) => name.endsWith(".schema.json"))
    .sort();
  const documents = await Promise.all(
    files.map(async (name) => JSON.parse(
      await readFile(path.join(schemaDirectory, name), "utf8")
    ))
  );
  const entries = manifest.schemas.filter((entry) => (
    entry.id.startsWith("urn:mission-kit:authoring:schema:")
  ));

  assert.equal(files.length, 16);
  assert.equal(entries.length, 16);
  assert.deepEqual(
    entries.map((entry) => entry.id).sort(),
    documents.map((document) => document.$id).sort()
  );
  assert.deepEqual(
    entries.map((entry) => entry.path).sort(),
    files.map((name) => `schemas/authoring/v1alpha1/${name}`).sort()
  );
});
