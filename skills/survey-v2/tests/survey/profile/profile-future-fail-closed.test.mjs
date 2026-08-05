import assert from "node:assert/strict";
import test from "node:test";
import {
  invokeGuard,
  invokeHandler,
  invokeProjector,
} from "../../../source/authoring/kernel/executable-registry.mjs";
import {
  loadProfileScenario,
} from "./support.mjs";

test(
  "every Survey profile edge beyond AT04 has a digest-pinned rejecting executable",
  async () => {
    const { profile, compiled } = await loadProfileScenario();
    const concreteGuards = new Set([
      "initialized-survey-inputs",
      "current-survey-frame-assignment",
      "frozen-survey-frame",
      "frozen-round-1-parent-closure",
    ]);
    const futureGuards = profile.spec.guardBindings.filter(
      (binding) => !concreteGuards.has(binding.guardId),
    );
    assert.equal(futureGuards.length, 18);
    for (const binding of futureGuards) {
      const result = invokeGuard(compiled, binding.handler, {});
      assert.equal(result.status, "reject");
      assert.equal(
        result.issues[0].code,
        "SURVEY_PROFILE_FEATURE_UNAVAILABLE",
      );
    }

    const futureTransitions = profile.spec.transitionBindings.filter(
      (binding) =>
        binding.transitionId !== "AT01" &&
        binding.transitionId !== "AT02" &&
        binding.transitionId !== "AT03" &&
        binding.transitionId !== "AT04",
    );
    assert.equal(futureTransitions.length, 18);
    for (const transition of futureTransitions) {
      const handler = profile.spec.handlerBindings.find(
        (binding) =>
          binding.id === transition.handlerBindingId,
      );
      const result = invokeHandler(compiled, handler.handler, {});
      assert.equal(result.status, "reject");
      assert.equal(
        result.issues[0].code,
        "SURVEY_PROFILE_FEATURE_UNAVAILABLE",
      );
      assert.deepEqual(
        transition.mutationFootprint.created,
        [],
      );
    }

    const futureProjection = profile.spec.projectionBindings.find(
      (binding) => binding.id === "survey-future-projection-binding",
    );
    const projected = invokeProjector(
      compiled,
      futureProjection.engine,
      {},
    );
    assert.equal(projected.status, "reject");
    assert.equal(
      projected.issues[0].code,
      "SURVEY_PROFILE_FEATURE_UNAVAILABLE",
    );
    assert.deepEqual(
      profile.spec.executionClosure.transitionIds,
      ["AT01", "AT02", "AT03", "AT04"],
    );
  },
);
