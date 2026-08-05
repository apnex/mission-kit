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
const authorityPrefix = "urn:mission-kit:authoring:schema:";

test("K13 authoring schema closure contains exactly seventeen package-bound neutral authorities", async () => {
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
  const entries = manifest.schemas.filter(({ id }) => id.startsWith(authorityPrefix));
  const ids = entries.map(({ id }) => id);
  const paths = entries.map(({ path: entryPath }) => entryPath);

  assert.equal(files.length, 17);
  assert.equal(entries.length, 17);
  assert.equal(new Set(ids).size, 17, "schema IDs must be duplicate-free");
  assert.equal(new Set(paths).size, 17, "schema paths must be duplicate-free");
  assert.deepEqual(
    [...ids].sort(),
    documents.map(({ $id }) => $id).sort()
  );
  assert.deepEqual(
    [...paths].sort(),
    files.map((name) => `schemas/authoring/v1alpha1/${name}`).sort()
  );
});
