import test from "node:test";

import {
  sealAuthoringRequest
} from "../../../source/authoring/kernel/assignment-dag.mjs";
import {
  assertDagError,
  loadK10AssignmentScenario
} from "./support.mjs";

test("request sealing requires one positive closed-contract validator result", async () => {
  const { request } = await loadK10AssignmentScenario();
  const draft = structuredClone(request);
  delete draft.spec.requestDigest;

  assertDagError(
    () => sealAuthoringRequest(draft),
    "DAG_REQUEST_VALIDATOR_REQUIRED"
  );
  assertDagError(
    () => sealAuthoringRequest(draft, {
      validateRequestContract: () => false
    }),
    "DAG_REQUEST_CONTRACT_INVALID"
  );
  assertDagError(
    () => sealAuthoringRequest(draft, {
      validateRequestContract: async () => true
    }),
    "DAG_REQUEST_CONTRACT_INVALID"
  );
});
