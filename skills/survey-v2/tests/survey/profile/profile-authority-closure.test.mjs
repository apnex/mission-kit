import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  validateContractSemantics,
  validateTransactionClosureSemantics,
} from "../../../source/authoring/kernel/contract-semantics.mjs";
import {
  profileManifestDigest,
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  resolveExecutable,
} from "../../../source/authoring/kernel/executable-registry.mjs";
import {
  SURVEY_GENERATION_SIDECAR_BINDING_ID,
  surveyGenerationSidecarAugmentation,
} from "../../../source/authoring/survey/profile-authority.mjs";
import {
  validateSurveyAuthoringProtocol,
} from "../../../source/authoring/survey/protocol-semantics.mjs";
import {
  contractValidators,
} from "../../authoring/contracts/support/contract-validation.mjs";
import {
  loadProfileScenario,
} from "./support.mjs";

test(
  "the Survey R12 profile is total over canonical authority and executable only through AT05",
  async () => {
    const scenario = await loadProfileScenario();
    const {
      profile,
      protocol,
      phaseProtocol,
      forms,
      resources,
      compiled,
    } = scenario;
    const source = JSON.parse(await readFile(new URL(
      "../../../source/protocol/survey-v2.protocol.json",
      import.meta.url,
    )));
    const embedded = source.machines.find(
      (machine) => machine.id === "authoring",
    );
    assert.deepEqual(protocol, embedded.protocol);
    assert.deepEqual(profile.spec.protocol, resourceReferenceFrom(protocol));
    assert.deepEqual(validateSurveyAuthoringProtocol(protocol), []);

    const { byStem } = await contractValidators();
    const validateProfile = byStem.get("authoring-profile-manifest");
    assert.equal(
      validateProfile(profile),
      true,
      JSON.stringify(validateProfile.errors),
    );
    assert.deepEqual(validateContractSemantics(profile), []);
    assert.deepEqual(
      validateTransactionClosureSemantics(
        [protocol, phaseProtocol, profile, ...forms],
        { roots: [profile] },
      ),
      [],
    );
    assert.equal(
      profile.spec.profileDigest,
      profileManifestDigest(profile),
    );

    const canonicalTaskIds = protocol.spec.states
      .filter((state) => state.class === "task")
      .map((state) => state.taskId);
    assert.deepEqual(
      profile.spec.tasks.map((task) => task.id),
      canonicalTaskIds,
    );
    assert.deepEqual(
      profile.spec.guardBindings.map((binding) => binding.guardId),
      protocol.spec.guards.map((guard) => guard.id),
    );
    assert.deepEqual(
      profile.spec.transitionBindings.map(
        (binding) => binding.transitionId,
      ),
      protocol.spec.transitions.map((transition) => transition.id),
    );
    assert.deepEqual(profile.spec.executionClosure, {
      id: "r12-round-one-instrument",
      transitionIds: ["AT01", "AT02", "AT03", "AT04", "AT05"],
      revisionPlanIds: [],
    });
    assert.deepEqual(profile.spec.revisionUnits, []);

    const surveyFrameTask = profile.spec.tasks.find(
      (task) => task.id === "author-survey-frame",
    );
    assert.deepEqual(
      surveyFrameTask.contextSelectors.map((selector) => ({
        role: selector.role,
        slot: selector.selection.slot,
      })),
      [
        { role: "intake", slot: "intake" },
        { role: "policy", slot: "policy" },
      ],
    );
    assert.deepEqual(surveyFrameTask.requestInputBindings, [
      { inputKey: "intake", selectorId: "survey-frame-intake" },
      { inputKey: "policy", selectorId: "survey-frame-policy" },
    ]);
    const roundOneFrameTask = profile.spec.tasks.find(
      (task) => task.id === "author-round-1-frame",
    );
    assert.deepEqual(
      roundOneFrameTask.contextSelectors.map((selector) => ({
        role: selector.role,
        slot: selector.selection.slot,
        fields: selector.projection.fields,
      })),
      [
        {
          role: "survey-frame",
          slot: "survey-frame",
          fields: ["/spec"],
        },
        {
          role: "survey",
          slot: "survey",
          fields: ["/spec/outcomeAxes"],
        },
      ],
    );
    assert.deepEqual(roundOneFrameTask.requestInputBindings, [
      {
        inputKey: "survey-frame",
        selectorId: "round-one-survey-frame",
      },
      {
        inputKey: "survey",
        selectorId: "round-one-survey",
      },
    ]);
    const questionFrameTask = profile.spec.tasks.find(
      (task) => task.id === "author-round-1-frame-set",
    );
    assert.deepEqual(
      questionFrameTask.contextSelectors.map((selector) => ({
        role: selector.role,
        slot: selector.selection.slot,
        fields: selector.projection.fields,
      })),
      [
        {role: "survey-frame", slot: "survey-frame", fields: ["/spec"]},
        {role: "round-frame", slot: "round-1-frame", fields: ["/spec"]},
        {role: "survey", slot: "survey", fields: ["/spec/outcomeAxes"]},
      ],
    );
    assert.deepEqual(questionFrameTask.requestInputBindings, [
      {inputKey: "survey-frame", selectorId: "round-one-question-survey-frame"},
      {inputKey: "round-frame", selectorId: "round-one-question-round-frame"},
      {inputKey: "survey", selectorId: "round-one-question-survey"},
    ]);
    assert.equal(
      questionFrameTask.formBindingId,
      "round-one-question-frames-form-binding",
    );
    assert.equal(
      questionFrameTask.projectionBindingId,
      "round-one-question-frames-projection-binding",
    );

    const at01 = profile.spec.transitionBindings.find(
      (binding) => binding.transitionId === "AT01",
    );
    assert.deepEqual(
      at01.inputSelectors.map((selector) => ({
        id: selector.id,
        role: selector.role,
        slot: selector.selection.slot,
        fields: selector.projection.fields,
      })),
      [
        {
          id: "begin-authoring-intake",
          role: "intake",
          slot: "intake",
          fields: ["/spec/inventory"],
        },
        {
          id: "begin-authoring-policy",
          role: "policy",
          slot: "policy",
          fields: ["/spec"],
        },
      ],
    );
    assert.deepEqual(at01.mutationFootprint.externalCouplings, [{
      machineId: "phase",
      transitionId: "T02",
    }]);
    const canonicalT02 = source.machines
      .find((machine) => machine.id === "phase")
      .transitions.find((transition) => transition.id === "T02");
    const adaptedT02 = phaseProtocol.spec.transitions.find(
      (transition) => transition.id === "T02",
    );
    assert.deepEqual(adaptedT02, {
      id: "T02",
      source: { mode: "single", stateId: canonicalT02.from },
      eventId: canonicalT02.event,
      toState: canonicalT02.to,
      guardIds: ["phase-g02"],
    });
    assert.deepEqual(profile.spec.machineBindings, [{
      machineId: "phase",
      protocol: {
        id: phaseProtocol.metadata.name,
        digest: resourceReferenceFrom(phaseProtocol).semanticDigest,
      },
    }]);
    assert.equal(
      resources.some(
        (resource) =>
          resource.kind === "AuthoringProtocol" &&
          resource.metadata.name === phaseProtocol.metadata.name,
      ),
      true,
    );

    const at02 = profile.spec.transitionBindings.find(
      (binding) => binding.transitionId === "AT02",
    );
    assert.deepEqual(
      at02.mutationFootprint.created.map((item) => [
        item.slot,
        item.resourceType.kind,
      ]),
      [
        ["survey-frame", "ContextFrame"],
        ["survey", "Survey"],
      ],
    );
    assert.deepEqual(at02.commitSidecarBindingIds, [
      SURVEY_GENERATION_SIDECAR_BINDING_ID,
    ]);
    const at03 = profile.spec.transitionBindings.find(
      (binding) => binding.transitionId === "AT03",
    );
    assert.deepEqual(
      at03.mutationFootprint.created.map((item) => [
        item.slot,
        item.resourceType.kind,
      ]),
      [
        ["round-1-frame", "ContextFrame"],
        ["round-1", "SurveyRound"],
      ],
    );
    assert.deepEqual(
      at03.mutationFootprint.dependencyRelations,
      ["belongs-to", "derived-from", "frames", "parent-frame"],
    );
    assert.deepEqual(at03.commitSidecarBindingIds, [
      SURVEY_GENERATION_SIDECAR_BINDING_ID,
    ]);
    const at04 = profile.spec.transitionBindings.find(
      (binding) => binding.transitionId === "AT04",
    );
    assert.deepEqual(
      at04.mutationFootprint.created.map((item) => [
        item.slot,
        item.resourceType.kind,
      ]),
      [
        ["round-1-question-frame-1", "ContextFrame"],
        ["round-1-question-frame-2", "ContextFrame"],
        ["round-1-question-frame-3", "ContextFrame"],
        ["round-1-question-frame-set", "QuestionFrameSet"],
      ],
    );
    assert.deepEqual(at04.mutationFootprint.activeHeadSlots, [
      "round-1-question-frame-1",
      "round-1-question-frame-2",
      "round-1-question-frame-3",
      "round-1-question-frame-set",
    ]);
    assert.deepEqual(at04.mutationFootprint.dependencyRelations, [
      "belongs-to", "derived-from", "frames", "parent-frame",
    ]);
    assert.deepEqual(at04.commitSidecarBindingIds, [
      SURVEY_GENERATION_SIDECAR_BINDING_ID,
    ]);
    assert.ok(
      profile.spec.schemaBindings.some(
        (binding) => binding.resourceType.kind === "QuestionFrameSet",
      ),
    );
    const cognitiveTransitions =
      profile.spec.transitionBindings.filter(
        (binding) => binding.triggerClass === "task-submission",
      );
    const runtimeTransitions =
      profile.spec.transitionBindings.filter(
        (binding) => binding.triggerClass === "event",
      );
    assert.equal(cognitiveTransitions.length, 10);
    assert.equal(runtimeTransitions.length, 12);
    for (const transition of cognitiveTransitions) {
      assert.deepEqual(transition.commitSidecarBindingIds, [
        SURVEY_GENERATION_SIDECAR_BINDING_ID,
      ]);
    }
    for (const transition of runtimeTransitions) {
      assert.equal(
        Object.hasOwn(transition, "commitSidecarBindingIds"),
        false,
      );
    }
    const augmentation = surveyGenerationSidecarAugmentation(scenario);
    assert.equal(
      augmentation.binding.id,
      SURVEY_GENERATION_SIDECAR_BINDING_ID,
    );
    assert.deepEqual(
      augmentation.transitionIds,
      cognitiveTransitions.map(
        (transition) => transition.transitionId,
      ),
    );

    for (const binding of profile.spec.guardBindings) {
      resolveExecutable(compiled, "guards", binding.handler);
    }
    for (const binding of profile.spec.handlerBindings) {
      resolveExecutable(compiled, "handlers", binding.handler);
    }
    for (const binding of profile.spec.schemaBindings) {
      resolveExecutable(compiled, "validators", binding.schema);
      resolveExecutable(
        compiled,
        "validators",
        binding.semanticValidator,
      );
    }
    for (const binding of profile.spec.projectionBindings) {
      resolveExecutable(compiled, "projectors", binding.engine);
    }
    for (const binding of profile.spec.commitSidecarBindings) {
      resolveExecutable(compiled, "sidecars", binding.executable);
    }
  },
);
