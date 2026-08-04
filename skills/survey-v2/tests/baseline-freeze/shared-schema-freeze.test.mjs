import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateSharedSchemaFreeze } from "./freeze-contract.mjs";

test("shared-schema freeze closes every path, schema identity, catalog binding, validator, and reference", async () => {
  const fixture = JSON.parse(
    await readFile(new URL("./shared-schema.freeze.json", import.meta.url), "utf8")
  );
  assert.equal(validateSharedSchemaFreeze(fixture), fixture);
  const openClosure = structuredClone(fixture);
  openClosure.transitiveClosure.pop();
  assert.throws(
    () => validateSharedSchemaFreeze(openClosure),
    (error) => error.code === "BASELINE_FREEZE_INVALID"
  );
  const missingQuestionDependency = structuredClone(fixture);
  missingQuestionDependency.transitiveClosure[0].references.pop();
  assert.throws(
    () => validateSharedSchemaFreeze(missingQuestionDependency),
    (error) => error.code === "BASELINE_FREEZE_INVALID"
  );
});
