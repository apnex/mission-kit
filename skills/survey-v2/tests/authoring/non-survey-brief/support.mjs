import Ajv2020 from "ajv/dist/2020.js";
import {
  createTextSubmission,
} from "../../../source/authoring/kernel/assignment-dag.mjs";
import {
  sha256Value,
} from "../../../source/authoring/kernel/canonical.mjs";
import {
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  compileExecutableRegistry,
  invokeProjector,
} from "../../../source/authoring/kernel/executable-registry.mjs";
import {
  renderPopulatedTextForm,
  textContentBytes,
} from "../../../source/authoring/kernel/text-forms.mjs";
import {
  createInMemoryAuthoringStore,
  createInMemoryJournalIdentityConfiguration,
} from "../../../source/authoring/adapters/in-memory-store.mjs";
import {
  compileJournalIdentityPort,
} from "../../../source/authoring/runtime/journal-replay.mjs";
import {
  createAuthoringTransactionCoordinator,
} from "../../../source/authoring/runtime/transaction-coordinator.mjs";
import {
  resealWorkspace,
  workspaceRevisionState,
} from "../../../source/authoring/runtime/workspace-application.mjs";
import {
  contractValidators,
} from "../contracts/support/contract-validation.mjs";
import {
  BRIEF_AUTHORING_MACHINE_ID,
  BRIEF_STORE_ID,
  loadBriefProfileFixture,
} from "../../fixtures/authoring/non-survey-brief/brief-profile.mjs";
import {
  createBriefExecutableRegistry,
} from "../../fixtures/authoring/non-survey-brief/profile-executables.mjs";

const authenticationKey = Buffer.from(
  "4b8da62993a64e11b28e915623059a09" +
  "12dce774942c4bb38af761fb8c49cc4a",
  "hex",
);

const kindToContractStem = Object.freeze({
  AuthoringAssignment: "authoring-assignment",
  AuthoringCommitReceipt: "authoring-commit-receipt",
  AuthoringFormDefinition: "authoring-form-definition",
  AuthoringJournalRecord: "authoring-journal-record",
  AuthoringMutation: "authoring-mutation",
  AuthoringProfileManifest: "authoring-profile-manifest",
  AuthoringProtocol: "authoring-protocol",
  AuthoringRequest: "authoring-request",
  AuthoringSubmission: "authoring-submission",
  AuthoringWorkspace: "authoring-workspace",
  ContextClosure: "context-closure",
  ProjectionArtifact: "projection-artifact",
  ResourceReference: "resource-reference",
  SourceSnapshot: "source-snapshot",
  ValidationIssue: "validation-issue",
});

function callbackCountingRegistry(registry, callbackCounts) {
  return {
    guards: registry.guards.map((entry) => ({
      ...entry,
      invoke(input) {
        callbackCounts.guard += 1;
        return entry.invoke(input);
      },
    })),
    projectors: registry.projectors.map((entry) => ({
      ...entry,
      invoke(input) {
        return entry.invoke(input);
      },
    })),
    handlers: registry.handlers.map((entry) => ({
      ...entry,
      invoke(input) {
        callbackCounts.handler += 1;
        return entry.invoke(input);
      },
    })),
    validators: registry.validators.map((entry) => ({
      ...entry,
      invoke(input) {
        callbackCounts.validator += 1;
        return entry.invoke(input);
      },
    })),
  };
}

function activeHeadResource(snapshot, slot) {
  const heads = snapshot.workspace.spec.activeHeads.filter(
    (entry) => entry.slot === slot,
  );
  if (heads.length !== 1) {
    throw new Error(`active head ${slot} did not resolve exactly once`);
  }
  const versions = snapshot.workspace.spec.resourceVersions.filter(
    (entry) => (
      JSON.stringify(entry.reference) ===
      JSON.stringify(heads[0].reference)
    ),
  );
  if (versions.length !== 1) {
    throw new Error(`active resource ${slot} did not resolve exactly once`);
  }
  return versions[0].resource;
}

export async function createBriefHarness({
  omitActiveSlots = [],
  storeId = BRIEF_STORE_ID,
} = {}) {
  const fixture = await loadBriefProfileFixture();
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    validateFormats: false,
  });
  const validateBriefResource = ajv.compile(fixture.schema);
  for (const resource of fixture.initialResources) {
    if (!validateBriefResource(resource)) {
      throw new Error(
        `invalid initial Brief resource ${resource.kind}`,
      );
    }
  }
  const { byStem } = await contractValidators();
  const validateContract = (candidate) => {
    const stem = kindToContractStem[candidate?.kind];
    const validator = stem === undefined
      ? undefined
      : byStem.get(stem);
    return validator !== undefined && validator(candidate) === true;
  };
  const workspace = structuredClone(fixture.workspace);
  const omitted = new Set(omitActiveSlots);
  workspace.spec.activeHeads = workspace.spec.activeHeads.filter(
    (entry) => !omitted.has(entry.slot),
  );
  const sealedWorkspace = resealWorkspace(workspace);
  const callbackCounts = {
    guard: 0,
    handler: 0,
    validator: 0,
  };
  const rawExecutables = createBriefExecutableRegistry({
    bindings: fixture.bindings,
    validateBriefResource,
  });
  const executables = callbackCountingRegistry(
    rawExecutables,
    callbackCounts,
  );
  const rawIdentity = createInMemoryJournalIdentityConfiguration({
    genesisRevisionState:
      workspaceRevisionState(sealedWorkspace),
    genesisWorkspaceIntegrityDigest:
      sealedWorkspace.spec.integrity.workspaceIntegrityDigest,
    genesisMachines: [{
      machineId: BRIEF_AUTHORING_MACHINE_ID,
      state: sealedWorkspace.spec.authoringState,
    }],
    adapterScope: {
      adapterId: "non-survey-brief-in-memory",
      storeId,
    },
  }, authenticationKey);
  const identity = compileJournalIdentityPort(rawIdentity);
  const initialSnapshot = {
    storeId,
    commitRevision: 0,
    workspace: sealedWorkspace,
    journal: [],
    machineHeads: structuredClone(
      rawIdentity.identityScope.genesisMachineHeads,
    ),
    idempotencyOutcomeView: [],
    identityBinding: structuredClone(
      rawIdentity.identityBinding,
    ),
    identityScope: structuredClone(rawIdentity.identityScope),
  };
  const store = createInMemoryAuthoringStore({
    initialSnapshots: [initialSnapshot],
    identityAuthority: identity,
    authoringMachineId: BRIEF_AUTHORING_MACHINE_ID,
  });
  const coordinator = createAuthoringTransactionCoordinator({
    store,
    profile: fixture.profile,
    protocol: fixture.protocol,
    trustedInputs: {
      validateContract,
      kernel: fixture.kernel,
      inventory: fixture.forms,
      executables,
    },
    identity,
    authoringMachineId: BRIEF_AUTHORING_MACHINE_ID,
    systemActor: {
      class: "automation",
      id: "brief-fixture-runtime",
    },
    evidenceAuthority: {
      class: "kernel",
      id: "brief-evidence-authority",
      policy: {
        id: "brief-evidence-policy",
        digest: sha256Value({
          domain:
            "mission-kit:fixture:non-survey-brief:evidence-policy/v1",
        }),
      },
    },
  });
  return {
    callbackCounts,
    coordinator,
    executables,
    fixture,
    identity,
    initialSnapshot,
    store,
    storeId,
  };
}

export async function issueBriefAssignment(harness) {
  return harness.coordinator.execute(
    harness.storeId,
    { class: "next", inputs: {} },
  );
}

function formAuthority(harness, issued) {
  const formBinding =
    harness.fixture.profile.spec.formBindings.find(
      (entry) =>
        entry.id === issued.request.spec.bindings.form.id,
    );
  if (formBinding === undefined) {
    throw new Error("issued request did not resolve one form binding");
  }
  const forms = harness.fixture.forms.filter(
    (form) =>
      JSON.stringify(resourceReferenceFrom(form)) ===
      JSON.stringify(formBinding.definition),
  );
  if (forms.length !== 1) {
    throw new Error("issued request did not resolve one exact form");
  }
  const projectionBinding =
    harness.fixture.profile.spec.projectionBindings.find(
      (entry) =>
        entry.id ===
        issued.request.spec.bindings.projection.id,
    );
  if (projectionBinding === undefined) {
    throw new Error(
      "issued request did not resolve one projection binding",
    );
  }
  return {
    formDefinition: forms[0],
    projectionBinding,
  };
}

export function textSubmissionFor(
  harness,
  issued,
  {
    name,
    values,
  },
) {
  const {
    formDefinition,
    projectionBinding,
  } = formAuthority(harness, issued);
  const submittedBytes = renderPopulatedTextForm({
    formDefinition,
    contextClosure: issued.contextClosure,
    requestHandle: issued.assignment.spec.handle,
    values,
  });
  const result = createTextSubmission({
    name,
    request: issued.request,
    contextClosure: issued.contextClosure,
    assignment: issued.assignment,
    projectionArtifact: issued.projectionArtifact,
    projectionBinding,
    formDefinition,
    submittedBytes,
    producerProvenance: {
      producerId: "brief-text-adapter",
      producerClass: "adapter",
      evidenceDigest: sha256Value({
        domain:
          "mission-kit:fixture:non-survey-brief:text-evidence/v1",
        name,
        bytes: submittedBytes.toString("base64"),
      }),
    },
    renderProjection(input) {
      const projected = invokeProjector(
        compileExecutableRegistry(harness.executables),
        projectionBinding.engine,
        input,
      );
      if (projected.status !== "accept") {
        throw new Error(
          `Brief projection rejected: ${projected.issues[0].code}`,
        );
      }
      return textContentBytes(projected.content);
    },
  });
  return {
    ...result,
    formDefinition,
    projectionBinding,
    submittedBytes,
  };
}

export async function submitBriefAssignment(
  harness,
  issued,
  submission,
) {
  return harness.coordinator.execute(
    harness.storeId,
    {
      class: "submit",
      request: issued.request,
      assignment: issued.assignment,
      submission,
      externalCouplings: [],
    },
  );
}

export async function completeBriefFlow(
  harness,
  {
    objective =
      "Define a reversible staged launch with explicit readiness evidence.",
    summary =
      "Stage the service launch, verify readiness, and retain a reversible stop condition.",
  } = {},
) {
  const outlineAssignment = await issueBriefAssignment(harness);
  const outlineText = textSubmissionFor(
    harness,
    outlineAssignment,
    {
      name: "brief-outline-submission",
      values: { objective },
    },
  );
  const outlineCommit = await submitBriefAssignment(
    harness,
    outlineAssignment,
    outlineText.submission,
  );
  const briefAssignment = await issueBriefAssignment(harness);
  const briefText = textSubmissionFor(
    harness,
    briefAssignment,
    {
      name: "brief-submission",
      values: { summary },
    },
  );
  const briefCommit = await submitBriefAssignment(
    harness,
    briefAssignment,
    briefText.submission,
  );
  const terminal = await issueBriefAssignment(harness);
  return {
    briefAssignment,
    briefCommit,
    briefText,
    objective,
    outlineAssignment,
    outlineCommit,
    outlineText,
    summary,
    terminal,
  };
}

export function resolveActiveResource(snapshot, slot) {
  return activeHeadResource(snapshot, slot);
}
