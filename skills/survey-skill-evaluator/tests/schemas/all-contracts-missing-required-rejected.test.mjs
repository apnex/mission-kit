import assert from "node:assert/strict";
import test from "node:test";
import { validateSchemaInstance } from "../../source/executables/shared/schema-validator.mjs";
import {
  firstDomainRequired,
  generatedContractFixtureSet,
  synthesize,
} from "./schema-contract-fixtures.mjs";

test("every explicit schema rejects an instance missing a domain-required field", async (t) => {
  const { generated } = generatedContractFixtureSet();
  for (const [pathname, schema] of generated) {
    await t.test(pathname, () => {
      const instance = synthesize(schema);
      const required = firstDomainRequired(schema);
      assert.equal(typeof required, "string", `${pathname} has no domain field`);
      delete instance[required];
      assert.notDeepEqual(validateSchemaInstance(schema, instance), []);
    });
  }
});

