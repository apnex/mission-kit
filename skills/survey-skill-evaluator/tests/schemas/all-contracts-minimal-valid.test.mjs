import assert from "node:assert/strict";
import test from "node:test";
import { validateSchemaInstance } from "../../source/executables/shared/schema-validator.mjs";
import {
  generatedContractFixtureSet,
  synthesize,
} from "./schema-contract-fixtures.mjs";

test("every explicit schema accepts a generated minimal valid instance", async (t) => {
  const { generated } = generatedContractFixtureSet();
  for (const [pathname, schema] of generated) {
    await t.test(pathname, () => {
      const instance = synthesize(schema);
      assert.deepEqual(validateSchemaInstance(schema, instance), []);
    });
  }
});

