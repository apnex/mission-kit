import assert from "node:assert/strict";
import test from "node:test";
import {
  initializationRequest,
  makeV2Adapter,
} from "../helpers/subject-adapter-fixture.mjs";

test("Survey subject cold resume rehydrates the exact requested state root", async () => {
  const { adapter } = makeV2Adapter();
  const initialized = await adapter.initialize(initializationRequest());
  const resumed = await adapter.coldResume({
    sessionRef: initialized.sessionRef,
    expectedStateRoot: initialized.subjectStateRoot,
  });
  assert.equal(resumed.subjectStateRoot, initialized.subjectStateRoot);
  assert.equal(resumed.revision, initialized.revision);
});
