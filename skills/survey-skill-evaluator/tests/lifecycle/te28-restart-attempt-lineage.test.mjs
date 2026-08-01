import assert from "node:assert/strict";
import test from "node:test";
import { readFile, writeFile } from "node:fs/promises";
import {
  IntegrityError,
  canonicalize,
} from "../../source/executables/engine/index.mjs";
import {
  makeCanonicalLifecycleFixture,
} from "../helpers/canonical-lifecycle-fixture.mjs";

test("TE28 cold restart replays exact attempt lineage and fails closed on idempotency drift or state tamper", async (t) => {
  const fixture = await makeCanonicalLifecycleFixture({
    transitionIds: ["AT01", "AT04", "AT06"],
    mutationByTransition: {
      AT01: ({ currentData, command }) => ({
        ...currentData,
        attempts: [
          ...(currentData.attempts ?? []),
          { attemptId: command.input.attemptId, state: "running" },
        ],
      }),
      AT04: ({ currentData, command }) => ({
        ...currentData,
        attempts: currentData.attempts.map((attempt) =>
          attempt.attemptId === command.input.attemptId
            ? { ...attempt, state: "terminal", outcome: command.input.outcome }
            : attempt,
        ),
      }),
      AT06: ({ currentData, command }) => ({
        ...currentData,
        inclusion: command.input.inclusion,
      }),
    },
  });
  t.after(fixture.cleanup);
  await fixture.seed({
    transitionId: "AT01",
    objectId: "te28-assignment",
    initialData: { attempts: [] },
  });
  const start = fixture.commandFor({
    transitionId: "AT01",
    objectId: "te28-assignment",
    expectedRevision: 0,
    idempotencyKey: "te28/attempt/1/start",
    input: { attemptId: "attempt-1" },
  });
  const started = await fixture.engine.execute(start);

  const reopened = await fixture.reopen();
  const replay = await reopened.engine.execute(start);
  assert.equal(replay.replayed, true);
  assert.equal(replay.eventRoot, started.eventRoot);
  assert.equal(replay.authoritativeStateRoot, started.authoritativeStateRoot);

  const drifted = fixture.commandFor({
    transitionId: "AT01",
    objectId: "te28-assignment",
    expectedRevision: 0,
    idempotencyKey: "te28/attempt/1/start",
    input: { attemptId: "attempt-rewritten" },
  });
  await assert.rejects(reopened.engine.execute(drifted), IntegrityError);

  await reopened.engine.execute(
    fixture.commandFor({
      transitionId: "AT04",
      objectId: "te28-assignment",
      expectedRevision: 1,
      idempotencyKey: "te28/attempt/1/outcome",
      input: { attemptId: "attempt-1", outcome: "candidate_failure" },
    }),
  );
  await reopened.engine.execute(
    fixture.commandFor({
      transitionId: "AT06",
      objectId: "te28-assignment",
      expectedRevision: 2,
      idempotencyKey: "te28/assignment/include",
      input: { inclusion: "all_assigned" },
    }),
  );
  const closed = await reopened.stateStore.load(
    "assignment",
    "te28-assignment",
    { required: true },
  );
  assert.equal(
    canonicalize(closed.authoritativeStateCore.semanticState.data.attempts),
    canonicalize([
      {
        attemptId: "attempt-1",
        state: "terminal",
        outcome: "candidate_failure",
      },
    ]),
  );

  const statePath = reopened.stateStore.pathFor(
    "assignment",
    "te28-assignment",
  );
  const tampered = JSON.parse(await readFile(statePath, "utf8"));
  tampered.authoritativeStateCore.semanticState.data.inclusion = "deleted";
  await writeFile(statePath, JSON.stringify(tampered), { mode: 0o600 });
  await assert.rejects(
    reopened.stateStore.load("assignment", "te28-assignment", {
      required: true,
    }),
    IntegrityError,
  );
});
