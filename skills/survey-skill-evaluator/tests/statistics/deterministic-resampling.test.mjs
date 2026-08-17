import test from "node:test";
import assert from "node:assert/strict";
import {
  createDeterministicRng,
  resampleByDependence,
} from "../../source/executables/statistics/index.mjs";
import { blockedObservations, clusteredPlan } from "./fixtures.mjs";

test("dependence resampling is reproducible for the same domain-separated seed", () => {
  const first = resampleByDependence(
    blockedObservations,
    clusteredPlan(),
    createDeterministicRng({ seed: "fixed", purpose: "golden" }),
  );
  const second = resampleByDependence(
    blockedObservations,
    clusteredPlan(),
    createDeterministicRng({ seed: "fixed", purpose: "golden" }),
  );
  assert.deepEqual(first, second);
});
