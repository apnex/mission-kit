import { readFile } from "node:fs/promises";
import {
  sha256Bytes,
  sha256Value,
  stableValue,
} from "../../../../source/authoring/kernel/canonical.mjs";
import {
  contextSelectorDigest,
  formDefinitionDigest,
  profileManifestDigest,
  resourceReferenceFrom,
  resourceSemanticDigest,
} from "../../../../source/authoring/kernel/digests.mjs";
import {
  resealWorkspace,
  storedResourceVersionFromResource,
} from "../../../../source/authoring/runtime/workspace-application.mjs";

export const BRIEF_API_VERSION = "brief.example/v1alpha1";
export const BRIEF_AUTHORING_MACHINE_ID = "brief-authoring";
export const BRIEF_STORE_ID = "brief-fixture";

const zeroDigest = `sha256:${"0".repeat(64)}`;
const schemaUrl = new URL("./brief-resource.schema.json", import.meta.url);
const executableUrl = new URL("./profile-executables.mjs", import.meta.url);
const kernelMembers = Object.freeze([
  "assignment-dag.mjs",
  "canonical.mjs",
  "context-resolver.mjs",
  "contract-semantics.mjs",
  "digests.mjs",
  "executable-registry.mjs",
  "manifest-reducer.mjs",
  "manifest-selection.mjs",
  "mutation-planner.mjs",
  "reducer-results.mjs",
  "request-planner.mjs",
  "resource-resolution.mjs",
  "text-forms.mjs",
]);

function executableBinding(id, moduleDigest) {
  return {
    id,
    digest: sha256Value({
      domain: "mission-kit:fixture:non-survey-brief:executable/v1",
      id,
      moduleDigest,
    }),
  };
}

function form(name, title, introduction, field) {
  const result = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringFormDefinition",
    metadata: { name },
    spec: {
      formDigest: zeroDigest,
      grammarVersion: "mission-kit-authoring-text/v1",
      title,
      introduction,
      fields: [{
        id: field.id,
        ordinal: 1,
        heading: field.heading,
        instruction: field.instruction,
        type: "paragraph",
        required: true,
        placeholder: field.placeholder,
        constraints: {
          minLength: 1,
          maxLength: field.maxLength,
        },
      }],
    },
  };
  result.spec.formDigest = formDefinitionDigest(result);
  return result;
}

function selector({
  id,
  ordinal,
  role,
  kind,
  slot,
  fields,
  projectionDigest,
}) {
  const result = {
    id,
    selectorDigest: zeroDigest,
    ordinal,
    role,
    resourceType: {
      apiVersion: BRIEF_API_VERSION,
      kind,
    },
    cardinality: { min: 1, max: 1 },
    requiredLifecycleState: "frozen",
    lifecycleRule: { mode: "workspace-resource-version" },
    selection: { mode: "active-head", slot },
    projection: {
      id: `${id}-projection`,
      digest: projectionDigest,
      fields,
    },
  };
  result.selectorDigest = contextSelectorDigest(result);
  return result;
}

function target(slot, kind) {
  return {
    slot,
    resourceType: {
      apiVersion: BRIEF_API_VERSION,
      kind,
    },
    cardinality: { min: 1, max: 1 },
  };
}

async function kernelBinding() {
  const members = await Promise.all(
    kernelMembers.map(async (name) => ({
      path: `source/authoring/kernel/${name}`,
      digest: sha256Bytes(await readFile(
        new URL(
          `../../../../source/authoring/kernel/${name}`,
          import.meta.url,
        ),
      )),
    })),
  );
  return {
    id: "authoring-kernel",
    digest: sha256Value({
      domain: "mission-kit:fixture:non-survey-brief:kernel-closure/v1",
      members,
    }),
  };
}

let authorityPromise;

async function buildFixtureAuthority() {
  const [schemaBytes, executableBytes, kernel] = await Promise.all([
    readFile(schemaUrl),
    readFile(executableUrl),
    kernelBinding(),
  ]);
  const schema = JSON.parse(schemaBytes.toString("utf8"));
  const schemaModuleDigest = sha256Value({
    domain: "mission-kit:fixture:non-survey-brief:schema-module/v1",
    bytesDigest: sha256Bytes(schemaBytes),
    executableModuleDigest: sha256Bytes(executableBytes),
  });
  const executableModuleDigest = sha256Bytes(executableBytes);
  const textFormsDigest = (
    await Promise.all(
      kernelMembers.map(async (name) => ({
        name,
        digest: sha256Bytes(await readFile(
          new URL(
            `../../../../source/authoring/kernel/${name}`,
            import.meta.url,
          ),
        )),
      })),
    )
  ).find((entry) => entry.name === "text-forms.mjs").digest;
  const bindings = {
    resourceSchema: {
      id: "brief-resource-schema",
      digest: schemaModuleDigest,
    },
    outlineValidator: executableBinding(
      "brief-outline-validator",
      executableModuleDigest,
    ),
    briefValidator: executableBinding(
      "brief-validator",
      executableModuleDigest,
    ),
    outlineHandler: executableBinding(
      "brief-outline-handler",
      executableModuleDigest,
    ),
    briefHandler: executableBinding(
      "brief-handler",
      executableModuleDigest,
    ),
    renderer: executableBinding(
      "brief-text-renderer",
      textFormsDigest,
    ),
    parser: executableBinding(
      "brief-text-parser",
      textFormsDigest,
    ),
    projectionEngine: executableBinding(
      "brief-text-projection-engine",
      sha256Value({
        domain:
          "mission-kit:fixture:non-survey-brief:projector-closure/v1",
        executableModuleDigest,
        textFormsDigest,
      }),
    ),
  };
  const projectionDigest = sha256Value({
    domain: "mission-kit:fixture:non-survey-brief:context-projection/v1",
    projection: "ordered-path-values",
  });
  const outlineForm = form(
    "brief-outline-form",
    "Define the Brief objective",
    "Author the objective from the exact intake and constraints.",
    {
      id: "objective",
      heading: "Objective",
      instruction: "State the bounded objective.",
      placeholder: "Enter the objective",
      maxLength: 1000,
    },
  );
  const briefForm = form(
    "brief-form",
    "Complete the Brief",
    "Author the summary from the exact intake, constraints, and outline.",
    {
      id: "summary",
      heading: "Summary",
      instruction: "State the concise Brief.",
      placeholder: "Enter the summary",
      maxLength: 4000,
    },
  );
  const protocol = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringProtocol",
    metadata: { name: "brief-two-stage-flow" },
    spec: {
      initialState: "outline_required",
      states: [
        {
          id: "outline_required",
          label: "Brief outline required",
          class: "task",
          taskId: "author-outline",
        },
        {
          id: "brief_required",
          label: "Brief required",
          class: "task",
          taskId: "author-brief",
        },
        {
          id: "complete",
          label: "Complete",
          class: "terminal",
        },
      ],
      events: [
        {
          id: "SUBMIT_OUTLINE",
          description: "Submit the Brief outline",
        },
        {
          id: "SUBMIT_BRIEF",
          description: "Submit the complete Brief",
        },
      ],
      guards: [],
      transitions: [
        {
          id: "BA01",
          source: {
            mode: "single",
            stateId: "outline_required",
          },
          eventId: "SUBMIT_OUTLINE",
          toState: "brief_required",
          guardIds: [],
        },
        {
          id: "BA02",
          source: {
            mode: "single",
            stateId: "brief_required",
          },
          eventId: "SUBMIT_BRIEF",
          toState: "complete",
          guardIds: [],
        },
      ],
    },
  };
  const outlineSelectors = [
    selector({
      id: "outline-intake",
      ordinal: 1,
      role: "intake",
      kind: "BriefIntake",
      slot: "intake",
      fields: ["/spec/problem", "/spec/audience"],
      projectionDigest,
    }),
    selector({
      id: "outline-constraints",
      ordinal: 2,
      role: "constraints",
      kind: "BriefConstraints",
      slot: "constraints",
      fields: ["/spec/maxWords", "/spec/tone"],
      projectionDigest,
    }),
  ];
  const briefSelectors = [
    selector({
      id: "brief-intake",
      ordinal: 1,
      role: "intake",
      kind: "BriefIntake",
      slot: "intake",
      fields: ["/spec/problem", "/spec/audience"],
      projectionDigest,
    }),
    selector({
      id: "brief-constraints",
      ordinal: 2,
      role: "constraints",
      kind: "BriefConstraints",
      slot: "constraints",
      fields: ["/spec/maxWords", "/spec/tone"],
      projectionDigest,
    }),
    selector({
      id: "brief-outline",
      ordinal: 3,
      role: "outline",
      kind: "BriefOutline",
      slot: "outline",
      fields: ["/spec/objective"],
      projectionDigest,
    }),
  ];
  const profile = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringProfileManifest",
    metadata: { name: "brief-two-stage-profile" },
    spec: {
      profileDigest: zeroDigest,
      kernel,
      protocol: resourceReferenceFrom(protocol),
      schemaBindings: [
        {
          id: "brief-outline-schema-binding",
          resourceType: {
            apiVersion: BRIEF_API_VERSION,
            kind: "BriefOutline",
          },
          schema: bindings.resourceSchema,
          semanticValidator: bindings.outlineValidator,
        },
        {
          id: "brief-schema-binding",
          resourceType: {
            apiVersion: BRIEF_API_VERSION,
            kind: "Brief",
          },
          schema: bindings.resourceSchema,
          semanticValidator: bindings.briefValidator,
        },
      ],
      formBindings: [
        {
          id: "brief-outline-form-binding",
          definition: resourceReferenceFrom(outlineForm),
          formDigest: outlineForm.spec.formDigest,
          renderer: bindings.renderer,
          parser: bindings.parser,
        },
        {
          id: "brief-form-binding",
          definition: resourceReferenceFrom(briefForm),
          formDigest: briefForm.spec.formDigest,
          renderer: bindings.renderer,
          parser: bindings.parser,
        },
      ],
      handlerBindings: [
        {
          id: "brief-outline-handler-binding",
          handler: bindings.outlineHandler,
        },
        {
          id: "brief-handler-binding",
          handler: bindings.briefHandler,
        },
      ],
      guardBindings: [],
      projectionBindings: [{
        id: "brief-text-projection-binding",
        definitionDigest: sha256Value({
          domain: "mission-kit:fixture:non-survey-brief:text-projection/v1",
          format: "mission-kit-authoring-text/v1",
        }),
        engine: bindings.projectionEngine,
      }],
      validatorSets: [
        {
          id: "brief-outline-validator-set",
          digest: sha256Value({
            domain: "mission-kit:fixture:non-survey-brief:validator-set/v1",
            members: [bindings.outlineValidator],
          }),
          members: [bindings.outlineValidator],
        },
        {
          id: "brief-validator-set",
          digest: sha256Value({
            domain: "mission-kit:fixture:non-survey-brief:validator-set/v1",
            members: [bindings.briefValidator],
          }),
          members: [bindings.briefValidator],
        },
      ],
      machineBindings: [],
      tasks: [
        {
          id: "author-outline",
          stateId: "outline_required",
          target: target("outline", "BriefOutline"),
          contextSelectors: outlineSelectors,
          submissionSchemaBindingId: "brief-outline-schema-binding",
          formBindingId: "brief-outline-form-binding",
          handlerBindingId: "brief-outline-handler-binding",
          projectionBindingId: "brief-text-projection-binding",
          validatorSetId: "brief-outline-validator-set",
        },
        {
          id: "author-brief",
          stateId: "brief_required",
          target: target("brief", "Brief"),
          contextSelectors: briefSelectors,
          submissionSchemaBindingId: "brief-schema-binding",
          formBindingId: "brief-form-binding",
          handlerBindingId: "brief-handler-binding",
          projectionBindingId: "brief-text-projection-binding",
          validatorSetId: "brief-validator-set",
        },
      ],
      transitionBindings: [
        {
          transitionId: "BA01",
          triggerClass: "task-submission",
          taskId: "author-outline",
          handlerBindingId: "brief-outline-handler-binding",
          authority: {
            class: "profile-handler",
            id: "brief-outline-authority",
            policy: {
              id: "brief-outline-policy",
              digest: sha256Value({
                domain: "mission-kit:fixture:non-survey-brief:policy/v1",
                id: "brief-outline-policy",
              }),
            },
          },
          mutationFootprint: {
            created: [target("outline", "BriefOutline")],
            activeHeadSlots: ["outline"],
            supersededSlots: [],
            dependencyRelations: [
              "derived-from",
              "constrained-by",
            ],
            handoffSlots: [],
            nextState: "brief_required",
          },
        },
        {
          transitionId: "BA02",
          triggerClass: "task-submission",
          taskId: "author-brief",
          handlerBindingId: "brief-handler-binding",
          authority: {
            class: "profile-handler",
            id: "brief-authority",
            policy: {
              id: "brief-policy",
              digest: sha256Value({
                domain: "mission-kit:fixture:non-survey-brief:policy/v1",
                id: "brief-policy",
              }),
            },
          },
          mutationFootprint: {
            created: [target("brief", "Brief")],
            activeHeadSlots: ["brief"],
            supersededSlots: [],
            dependencyRelations: [
              "derived-from",
              "constrained-by",
            ],
            handoffSlots: ["brief"],
            nextState: "complete",
          },
        },
      ],
      revisionUnits: [],
    },
  };
  profile.spec.profileDigest = profileManifestDigest(profile);
  const intake = {
    apiVersion: BRIEF_API_VERSION,
    kind: "BriefIntake",
    metadata: { name: "launch-intake" },
    spec: {
      problem: "Reduce ambiguity around a staged service launch.",
      audience: "engineering leads",
    },
  };
  const constraints = {
    apiVersion: BRIEF_API_VERSION,
    kind: "BriefConstraints",
    metadata: { name: "launch-constraints" },
    spec: {
      maxWords: 120,
      tone: "direct",
    },
  };
  const workspace = resealWorkspace({
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringWorkspace",
    metadata: { name: "brief-two-stage-workspace" },
    spec: {
      profile: {
        reference: resourceReferenceFrom(profile),
        profileDigest: profile.spec.profileDigest,
      },
      protocol: {
        reference: resourceReferenceFrom(protocol),
        protocolDigest: resourceSemanticDigest(protocol),
      },
      authoringState: "outline_required",
      semanticRevision: 0,
      evidenceRevision: 0,
      resourceVersions: [
        storedResourceVersionFromResource(intake),
        storedResourceVersionFromResource(constraints),
      ],
      activeHeads: [
        {
          slot: "intake",
          reference: resourceReferenceFrom(intake),
        },
        {
          slot: "constraints",
          reference: resourceReferenceFrom(constraints),
        },
      ],
      dependencyEdges: [],
      handoffProducts: [],
      history: [],
      openAssignment: null,
      integrity: {
        semanticStateDigest: zeroDigest,
        workspaceIntegrityDigest: zeroDigest,
      },
    },
  });
  return stableValue({
    bindings,
    forms: [outlineForm, briefForm],
    initialResources: [intake, constraints],
    kernel,
    profile,
    protocol,
    schema,
    workspace,
  });
}

export async function loadBriefProfileFixture() {
  authorityPromise ??= buildFixtureAuthority();
  return structuredClone(await authorityPromise);
}
