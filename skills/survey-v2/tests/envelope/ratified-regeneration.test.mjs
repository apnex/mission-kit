import assert from "node:assert/strict";
import {
  readFile,
  readdir,
  unlink
} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  attachRatificationEvidence,
  renderEnvelopeModel
} from "../../source/executables/runtime/lib/envelope.mjs";
import {
  checkSurveyEnvelope,
  finalizeSurveyEnvelope
} from "../../source/executables/runtime/lib/engine.mjs";
import {
  director,
  newRun,
  reachAwaitingRatification,
  transition
} from "../fixtures/runtime-fixture.mjs";
import { surveyRoot } from "../fixtures/root.mjs";

test("a ratified session regenerates one byte-identical self-contained envelope", async () => {
  const run = await newRun();
  try {
    await reachAwaitingRatification(run);
    const candidate = run.session.candidates[0];
    await transition(run, {
      event: "DIRECTOR_RATIFY",
      eventId: "ratified-regeneration:ratify",
      actor: director(),
      payload: {
        semanticDigest: candidate.semanticDigest,
        renderDigest: candidate.renderDigest,
        acknowledgedViewDigest: run.session.outbox.digest
      }
    });
    const finalized = await finalizeSurveyEnvelope(surveyRoot, run.runDirectory, {
      eventIdPrefix: "ratified-regeneration",
      expectedRevision: run.session.revision
    });
    run.session = finalized.session;
    const target = path.join(run.runDirectory, run.session.finalization.targetPath);
    const first = await readFile(target);
    const terminalModel = attachRatificationEvidence(
      candidate.model,
      run.session.ratification
    );
    assert.deepEqual(first, Buffer.from(renderEnvelopeModel(terminalModel), "utf8"));
    assert.notDeepEqual(first, Buffer.from(candidate.renderedBytes, "utf8"));
    await unlink(target);
    await finalizeSurveyEnvelope(surveyRoot, run.runDirectory);
    const regenerated = await readFile(target);
    assert.deepEqual(regenerated, first);
    assert.equal(
      (await readdir(run.runDirectory)).filter((entry) => entry.endsWith("-survey.md")).length,
      1
    );
    const checked = await checkSurveyEnvelope(run.runDirectory);
    assert.equal(checked.digest, run.session.finalization.digest);
  } finally {
    await run.cleanup();
  }
});
