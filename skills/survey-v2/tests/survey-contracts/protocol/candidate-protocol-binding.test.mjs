import assert from "node:assert/strict";
import test from "node:test";
import {
  surveyAuthoringProtocolDigest,
  validateSurveyProtocolV2
} from "../../../source/authoring/survey/protocol-semantics.mjs";
import {
  assertStructurallyValid,
  loadProtocolContractSet
} from "./support.mjs";

test("candidate protocol 2.x binds the exact canonical authoring-protocol digest and retires T42 through T46", async () => {
  const {
    authoringProtocol,
    protocol,
    goldenBindings
  } = await loadProtocolContractSet();
  await assertStructurallyValid(
    "urn:mission-kit:survey-v2:schema:protocol:v2",
    protocol
  );
  assert.deepEqual(
    validateSurveyProtocolV2(protocol, { authoringProtocol }),
    []
  );
  assert.equal(
    surveyAuthoringProtocolDigest(authoringProtocol),
    goldenBindings.authoringProtocolSemanticDigest
  );
  assert.equal(
    protocol.authoringProtocol.semanticDigest,
    goldenBindings.authoringProtocolSemanticDigest
  );
  assert.deepEqual(
    protocol.machines.map((machine) => machine.id),
    ["phase", "runtime"]
  );
  const phase = protocol.machines[0];
  const retired = new Set(["T42", "T43", "T44", "T45", "T46"]);
  assert.equal(
    phase.transitions.some((transition) => retired.has(transition.id)),
    false
  );
  for (const suffix of ["42", "43", "44", "45", "46"]) {
    assert.equal(
      [...phase.guards, ...phase.actions, ...phase.mutations]
        .some((definition) => (
          definition.id === `G${suffix}` ||
          definition.id === `A${suffix}` ||
          definition.id === `M${suffix}`
        )),
      false
    );
  }
});
