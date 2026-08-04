import assert from "node:assert/strict";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import { createFixture, refreshOptions } from "./support/fixture.mjs";

test("closure manifest records identities paths bytes digests media types roles and bindings", async () => {
  const fixture = await createFixture();
  try {
    const { manifest } = await refreshSharedSchemaSnapshot(refreshOptions(fixture));
    assert.match(manifest.rootListDigest, /^sha256:[0-9a-f]{64}$/);
    assert.match(manifest.closureDigest, /^sha256:[0-9a-f]{64}$/);
    assert.equal(manifest.catalog.mediaType, "application/json");
    assert.ok(manifest.catalog.bytes > 0);
    for (const schema of manifest.schemas) {
      assert.match(schema.id, /^urn:mission-kit:schemas:/);
      assert.ok(schema.sourcePath.length > 0);
      assert.ok(schema.snapshotPath.length > 0);
      assert.ok(schema.bytes > 0);
      assert.match(schema.exactDigest, /^sha256:[0-9a-f]{64}$/);
      assert.match(schema.semanticDigest, /^sha256:[0-9a-f]{64}$/);
      assert.equal(schema.mediaType, "application/schema+json");
      assert.match(schema.memberRole, /^(?:fragment|resource)$/);
    }
    for (const validator of manifest.validators) {
      assert.ok(validator.bytes > 0);
      assert.match(validator.exactDigest, /^sha256:[0-9a-f]{64}$/);
      assert.equal(validator.mediaType, "text/javascript");
      assert.match(validator.memberRole, /^(?:entry|support)$/);
    }
    assert.deepEqual(
      manifest.resources.map(({ kind }) => kind).sort(),
      ["ContextFrame", "Question"]
    );
  } finally {
    await fixture.cleanup();
  }
});
