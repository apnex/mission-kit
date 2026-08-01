import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  newRun,
  proposer,
  reachAwaitingRatification,
  substrate,
  transition
} from "../fixtures/runtime-fixture.mjs";
import { surveyRoot } from "../fixtures/root.mjs";

test("no package capability can ratify for the Director or promote itself", async () => {
  const run = await newRun();
  try {
    await reachAwaitingRatification(run);
    const candidate = run.session.candidates[0];
    const payload = {
      semanticDigest: candidate.semanticDigest,
      renderDigest: candidate.renderDigest,
      acknowledgedViewDigest: run.session.outbox.digest
    };
    for (const [label, actor] of [
      ["proposer", proposer()],
      ["validator", substrate()]
    ]) {
      await assert.rejects(
        transition(run, {
          event: "DIRECTOR_RATIFY",
          eventId: `self-authorization:${label}`,
          actor,
          payload
        }),
        (error) => error.code === "AUTHORITY_DENIED"
      );
      assert.equal(run.session.phase, "awaiting_ratification");
      assert.equal(run.session.ratification, null);
    }

    const packageManifest = JSON.parse(
      await readFile(`${surveyRoot}/survey-v2.package.json`, "utf8")
    );
    const protocol = JSON.parse(
      await readFile(`${surveyRoot}/source/protocol/survey.protocol.json`, "utf8")
    );
    assert.equal(
      packageManifest.members.some(({ path }) => (
        (path.startsWith("scripts/") || path.startsWith("source/executables/")) &&
        /promot/i.test(path)
      )),
      false
    );
    assert.equal(
      protocol.machines.some((machine) => machine.events.some(({ id }) => /PROMOT/.test(id))),
      false
    );
  } finally {
    await run.cleanup();
  }
});
