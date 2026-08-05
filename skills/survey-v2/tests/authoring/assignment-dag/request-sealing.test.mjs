import assert from "node:assert/strict";
import test from "node:test";

import {
  requestCoreDigest
} from "../../../source/authoring/kernel/digests.mjs";
import {
  validateContractSemantics
} from "../../../source/authoring/kernel/contract-semantics.mjs";
import {
  sealAuthoringRequest
} from "../../../source/authoring/kernel/assignment-dag.mjs";
import {
  contractValidators
} from "../contracts/support/contract-validation.mjs";
import {
  loadK10AssignmentScenario
} from "./support.mjs";

test("request sealing closes the semantic-state edge before later DAG identities exist", async () => {
  const { byStem } = await contractValidators();
  const validateStructure = byStem.get("authoring-request");
  const validateRequestContract = (candidate) =>
    validateStructure(candidate) &&
    validateContractSemantics(candidate).length === 0;
  const { request } = await loadK10AssignmentScenario();
  const draft = structuredClone(request);
  delete draft.spec.requestDigest;

  const sealed = sealAuthoringRequest(draft, {
    validateRequestContract
  });

  assert.equal(sealed.spec.requestDigest, requestCoreDigest(sealed));
  assert.equal(Object.hasOwn(sealed.spec, "handle"), false);
  assert.equal(Object.hasOwn(sealed.spec, "blankViewDigest"), false);
  assert.equal(Object.hasOwn(sealed.spec, "projectionArtifactDigest"), false);
  assert.equal(Object.hasOwn(sealed.spec, "assignmentDigest"), false);
});
