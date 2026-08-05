import assert from "node:assert/strict";
import test from "node:test";
import {
  textContentBytes,
} from "../../../source/authoring/kernel/text-forms.mjs";
import {
  createIssuedTransactionScenario,
} from "./support.mjs";

test("a K12 task becomes one complete deterministic K11 Assignment DAG", async () => {
  const { issued } = await createIssuedTransactionScenario();
  assert.deepEqual(
    {
      kind: issued.kind,
      handle: issued.assignment.spec.handle,
      retainedKinds: issued.retainedResourceVersions.map(
        (entry) => entry.resource.kind,
      ),
      viewMatches:
        Buffer.compare(
          issued.viewBytes,
          textContentBytes(issued.assignment.spec.uneditedSkeleton.content),
        ) === 0,
    },
    {
      kind: "assignment",
      handle: "2810af35",
      retainedKinds: [
        "ContextClosure",
        "AuthoringRequest",
        "ProjectionArtifact",
        "AuthoringAssignment",
      ],
      viewMatches: true,
    },
  );
});
