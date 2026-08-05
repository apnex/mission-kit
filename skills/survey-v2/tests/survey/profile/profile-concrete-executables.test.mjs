import assert from "node:assert/strict";
import test from "node:test";
import {
  invokeGuard,
  invokeHandler,
  invokeProjector,
  invokeValidator,
} from "../../../source/authoring/kernel/executable-registry.mjs";
import {
  textContentBytes,
} from "../../../source/authoring/kernel/text-forms.mjs";
import {
  buildSurveyFrameProducts,
} from "../../../source/authoring/survey/survey-frame-authority.mjs";
import {
  projectSurveyFrameText,
} from "../../../source/authoring/survey/survey-frame-projector.mjs";
import {
  buildRoundOneFrameProducts,
} from "../../../source/authoring/survey/round-one-frame-authority.mjs";
import {
  projectRoundOneFrameText,
} from "../../../source/authoring/survey/round-one-frame-projector.mjs";
import {
  exactInitializationClosure,
  loadProfileScenario,
  surveyFrameValues,
} from "./support.mjs";
import {
  roundOneContextClosure,
  roundOneFrameValues,
} from "../round-one/support.mjs";

test(
  "the concrete Survey guards, handlers, validators, and projector delegate through exact registry pins",
  async () => {
    const scenario = await loadProfileScenario();
    const { profile, compiled } = scenario;
    const contextClosure = exactInitializationClosure();

    const initialized = profile.spec.guardBindings.find(
      (binding) => binding.guardId === "initialized-survey-inputs",
    );
    assert.deepEqual(
      invokeGuard(compiled, initialized.handler, {
        phase: "event",
        operation: { eventId: "BEGIN_AUTHORING" },
        workspace: {
          apiVersion: "authoring.mission-kit/v1alpha1",
          kind: "AuthoringWorkspace",
          spec: { authoringState: "new" },
        },
        contextClosure,
      }),
      { status: "pass" },
    );

    const at01 = profile.spec.transitionBindings.find(
      (binding) => binding.transitionId === "AT01",
    );
    const at01Handler = profile.spec.handlerBindings.find(
      (binding) => binding.id === at01.handlerBindingId,
    );
    assert.deepEqual(
      invokeHandler(compiled, at01Handler.handler, {}),
      { status: "accept", products: [] },
    );

    const currentAssignment = profile.spec.guardBindings.find(
      (binding) =>
        binding.guardId === "current-survey-frame-assignment",
    );
    assert.deepEqual(
      invokeGuard(compiled, currentAssignment.handler, {
        phase: "submission",
        operation: {
          class: "task-submission",
          task: { id: "author-survey-frame" },
        },
        workspace: {
          apiVersion: "authoring.mission-kit/v1alpha1",
          kind: "AuthoringWorkspace",
          spec: { authoringState: "survey_frame_required" },
        },
        contextClosure,
      }),
      { status: "pass" },
    );

    const normalizedValues = surveyFrameValues();
    const expectedProducts = buildSurveyFrameProducts({
      normalizedValues,
      contextClosure,
    });
    const at02 = profile.spec.transitionBindings.find(
      (binding) => binding.transitionId === "AT02",
    );
    const at02Handler = profile.spec.handlerBindings.find(
      (binding) => binding.id === at02.handlerBindingId,
    );
    const handled = invokeHandler(compiled, at02Handler.handler, {
      normalizedValues,
      contextClosure,
    });
    assert.equal(handled.status, "accept");
    assert.deepEqual(handled.products, expectedProducts);

    for (const product of handled.products) {
      const schemaBinding = profile.spec.schemaBindings.find(
        (binding) =>
          binding.resourceType.apiVersion ===
            product.resource.apiVersion &&
          binding.resourceType.kind === product.resource.kind,
      );
      assert.equal(
        invokeValidator(
          compiled,
          schemaBinding.semanticValidator,
          { resource: product.resource },
        ).status,
        "pass",
      );
    }

    const projectionBinding = profile.spec.projectionBindings.find(
      (binding) =>
        binding.id === "survey-frame-projection-binding",
    );
    assert.deepEqual(
      invokeProjector(compiled, projectionBinding.engine, {}),
      projectSurveyFrameText({}),
    );
    const projectedClosure = exactInitializationClosure();
    projectedClosure.spec.layers[0].selectedValue = [{
      path: "/spec/inventory",
      value: [{
        ordinal: 1,
        logicalName: "intent.txt",
        content: {
          mediaType: "text/plain;charset=utf-8",
          encoding: "base64",
          byteLength: 23,
          data: Buffer.from(
            "Survey framing intent.\n",
            "utf8",
          ).toString("base64"),
        },
        rawEvidenceDigest: `sha256:${"4".repeat(64)}`,
      }],
    }];
    projectedClosure.spec.layers[1].selectedValue = [{
      path: "/spec",
      value: { disclosure: "single-current-question" },
    }];
    const projectionInput = {
      contextClosure: projectedClosure,
      formDefinition: scenario.forms.find(
        (form) => form.metadata.name === "survey-frame-form",
      ),
      projectionBinding,
      request: {},
      requestHandle: "00000000",
    };
    const projected = invokeProjector(
      compiled,
      projectionBinding.engine,
      projectionInput,
    );
    assert.deepEqual(
      projected,
      projectSurveyFrameText(projectionInput),
    );
    assert.equal(projected.status, "accept");
    assert.match(
      textContentBytes(projected.content).toString("utf8"),
      /Survey framing intent\./u,
    );

    const roundContext = roundOneContextClosure();
    const frozenSurveyFrame = profile.spec.guardBindings.find(
      (binding) => binding.guardId === "frozen-survey-frame",
    );
    assert.deepEqual(
      invokeGuard(compiled, frozenSurveyFrame.handler, {
        phase: "submission",
        operation: {
          class: "task-submission",
          task: { id: "author-round-1-frame" },
          inputs: {
            "survey-frame":
              roundContext.spec.layers[0].sourceReference,
            survey:
              roundContext.spec.layers[1].sourceReference,
          },
        },
        workspace: {
          apiVersion: "authoring.mission-kit/v1alpha1",
          kind: "AuthoringWorkspace",
          spec: {
            authoringState: "round_1_frame_required",
          },
        },
        contextClosure: roundContext,
      }),
      { status: "pass" },
    );
    const mismatchedRoundContext =
      structuredClone(roundContext);
    mismatchedRoundContext.spec.layers[1]
      .sourceSnapshot.spec.surveyFrameRef.name =
        "different-survey-frame";
    const mismatchedGuard = invokeGuard(
      compiled,
      frozenSurveyFrame.handler,
      {
        phase: "submission",
        operation: {
          class: "task-submission",
          task: { id: "author-round-1-frame" },
          inputs: {
            "survey-frame":
              roundContext.spec.layers[0].sourceReference,
            survey:
              roundContext.spec.layers[1].sourceReference,
          },
        },
        workspace: {
          apiVersion: "authoring.mission-kit/v1alpha1",
          kind: "AuthoringWorkspace",
          spec: {
            authoringState: "round_1_frame_required",
          },
        },
        contextClosure: mismatchedRoundContext,
      },
    );
    assert.equal(mismatchedGuard.status, "reject");
    assert.equal(
      mismatchedGuard.issues[0].code,
      "ROUND_ONE_FRAME_CONTEXT_INVALID",
    );
    const at03 = profile.spec.transitionBindings.find(
      (binding) => binding.transitionId === "AT03",
    );
    const at03Handler = profile.spec.handlerBindings.find(
      (binding) => binding.id === at03.handlerBindingId,
    );
    const roundValues = roundOneFrameValues();
    const expectedRoundProducts = buildRoundOneFrameProducts({
      normalizedValues: roundValues,
      contextClosure: roundContext,
    });
    const roundHandled = invokeHandler(
      compiled,
      at03Handler.handler,
      {
        normalizedValues: roundValues,
        contextClosure: roundContext,
      },
    );
    assert.equal(roundHandled.status, "accept");
    assert.deepEqual(
      roundHandled.products,
      expectedRoundProducts,
    );
    for (const product of roundHandled.products) {
      const schemaBinding = profile.spec.schemaBindings.find(
        (binding) =>
          binding.resourceType.apiVersion ===
            product.resource.apiVersion &&
          binding.resourceType.kind === product.resource.kind,
      );
      assert.equal(
        invokeValidator(
          compiled,
          schemaBinding.semanticValidator,
          { resource: product.resource },
        ).status,
        "pass",
      );
    }
    const roundProjectionBinding =
      profile.spec.projectionBindings.find(
        (binding) =>
          binding.id === "round-one-frame-projection-binding",
      );
    const roundProjectionInput = {
      contextClosure: roundContext,
      formDefinition: scenario.forms.find(
        (form) =>
          form.metadata.name === "round-one-frame-form",
      ),
      projectionBinding: roundProjectionBinding,
      request: {},
      requestHandle: "00000000",
    };
    assert.deepEqual(
      invokeProjector(
        compiled,
        roundProjectionBinding.engine,
        roundProjectionInput,
      ),
      projectRoundOneFrameText(roundProjectionInput),
    );
  },
);
