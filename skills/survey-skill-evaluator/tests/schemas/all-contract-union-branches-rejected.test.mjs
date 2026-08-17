import assert from "node:assert/strict";
import test from "node:test";
import { validateSchemaInstance } from "../../source/executables/shared/schema-validator.mjs";
import {
  conditionalRejectionFixture,
  containsConditional,
  generatedContractFixtureSet,
  synthesize,
} from "./schema-contract-fixtures.mjs";

test("every contract with a conditional union rejects a broken selected branch", async (t) => {
  const { generated } = generatedContractFixtureSet();
  const conditional = [...generated].filter(([, schema]) =>
    containsConditional(schema),
  );
  assert.ok(conditional.length > 0);
  for (const [pathname, schema] of conditional) {
    await t.test(pathname, () => {
      const instance = synthesize(schema);
      const hostile = conditionalRejectionFixture(schema, instance);
      assert.notEqual(hostile, null, `${pathname} has no reachable branch`);
      assert.notDeepEqual(validateSchemaInstance(schema, hostile), []);
    });
  }
});

