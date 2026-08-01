import assert from "node:assert/strict";
import test from "node:test";
import {
  director,
  reachAwaitingRatification,
  newRun,
  transition
} from "../fixtures/runtime-fixture.mjs";

test("withholding withdrawal and ratification preserve exact candidate ancestry", async () => {
  const ratificationRun = await newRun();
  try {
    await reachAwaitingRatification(ratificationRun);
    const candidate = ratificationRun.session.candidates[0];
    await transition(ratificationRun, {
      event: "DIRECTOR_RETURN",
      eventId: "ancestry:return",
      actor: director(),
      payload: {
        kind: "withholding",
        feedback: "I am withholding without requesting a semantic correction."
      }
    });
    await assert.rejects(
      transition(ratificationRun, {
        event: "DIRECTOR_WITHDRAW_RETURN",
        eventId: "ancestry:changed",
        actor: director(),
        payload: {
          withdrawal: "pure-withholding",
          semanticDigest: "sha256:".padEnd(71, "0"),
          renderDigest: candidate.renderDigest
        }
      }),
      (error) => error.code === "WITHHOLDING_WITHDRAWAL_INVALID"
    );
    await transition(ratificationRun, {
      event: "DIRECTOR_WITHDRAW_RETURN",
      eventId: "ancestry:withdraw",
      actor: director(),
      payload: {
        withdrawal: "pure-withholding",
        semanticDigest: candidate.semanticDigest,
        renderDigest: candidate.renderDigest
      }
    });
    await transition(ratificationRun, {
      event: "DIRECTOR_RATIFY",
      eventId: "ancestry:ratify",
      actor: director(),
      payload: {
        semanticDigest: candidate.semanticDigest,
        renderDigest: candidate.renderDigest,
        acknowledgedViewDigest: ratificationRun.session.outbox.digest
      }
    });
    assert.equal(ratificationRun.session.ratification.semanticDigest, candidate.semanticDigest);
    assert.equal(ratificationRun.session.ratification.renderDigest, candidate.renderDigest);
  } finally {
    await ratificationRun.cleanup();
  }
});
