import assert from "node:assert/strict";
import test from "node:test";
import { SchemaValidator } from "../../source/executables/engine/index.mjs";
import { packageRoot } from "../helpers/campaign-fixture.mjs";

const digest = (character) => character.repeat(64);

test("private semantic contracts bind latent intent, constraints, priorities, uncertainty, equivalence, and prohibited invention", async () => {
  const validator = await SchemaValidator.fromPackageRoot(packageRoot);
  const latentIntent = {
    schemaVersion: "1.0.0",
    hashProfileId: "survey-evaluator-sha256-jcs-v1",
    latentIntentId: "intent-1",
    scenarioId: "scenario-1",
    goals: ["Recover the governing decision."],
    constraints: ["Do not invent deployment authority."],
    priorities: [
      {
        priorityId: "safety-first",
        rank: 1,
        statement: "Preserve the non-promotion boundary.",
      },
    ],
    tensions: ["Speed conflicts with independent review."],
    uncertainties: ["The target sample size is not yet calibrated."],
    permissibleUnderdetermination: ["Equivalent neutral wording is allowed."],
    provenanceRoots: [digest("a")],
    authorityAttestation: {
      authorityId: "scenario-authority",
      statementDigest: digest("b"),
      signature: "fixture-signature",
    },
  };
  const persona = {
    schemaVersion: "1.0.0",
    hashProfileId: "survey-evaluator-sha256-jcs-v1",
    personaBriefId: "persona-1",
    scenarioId: "scenario-1",
    latentIntentDigest: digest("c"),
    enactedBehaviorClass: "correction_prone",
    permissibleKnowledge: ["The public work item."],
    prohibitedDisclosure: ["The evaluator semantic key."],
    interactionBehaviors: ["withhold_then_correct"],
    principalRef: "attempt-1-director",
    bearerCapabilityIncluded: false,
  };
  const semanticKey = {
    schemaVersion: "1.0.0",
    hashProfileId: "survey-evaluator-sha256-jcs-v1",
    semanticKeyId: "key-1",
    scenarioId: "scenario-1",
    latentIntentDigest: persona.latentIntentDigest,
    key: {
      purpose: "survey",
      requiredMeaning: ["Preserve the release boundary."],
      optionalMeaning: ["Prefer concise wording."],
      prohibitedMeaning: ["The candidate may self-promote."],
      rubricDigest: digest("d"),
    },
    equivalenceClassesRoot: digest("e"),
    priorityRelationsRoot: digest("f"),
    tensions: latentIntent.tensions,
    uncertainties: latentIntent.uncertainties,
    exactAnswerScript: false,
  };
  assert.equal(validator.check("latent-intent", latentIntent).valid, true);
  assert.equal(validator.check("persona-brief", persona).valid, true);
  assert.equal(validator.check("semantic-key", semanticKey).valid, true);

  const missingFields = [
    ["latent-intent", latentIntent, "constraints"],
    ["latent-intent", latentIntent, "priorities"],
    ["latent-intent", latentIntent, "uncertainties"],
    ["semantic-key", semanticKey, "equivalenceClassesRoot"],
  ];
  for (const [schema, value, field] of missingFields) {
    const mutation = structuredClone(value);
    delete mutation[field];
    assert.equal(
      validator.check(schema, mutation).valid,
      false,
      `${schema} must reject missing ${field}`,
    );
  }
  const noProhibition = structuredClone(semanticKey);
  delete noProhibition.key.prohibitedMeaning;
  assert.equal(validator.check("semantic-key", noProhibition).valid, false);
  assert.equal(
    validator.check("semantic-key", {
      ...semanticKey,
      exactAnswerScript: true,
    }).valid,
    false,
  );
});
