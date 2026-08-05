import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  mutationDigest,
  resourceIntegrityDigest,
  resourceReferenceFrom
} from "../../../source/authoring/kernel/digests.mjs";
import {
  LOCAL_AUTHORING_RESOURCE_SCHEMA_IDS,
  validateSessionSemantics
} from "../../../source/authoring/survey/session-semantics.mjs";
import {
  attachJournal,
  candidateProtocol,
  contextClosureResource,
  makeWorkspace,
  matrixSession,
  sealWorkspace,
  storedResourceVersion
} from "../../fixtures/survey/session-v2/session-factory.mjs";
import {
  validateSessionStructure
} from "./support/session-validation.mjs";

const validAuthoringProtocol = candidateProtocol.machines.find(
  (machine) => machine.id === "authoring"
).protocol;
const validAuthoringMutation = JSON.parse(await readFile(
  new URL(
    "../../fixtures/authoring/contracts/positive/authoring-mutation.json",
    import.meta.url
  ),
  "utf8"
));

function mutationContaining(resource) {
  const mutation = structuredClone(validAuthoringMutation);
  const created = mutation.spec.createdResources[0];
  created.reference = resourceReferenceFrom(resource);
  created.integrityDigest = resourceIntegrityDigest(resource);
  created.resource = structuredClone(resource);
  mutation.spec.mutationDigest = mutationDigest(mutation);
  return mutation;
}

function sessionContaining(resource) {
  const session = matrixSession({
    authoringState: "survey_frame_required",
    phaseState: "round_1_drafting"
  });
  const stored = storedResourceVersion(resource);
  const workspace = session.authoring.workspace;
  workspace.spec.resourceVersions = [stored];
  workspace.spec.activeHeads = [{
    slot: "authoring-protocol",
    reference: stored.reference
  }];
  sealWorkspace(workspace);
  const journal = structuredClone(session.journal);
  journal.at(-1).after.semanticStateDigest = "$workspace";
  return attachJournal(session, journal);
}

test("a v2 session rejects malformed resources for every registered package-owned Authoring kind through sovereign validators", async () => {
  const locallyOwnedKinds = [
    "AuthoringAssignment",
    "AuthoringCommitReceipt",
    "AuthoringFormDefinition",
    "AuthoringMutation",
    "AuthoringProfileManifest",
    "AuthoringProtocol",
    "AuthoringRequest",
    "AuthoringSubmission",
    "AuthoringWorkspace",
    "ContextClosure",
    "ProjectionArtifact",
    "SourceSnapshot",
    "ValidationIssue"
  ];
  assert.deepEqual(
    Object.keys(LOCAL_AUTHORING_RESOURCE_SCHEMA_IDS),
    locallyOwnedKinds
  );

  const validSession = sessionContaining(validAuthoringProtocol);
  assert.equal((await validateSessionStructure(validSession)).valid, true);
  assert.deepEqual(validateSessionSemantics(validSession), []);

  for (const kind of locallyOwnedKinds) {
    const structurallyMalformed = {
      apiVersion: "authoring.mission-kit/v1alpha1",
      kind,
      metadata: {
        name: `malformed-${kind.toLowerCase()}`
      },
      spec: {}
    };
    const malformedSession = sessionContaining(structurallyMalformed);
    assert.equal((await validateSessionStructure(malformedSession)).valid, true);
    assert.ok(
      validateSessionSemantics(malformedSession).some(
        (item) => item.code === "SESSION_AUTHORING_RESOURCE_SCHEMA_INVALID"
      ),
      kind
    );
  }

  const semanticallyMalformed = structuredClone(validAuthoringProtocol);
  semanticallyMalformed.spec.states[1].id =
    semanticallyMalformed.spec.states[0].id;
  const semanticSession = sessionContaining(semanticallyMalformed);
  assert.equal((await validateSessionStructure(semanticSession)).valid, true);
  assert.ok(
    validateSessionSemantics(semanticSession).some(
      (item) => (
        item.code === "SESSION_AUTHORING_RESOURCE_SEMANTIC_INVALID" &&
        item.reason.includes("STATE_ID_DUPLICATE")
      )
    )
  );

  const malformedNestedSource = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "SourceSnapshot",
    metadata: {
      name: "malformed-nested-source"
    },
    spec: {}
  };
  const nestedContainerCases = [
    {
      label: "ContextClosure sourceSnapshot",
      path: "/resource/spec/layers/0/sourceSnapshot",
      resource: contextClosureResource(
        malformedNestedSource,
        { name: "malformed-authoring-source-closure" }
      )
    },
    {
      label: "AuthoringMutation created resource",
      path: "/resource/spec/createdResources/0/resource",
      resource: mutationContaining(malformedNestedSource)
    },
    {
      label: "AuthoringWorkspace stored resource",
      path: "/resource/spec/resourceVersions/0/resource",
      resource: makeWorkspace({
        resourceVersions: [storedResourceVersion(malformedNestedSource)]
      })
    }
  ];
  for (const candidate of nestedContainerCases) {
    const nestedSession = sessionContaining(candidate.resource);
    assert.equal(
      (await validateSessionStructure(nestedSession)).valid,
      true,
      candidate.label
    );
    assert.ok(
      validateSessionSemantics(nestedSession).some(
        (item) => (
          item.code === "SESSION_AUTHORING_RESOURCE_SCHEMA_INVALID" &&
          item.field.includes(candidate.path)
        )
      ),
      candidate.label
    );
  }
});
