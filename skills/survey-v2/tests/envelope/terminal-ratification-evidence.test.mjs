import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  finalizeSurveyEnvelope
} from "../../source/executables/runtime/lib/engine.mjs";
import {
  director,
  newRun,
  reachAwaitingRatification,
  transition
} from "../fixtures/runtime-fixture.mjs";
import { surveyRoot } from "../fixtures/root.mjs";

test("the terminal envelope carries detached ratification evidence for the exact reviewed candidate", async () => {
  const run = await newRun();
  try {
    await reachAwaitingRatification(run);
    const candidate = run.session.candidates[0];
    const eventId = "terminal-ratification-evidence:ratify";
    await transition(run, {
      event: "DIRECTOR_RATIFY",
      eventId,
      actor: director(),
      payload: {
        semanticDigest: candidate.semanticDigest,
        renderDigest: candidate.renderDigest,
        acknowledgedViewDigest: run.session.outbox.digest
      }
    });
    const finalized = await finalizeSurveyEnvelope(surveyRoot, run.runDirectory, {
      eventIdPrefix: "terminal-ratification-evidence",
      expectedRevision: run.session.revision
    });
    const terminalBytes = await readFile(
      path.join(run.runDirectory, finalized.session.finalization.targetPath),
      "utf8"
    );
    assert.match(terminalBytes, /"status": "ratified"/u);
    assert.match(terminalBytes, new RegExp(`"eventId": "${eventId}"`, "u"));
    assert.match(
      terminalBytes,
      new RegExp(`"semanticDigest": "${candidate.semanticDigest}"`, "u")
    );
    assert.match(
      terminalBytes,
      new RegExp(`"renderDigest": "${candidate.renderDigest}"`, "u")
    );
    assert.doesNotMatch(terminalBytes, /"status": "pending"/u);
  } finally {
    await run.cleanup();
  }
});
