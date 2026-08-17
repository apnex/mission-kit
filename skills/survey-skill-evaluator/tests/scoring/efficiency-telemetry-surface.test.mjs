import assert from "node:assert/strict";
import test from "node:test";
import {
  projectEfficiencyTelemetry,
  TELEMETRY_KINDS,
} from "../../source/executables/evidence/index.mjs";

test("efficiency telemetry preserves every native surface while exposing only observed toil for minimization", () => {
  const observations = TELEMETRY_KINDS.map((kind, index) => ({
    kind,
    status: index === 8 ? "unavailable" : "observed",
    nativeValue: index === 8 ? null : index + 1,
    nativeUnit: kind === "elapsed_ms" ? "milliseconds" : "count",
    attentionEconomicClass:
      kind === "turns"
        ? "learning_investment"
        : index === 8
          ? "unresolved"
          : "toil",
    adverseOptimizationEligible:
      kind !== "turns" && index !== 8,
  }));
  const result = projectEfficiencyTelemetry({
    ledgerId: "telemetry-attempt-1",
    observations,
  });
  assert.equal(result.completeRegisteredSurface, true);
  assert.deepEqual(
    result.observations.map((entry) => entry.kind),
    TELEMETRY_KINDS,
  );
  assert.deepEqual(result.protectedLearningKinds, ["turns"]);
  assert.deepEqual(result.unavailableKinds, ["interventions"]);
  assert.equal(result.observedToilKinds.includes("turns"), false);

  assert.throws(
    () =>
      projectEfficiencyTelemetry({
        ledgerId: "telemetry-attempt-1",
        observations: [
          {
            kind: "turns",
            status: "observed",
            nativeValue: 2,
            nativeUnit: "count",
            attentionEconomicClass: "learning_investment",
            adverseOptimizationEligible: true,
          },
        ],
      }),
    /Only observed toil/u,
  );
});
