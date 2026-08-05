import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  mutationDigest,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  mutationResult,
} from "../../../source/authoring/kernel/reducer-results.mjs";

const fixtureUrl = new URL(
  "../../fixtures/authoring/contracts/positive/authoring-mutation.json",
  import.meta.url,
);

function reidentifyMutation(mutation) {
  mutation.spec.mutationDigest = mutationDigest(mutation);
  mutation.metadata.name =
    `mutation-${mutation.spec.mutationDigest.slice("sha256:".length)}`;
}

test(
  "mutation results reject an invalid next authoring state after deterministic identity is recomputed",
  async () => {
    const mutation = JSON.parse(await readFile(fixtureUrl, "utf8"));
    mutation.spec.nextAuthoringState = "awaiting-acceptance";
    reidentifyMutation(mutation);

    assert.equal(mutation.spec.mutationDigest, mutationDigest(mutation));
    assert.throws(
      () => mutationResult(mutation),
      /nextAuthoringState/u,
    );

    mutation.spec.nextAuthoringState = "complete";
    reidentifyMutation(mutation);
    assert.throws(
      () => mutationResult(mutation),
      /cause edge toState/u,
    );
  },
);
