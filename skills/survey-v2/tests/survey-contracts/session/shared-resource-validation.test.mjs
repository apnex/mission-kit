import assert from "node:assert/strict";
import test from "node:test";
import {
  validateSessionSemantics
} from "../../../source/authoring/survey/session-semantics.mjs";
import {
  attachJournal,
  contextClosureResource,
  matrixSession,
  sealWorkspace,
  storedResourceVersion
} from "../../fixtures/survey/session-v2/session-factory.mjs";
import {
  validateSessionStructure
} from "./support/session-validation.mjs";

const validQuestion = {
  apiVersion: "schemas.mission-kit/v1alpha1",
  kind: "Question",
  metadata: {
    name: "shared-resource-validation-question"
  },
  spec: {
    prompt: {
      text: "Which delivery posture should be preferred?"
    },
    response: {
      type: "Choice",
      cardinality: {
        minimum: 1,
        maximum: 1
      },
      options: [
        {
          id: "steady",
          label: "Steady",
          meaning: "Prefer predictable incremental delivery."
        },
        {
          id: "rapid",
          label: "Rapid",
          meaning: "Prefer the shortest delivery interval."
        }
      ],
      constraints: []
    }
  }
};

const validContextFrame = {
  apiVersion: "schemas.mission-kit/v1alpha1",
  kind: "ContextFrame",
  metadata: {
    name: "shared-resource-validation-frame"
  },
  spec: {
    subject: "Delivery posture",
    purpose: "Bound the delivery decision.",
    scope: {
      included: ["Release cadence"],
      excluded: ["Runtime implementation"]
    },
    givens: [],
    synopsis: "Choose a delivery posture within the declared scope.",
    terms: []
  }
};

function sessionContaining(resource) {
  const session = resource.kind === "Question"
    ? matrixSession({
      authoringState: "waiting_for_round_1_responses",
      phaseState: "round_1_q1_ready"
    })
    : matrixSession({
      authoringState: "round_1_frame_required",
      phaseState: "round_1_drafting"
    });
  const stored = storedResourceVersion(resource);
  const workspace = session.authoring.workspace;
  workspace.spec.resourceVersions = [stored];
  workspace.spec.activeHeads = [{
    slot: `shared-${resource.kind.toLowerCase()}`,
    reference: stored.reference
  }];
  sealWorkspace(workspace);
  const journal = structuredClone(session.journal);
  journal.at(-1).after.semanticStateDigest = "$workspace";
  return attachJournal(session, journal);
}

test("a v2 session validates every locally bound shared resource against its frozen structural and semantic authorities", async () => {
  for (const validResource of [validQuestion, validContextFrame]) {
    const session = sessionContaining(validResource);
    assert.equal((await validateSessionStructure(session)).valid, true);
    assert.deepEqual(validateSessionSemantics(session), []);
  }

  const structurallyMalformed = structuredClone(validQuestion);
  structurallyMalformed.spec = {};
  const malformedSession = sessionContaining(structurallyMalformed);
  assert.equal((await validateSessionStructure(malformedSession)).valid, true);
  assert.ok(
    validateSessionSemantics(malformedSession).some(
      (item) => item.code === "SESSION_SHARED_RESOURCE_SCHEMA_INVALID"
    )
  );

  const semanticallyMalformed = structuredClone(validQuestion);
  semanticallyMalformed.spec.response.options[1].id = "steady";
  const semanticSession = sessionContaining(semanticallyMalformed);
  assert.equal((await validateSessionStructure(semanticSession)).valid, true);
  assert.ok(
    validateSessionSemantics(semanticSession).some(
      (item) => (
        item.code === "SESSION_SHARED_RESOURCE_SEMANTIC_INVALID" &&
        item.reason.includes("DUPLICATE_OPTION_ID")
      )
    )
  );

  const conflictingFrame = structuredClone(validContextFrame);
  conflictingFrame.spec.scope.excluded = ["Release cadence"];
  const frameSession = sessionContaining(conflictingFrame);
  assert.equal((await validateSessionStructure(frameSession)).valid, true);
  assert.ok(
    validateSessionSemantics(frameSession).some(
      (item) => (
        item.code === "SESSION_SHARED_RESOURCE_SEMANTIC_INVALID" &&
        item.reason.includes("CROSS_BOUNDARY_SCOPE_STATEMENT")
      )
    )
  );

  const malformedNestedQuestion = structuredClone(validQuestion);
  delete malformedNestedQuestion.spec.prompt;
  const nestedSession = sessionContaining(contextClosureResource(
    malformedNestedQuestion,
    { name: "malformed-shared-source-closure" }
  ));
  assert.equal((await validateSessionStructure(nestedSession)).valid, true);
  assert.ok(
    validateSessionSemantics(nestedSession).some(
      (item) => (
        item.code === "SESSION_SHARED_RESOURCE_SCHEMA_INVALID" &&
        item.field.includes(
          "/resource/spec/layers/0/sourceSnapshot"
        )
      )
    )
  );
});
