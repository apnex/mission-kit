import assert from "node:assert/strict";
import test from "node:test";
import {
  createCandidate,
  resealTamper,
  validateR12Provenance,
} from "./session-provenance-support.mjs";

const excludedFieldMatrix = [
  {
    class: "revision",
    mutate: (session) => {
      session.revision = 1;
    },
  },
  {
    class: "journal-derived commit/phase/runtime",
    mutate: (session) => {
      session.commitRevision = 1;
    },
  },
  {
    class: "block reason",
    mutate: (session) => {
      session.blockReason = "forbidden";
    },
  },
  {
    class: "empty array projections",
    mutate: (session) => {
      session.events.push({ forbidden: true });
    },
  },
  {
    class: "empty object projections",
    mutate: (session) => {
      session.responses.Q1 = { forbidden: true };
    },
  },
  {
    class: "nullable projections",
    mutate: (session) => {
      session.outbox = { forbidden: true };
    },
  },
  {
    class: "bootstrap drafts",
    mutate: (session) => {
      session.drafts.current.forbidden = true;
    },
  },
  {
    class: "initialization dependencies",
    mutate: (session) => {
      session.dependencies.rehydrationOutputs.push({
        forbidden: true,
      });
    },
  },
  {
    class: "phase-sensitive pending projection",
    mutate: (session) => {
      session.pendingProjection = { forbidden: true };
    },
  },
  {
    class: "journal-replayed views",
    mutate: (session) => {
      session.authoring.persistence.machineHeads[0].state =
        "waiting_for_round_1_responses";
    },
  },
];

test("R12 rejects every excluded-field matrix tamper after public root resealing", async (context) => {
for (const vector of excludedFieldMatrix) {
  await context.test(`a root-resealed ${vector.class} tamper is rejected`, async () => {
    const { session } = await createCandidate();
    const tampered = resealTamper(session, vector.mutate);

    assert.notEqual(
      tampered.snapshotDigest,
      session.snapshotDigest,
      "the attacker model deliberately recomputes the public root seal",
    );
    assert.throws(
      () => validateR12Provenance(tampered),
    );
  });
}

await context.test("snapshotDigest remains the final proof and rejects an unsealed post-proof mutation", async () => {
  const { session } = await createCandidate();
  const tampered = structuredClone(session);
  tampered.slug = "unsealed-post-proof-mutation";

  assert.throws(
    () => validateR12Provenance(tampered),
    {
      code: "SURVEY_SESSION_ROOT_SEAL_MISMATCH",
    },
  );
});
});
