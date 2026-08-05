import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);
const snapshotPath = path.join(
  packageRoot,
  "tests/fixtures/authoring/contracts/k10-authoring-schema-closure.snapshot.json"
);

const sha256 = (value) => (
  `sha256:${createHash("sha256").update(value).digest("hex")}`
);

const unique = (values) => new Set(values).size === values.length;

test("K10 authoring schema closure contains exactly sixteen package-bound neutral authorities", async () => {
  const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
  const { provenance, reconstruction, entries } = snapshot.spec;

  assert.deepEqual(Object.keys(snapshot), ["apiVersion", "kind", "metadata", "spec"]);
  assert.deepEqual(Object.keys(snapshot.metadata), ["name"]);
  assert.deepEqual(
    Object.keys(snapshot.spec),
    ["provenance", "reconstruction", "authorityCount", "entries", "closureDigest"]
  );
  assert.equal(snapshot.apiVersion, "mission-kit.apnex.io/v1alpha1");
  assert.equal(snapshot.kind, "AuthoringSchemaClosureSnapshot");
  assert.equal(snapshot.metadata.name, "survey-v2-k10-authoring-schema-closure");
  assert.deepEqual(provenance, {
    repository: "github.com/apnex/mission-kit",
    commit: "7ac4174c2a4816512e22a4e0ae09250750b67fc2",
    tree: "e9ed4c7481f8c95eaa83cce0387e9d258e6056f1",
    packageManifest: {
      path: "skills/survey-v2/survey-v2.package.json",
      byteCount: 72234,
      byteDigest: "sha256:a20090e42b741efb6d0730021cad850b568d00e10f756eaccc2bdccb7bd51884",
      gitBlobOid: "sha1:231d7fd8d2cf90bbff94e69fa3dba0c9579b5f40"
    },
    implementationReceipt: {
      name: "K10-receipt",
      path: "work-packages/K10/receipt.json",
      byteDigest: "sha256:3915bd29d45f5b8376d729fb9136d2a9f38fe20068cae7801ca8a686f8220a81",
      evidenceManifestPath: "work-packages/K10/evidence-manifest.json",
      evidenceManifestDigest: "sha256:8e7e580e0b325d5e8bd3acf3659b1e41ab0e7c31d5d1644b2ac80ceb936d0ce5"
    }
  });
  assert.deepEqual(reconstruction, {
    authorityPrefix: "urn:mission-kit:authoring:schema:",
    schemaPathPrefix: "schemas/authoring/v1alpha1/",
    authoritySelection: "package manifest schemas whose id starts with authorityPrefix",
    entryBinding: "manifest id and path equal the exact Git blob JSON $id and package-relative path",
    entryOrder: "path ascending by Unicode code point",
    byteDigest: "sha256 over exact Git blob bytes",
    closureDigest: "sha256 over UTF-8 JSON.stringify(entries)"
  });

  assert.equal(entries.length, 16);
  assert.equal(snapshot.spec.authorityCount, 16);
  assert.ok(entries.every(({ id }) => id.startsWith(reconstruction.authorityPrefix)));
  assert.ok(entries.every(({ path: entryPath }) => (
    entryPath.startsWith(reconstruction.schemaPathPrefix)
  )));
  assert.ok(entries.every(({ byteCount }) => (
    Number.isSafeInteger(byteCount) && byteCount > 0
  )));
  assert.ok(entries.every(({ byteDigest }) => /^sha256:[0-9a-f]{64}$/.test(byteDigest)));
  assert.ok(entries.every(({ gitBlobOid }) => /^sha1:[0-9a-f]{40}$/.test(gitBlobOid)));
  assert.ok(entries.every((entry) => (
    JSON.stringify(Object.keys(entry))
      === JSON.stringify(["id", "path", "byteCount", "byteDigest", "gitBlobOid"])
  )));

  const paths = entries.map(({ path: entryPath }) => entryPath);
  assert.deepEqual(paths, [...paths].sort());
  assert.ok(unique(entries.map(({ id }) => id)), "schema IDs must be duplicate-free");
  assert.ok(unique(paths), "schema paths must be duplicate-free");
  assert.ok(unique(entries.map(({ gitBlobOid }) => gitBlobOid)), "Git blobs must be duplicate-free");
  assert.ok(unique(entries.map(({ byteDigest }) => byteDigest)), "schema bytes must be duplicate-free");
  assert.equal(
    snapshot.spec.closureDigest,
    "sha256:02af90257b41ccddff13f1a288b21c49356036f8c363c12acc7472cefbb93cba"
  );
  assert.equal(sha256(JSON.stringify(entries)), snapshot.spec.closureDigest);
});
