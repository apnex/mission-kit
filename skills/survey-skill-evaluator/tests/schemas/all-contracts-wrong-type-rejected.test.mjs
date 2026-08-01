import assert from "node:assert/strict";
import test from "node:test";
import { validateSchemaInstance } from "../../source/executables/shared/schema-validator.mjs";
import {
  firstDomainRequired,
  generatedContractFixtureSet,
  synthesize,
  wrongTypeValue,
} from "./schema-contract-fixtures.mjs";

test("every explicit schema rejects a wrong-typed domain-required field", async (t) => {
  const { generated } = generatedContractFixtureSet();
  for (const [pathname, schema] of generated) {
    await t.test(pathname, () => {
      const instance = synthesize(schema);
      const required = firstDomainRequired(schema);
      instance[required] = wrongTypeValue(schema.properties[required], schema);
      assert.notDeepEqual(validateSchemaInstance(schema, instance), []);
    });
  }
});

