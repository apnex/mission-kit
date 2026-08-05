import assert from "node:assert/strict";
import test from "node:test";
import {
  journalRecordDigest
} from "../../../source/authoring/kernel/digests.mjs";
import {
  validateSessionSemantics
} from "../../../source/authoring/survey/session-semantics.mjs";
import {
  sha256Value
} from "../../../source/executables/runtime/lib/canonical.mjs";
import {
  attachJournal,
  contextClosureResource,
  makeAcceptedEvent,
  makeSession,
  matrixSession,
  runtimeArtifactResource,
  sealWorkspace,
  storedResourceVersion
} from "../../fixtures/survey/session-v2/session-factory.mjs";
import {
  validateSessionStructure
} from "./support/session-validation.mjs";

function replaceRuntimeArtifact(session, resource) {
  const stored = storedResourceVersion(resource);
  const next = structuredClone(session);
  next.authoring.workspace.spec.resourceVersions = [structuredClone(stored)];
  next.authoring.runtimeArtifactReferences = [
    structuredClone(stored.reference)
  ];
  sealWorkspace(next.authoring.workspace);
  return { session: next, stored };
}

function sessionWithContextSource(sourceResource) {
  const session = matrixSession({
    authoringState: "round_1_frame_required",
    phaseState: "round_1_drafting"
  });
  const closure = contextClosureResource(sourceResource, {
    name: "runtime-source-context-closure"
  });
  const stored = storedResourceVersion(closure);
  const workspace = session.authoring.workspace;
  workspace.spec.resourceVersions = [stored];
  workspace.spec.activeHeads = [{
    slot: "runtime-source-context",
    reference: stored.reference
  }];
  sealWorkspace(workspace);
  const journal = structuredClone(session.journal);
  journal.at(-1).after.semanticStateDigest = "$workspace";
  return attachJournal(session, journal);
}

function sessionWithNestedRuntimeArtifact(
  baseSession,
  runtimeResource,
  { declare = false, includeTopLevel = false } = {}
) {
  const session = structuredClone(baseSession);
  const closure = contextClosureResource(runtimeResource, {
    name: "nested-runtime-artifact-closure"
  });
  const storedClosure = storedResourceVersion(closure);
  const storedRuntime = storedResourceVersion(runtimeResource);
  const workspace = session.authoring.workspace;
  workspace.spec.resourceVersions = includeTopLevel
    ? [storedRuntime, storedClosure]
    : [storedClosure];
  workspace.spec.activeHeads = [
    ...(includeTopLevel
      ? [{
        slot: "nested-runtime-artifact",
        reference: storedRuntime.reference
      }]
      : []),
    {
      slot: "nested-runtime-context",
      reference: storedClosure.reference
    }
  ];
  session.authoring.runtimeArtifactReferences = declare
    ? [structuredClone(storedRuntime.reference)]
    : [];
  sealWorkspace(workspace);
  const journal = structuredClone(session.journal);
  journal.at(-1).after.semanticStateDigest = "$workspace";
  return attachJournal(session, journal);
}

function boundRuntimeArtifactSession() {
  const session = matrixSession({
    authoringState: "candidate_ready",
    phaseState: "revision_requested"
  });
  const sourceJournal = session.journal.findLast((entry) =>
    entry.machineEdges.some(
      (edge) =>
        edge.machineId === "phase" &&
        edge.transitionId === "T32" &&
        edge.eventId === "DIRECTOR_RETURN"
    )
  );
  assert.ok(sourceJournal);
  const event = makeAcceptedEvent({
    id: sourceJournal.commitId,
    eventId: "DIRECTOR_RETURN",
    transitionId: "T32",
    actor: {
      role: "director",
      ref: session.authority.directorRef,
      assertionSource: "host-adapter:test"
    },
    payload: {
      correction: "Refine the exact candidate."
    }
  });
  sourceJournal.payloadDigest = sha256Value(event.payload);
  sourceJournal.commandDigest = sha256Value({
    event: event.eventId,
    actor: event.actor,
    payload: event.payload
  });
  sourceJournal.recordDigest = journalRecordDigest(sourceJournal);
  attachJournal(session, session.journal);
  session.events = [event];
  session.revision = 1;

  const resource = runtimeArtifactResource();
  resource.spec.source.surveyRunId = session.sessionId;
  resource.spec.source.sourceSemanticRevision =
    sourceJournal.after.semanticRevision;
  resource.spec.source.sourceDigest = event.digest;
  return replaceRuntimeArtifact(session, resource);
}

test("the v2 session admits only typed immutable SurveyRuntimeArtifact references", async () => {
  const { session, stored: runtimeArtifact } =
    boundRuntimeArtifactSession();
  assert.equal((await validateSessionStructure(session)).valid, true);
  assert.deepEqual(validateSessionSemantics(session), []);

  const malformedVariant = structuredClone(runtimeArtifact.resource);
  malformedVariant.spec.artifactType = "RoundResponseSet";
  const { session: malformedSession } =
    replaceRuntimeArtifact(session, malformedVariant);
  assert.equal((await validateSessionStructure(malformedSession)).valid, false);
  assert.ok(
    validateSessionSemantics(malformedSession).some(
      (item) => item.code === "SESSION_RUNTIME_ARTIFACT_SCHEMA_INVALID"
    )
  );

  const wrongSource = structuredClone(runtimeArtifact.resource);
  wrongSource.spec.source.sourceEventId = "RESPOND_Q3";
  const { session: wrongSourceSession } =
    replaceRuntimeArtifact(session, wrongSource);
  assert.equal((await validateSessionStructure(wrongSourceSession)).valid, true);
  assert.ok(
    validateSessionSemantics(wrongSourceSession).some(
      (item) => item.code === "RUNTIME_SOURCE_EDGE_MISMATCH"
    )
  );

  const sourceFieldCases = [
    {
      field: "surveyRunId",
      value: "foreign-survey-run",
      code: "SESSION_RUNTIME_SOURCE_RUN_MISMATCH"
    },
    {
      field: "sourcePhaseTransitionId",
      value: "T33",
      code: "SESSION_RUNTIME_SOURCE_EVENT_UNRESOLVED"
    },
    {
      field: "sourceSemanticRevision",
      value:
        runtimeArtifact.resource.spec.source.sourceSemanticRevision + 1,
      code: "SESSION_RUNTIME_SOURCE_REVISION_MISMATCH"
    },
    {
      field: "sourceDigest",
      value: `sha256:${"b".repeat(64)}`,
      code: "SESSION_RUNTIME_SOURCE_DIGEST_MISMATCH"
    }
  ];
  for (const { field, value, code } of sourceFieldCases) {
    const changed = structuredClone(runtimeArtifact.resource);
    changed.spec.source[field] = value;
    const { session: changedSession } =
      replaceRuntimeArtifact(session, changed);
    assert.ok(
      validateSessionSemantics(changedSession).some(
        (item) => item.code === code
      ),
      `${field} must fail with ${code}`
    );
  }

  const selfAssertedPayload = structuredClone(session);
  selfAssertedPayload.journal.at(-1).payloadDigest =
    `sha256:${"c".repeat(64)}`;
  selfAssertedPayload.journal.at(-1).recordDigest =
    journalRecordDigest(selfAssertedPayload.journal.at(-1));
  assert.ok(
    validateSessionSemantics(selfAssertedPayload).some(
      (item) => item.code === "SESSION_RUNTIME_SOURCE_PAYLOAD_MISMATCH"
    )
  );

  const wrongType = structuredClone(session);
  wrongType.authoring.runtimeArtifactReferences[0].kind = "RoundResponseSet";
  assert.equal((await validateSessionStructure(wrongType)).valid, false);
  assert.ok(
    validateSessionSemantics(wrongType).some(
      (item) =>
        item.code === "SESSION_RUNTIME_ARTIFACT_REFERENCE_TYPE_MISMATCH"
    )
  );

  const unresolved = makeSession({
    runtimeArtifactReferences: [runtimeArtifact.reference]
  });
  assert.ok(
    validateSessionSemantics(unresolved).some(
      (item) => item.code === "SESSION_RUNTIME_ARTIFACT_UNRESOLVED"
    )
  );

  const nestedOnly = sessionWithNestedRuntimeArtifact(
    session,
    runtimeArtifact.resource
  );
  assert.ok(
    validateSessionSemantics(nestedOnly).some(
      (item) => (
        item.code === "SESSION_RUNTIME_ARTIFACT_REFERENCE_REQUIRED" &&
        item.field.includes("/resource/spec/layers/0/sourceSnapshot")
      )
    )
  );

  const declaredNestedOnly = sessionWithNestedRuntimeArtifact(
    session,
    runtimeArtifact.resource,
    { declare: true }
  );
  assert.ok(
    validateSessionSemantics(declaredNestedOnly).some(
      (item) => (
        item.code === "SESSION_RUNTIME_ARTIFACT_UNRESOLVED" &&
        item.field.includes("/resource/spec/layers/0/sourceSnapshot")
      )
    )
  );

  const resolvedNested = sessionWithNestedRuntimeArtifact(
    session,
    runtimeArtifact.resource,
    { declare: true, includeTopLevel: true }
  );
  assert.equal((await validateSessionStructure(resolvedNested)).valid, true);
  assert.deepEqual(validateSessionSemantics(resolvedNested), []);

  const inlineVariant = storedResourceVersion({
    ...runtimeArtifact.resource,
    kind: "RoundResponseSet"
  });
  assert.ok(
    validateSessionSemantics(makeSession({
      resourceVersions: [inlineVariant]
    })).some(
      (item) => item.code === "SESSION_INLINE_RUNTIME_VARIANT_FORBIDDEN"
    )
  );

  const unboundRuntimeSnapshot = {
    apiVersion: "runtime.unregistered/v1alpha1",
    kind: "SessionDump",
    metadata: {
      name: "inline-runtime-session-dump"
    },
    spec: {
      phase: "round_1_q1_ready",
      responses: []
    }
  };
  const unboundRuntimeSession = sessionWithContextSource(
    unboundRuntimeSnapshot
  );
  assert.equal(
    (await validateSessionStructure(unboundRuntimeSession)).valid,
    true
  );
  assert.ok(
    validateSessionSemantics(unboundRuntimeSession).some(
      (item) => (
        item.code === "SESSION_RESOURCE_TYPE_UNBOUND" &&
        item.field.includes(
          "/resource/spec/layers/0/sourceSnapshot"
        )
      )
    )
  );
  const topLevelUnboundRuntimeSession = makeSession({
    resourceVersions: [
      storedResourceVersion(unboundRuntimeSnapshot)
    ]
  });
  assert.equal(
    (await validateSessionStructure(topLevelUnboundRuntimeSession)).valid,
    true
  );
  assert.ok(
    validateSessionSemantics(topLevelUnboundRuntimeSession).some(
      (item) => (
        item.code === "SESSION_RESOURCE_TYPE_UNBOUND" &&
        item.field.endsWith(
          "/authoring/workspace/spec/resourceVersions/0/resource"
        )
      )
    )
  );
});
