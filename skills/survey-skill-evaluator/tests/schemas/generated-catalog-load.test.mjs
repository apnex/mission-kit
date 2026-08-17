import assert from "node:assert/strict";
import test from "node:test";
import { SchemaValidator } from "../../source/executables/engine/index.mjs";
import { packageRoot } from "../helpers/package-root.mjs";

test("generated schema catalog loads all closed foundation contracts", async () => {
  const validator = await SchemaValidator.fromPackageRoot(packageRoot);
  assert.equal(validator.catalog.schemas.length, 141);
  assert.equal(validator.schemas.size, 141 * 3);
  assert.equal(
    validator.schema("event").$id,
    "urn:mission-kit:survey-skill-evaluator:event",
  );
});
