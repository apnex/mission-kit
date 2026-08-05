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

const question = {
  apiVersion: "schemas.mission-kit/v1alpha1",
  kind: "Question",
  metadata: {
    name: "resource-body-conflict-question"
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

function sessionWithTopLevelAndSnapshot(topLevel, snapshot) {
  const session = matrixSession({
    authoringState: "round_1_frame_required",
    phaseState: "round_1_drafting"
  });
  const closure = contextClosureResource(snapshot, {
    name: "resource-body-conflict-closure"
  });
  const storedTopLevel = storedResourceVersion(topLevel);
  const storedClosure = storedResourceVersion(closure);
  const workspace = session.authoring.workspace;
  workspace.spec.resourceVersions = [storedTopLevel, storedClosure];
  workspace.spec.activeHeads = [
    {
      slot: "resource-body-conflict-question",
      reference: storedTopLevel.reference
    },
    {
      slot: "resource-body-conflict-closure",
      reference: storedClosure.reference
    }
  ];
  sealWorkspace(workspace);
  const journal = structuredClone(session.journal);
  journal.at(-1).after.semanticStateDigest = "$workspace";
  return attachJournal(session, journal);
}

test("a v2 session rejects byte-distinct resource bodies that claim one exact four-field identity", async () => {
  const identical = sessionWithTopLevelAndSnapshot(question, question);
  assert.equal((await validateSessionStructure(identical)).valid, true);
  assert.deepEqual(validateSessionSemantics(identical), []);

  const conflicting = structuredClone(question);
  conflicting.metadata.annotations = {
    "test.mission-kit/body": "conflicting"
  };
  const conflictSession = sessionWithTopLevelAndSnapshot(
    question,
    conflicting
  );
  assert.equal((await validateSessionStructure(conflictSession)).valid, true);
  assert.ok(
    validateSessionSemantics(conflictSession).some(
      (candidate) => (
        candidate.code === "TRANSACTION_RESOURCE_BODY_CONFLICT" &&
        candidate.field.endsWith(
          "/resource/spec/layers/0/sourceSnapshot"
        )
      )
    )
  );
});
