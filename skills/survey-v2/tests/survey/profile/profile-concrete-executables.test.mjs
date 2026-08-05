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
  exactInitializationClosure,
  loadProfileScenario,
  surveyFrameValues,
} from "./support.mjs";

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
  },
);
