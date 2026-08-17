import assert from "node:assert/strict";
import test from "node:test";
import {
  SchemaValidator,
} from "../../source/executables/engine/index.mjs";
import { packageRoot } from "../helpers/package-root.mjs";
import { synthesize } from "./schema-contract-fixtures.mjs";

test("generated closed schemas reject undeclared properties", async () => {
  const validator = await SchemaValidator.fromPackageRoot(packageRoot);
  const schema = validator.schema("campaign");
  const value = synthesize(schema);
  assert.equal(validator.check("campaign", value).valid, true);
  value.surprise = true;
  assert.equal(validator.check("campaign", value).valid, false);
});
