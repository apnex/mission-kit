import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  contextClosureDigest,
  requestCoreDigest,
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  taskResult,
} from "../../../source/authoring/kernel/reducer-results.mjs";

const fixtureRoot = new URL(
  "../../fixtures/authoring/contracts/positive/",
  import.meta.url,
);

async function fixture(stem) {
  return JSON.parse(
    await readFile(new URL(`${stem}.json`, fixtureRoot), "utf8"),
  );
}

function reidentifyTask(contextClosure, request) {
  contextClosure.spec.closureDigest =
    contextClosureDigest(contextClosure);
  contextClosure.metadata.name =
    `context-${contextClosure.spec.closureDigest.slice("sha256:".length)}`;
  request.spec.contextClosure = {
    reference: resourceReferenceFrom(contextClosure),
    closureDigest: contextClosure.spec.closureDigest,
  };
  request.spec.requestDigest = requestCoreDigest(request);
  request.metadata.name =
    `request-${request.spec.requestDigest.slice("sha256:".length)}`;
}

test(
  "task results reject malformed context closure layers after deterministic identities are recomputed",
  async () => {
    const cases = [
      {
        label: "ambient layer field",
        mutate(layer) {
          layer.ambient = true;
        },
        expected: /exact closed fields/u,
      },
      {
        label: "non-contiguous layer ordinal",
        mutate(layer) {
          layer.ordinal = 2;
        },
        expected: /layer 0 ordinal/u,
      },
      {
        label: "snapshot-divergent source integrity",
        mutate(layer) {
          layer.sourceIntegrityDigest = `sha256:${"0".repeat(64)}`;
        },
        expected: /source bindings/u,
      },
    ];

    for (const { label, mutate, expected } of cases) {
      const [contextClosure, request] = await Promise.all([
        fixture("context-closure"),
        fixture("authoring-request"),
      ]);
      mutate(contextClosure.spec.layers[0]);
      reidentifyTask(contextClosure, request);

      assert.equal(
        contextClosure.spec.closureDigest,
        contextClosureDigest(contextClosure),
        label,
      );
      assert.equal(
        request.spec.requestDigest,
        requestCoreDigest(request),
        label,
      );
      assert.throws(
        () => taskResult({ contextClosure, request }),
        expected,
        label,
      );
    }
  },
);
