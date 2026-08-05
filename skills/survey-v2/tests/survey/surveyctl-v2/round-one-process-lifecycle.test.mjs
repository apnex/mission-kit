import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import {
  readFile,
} from "node:fs/promises";
import {
  createSurveyctlHarness,
  runSurveyctlProcess,
  writeRoundOneFrameInput,
  writeSurveyFrameInput,
} from "./support.mjs";

function parseJson(result) {
  assert.equal(
    result.code,
    0,
    result.stderr.toString("utf8"),
  );
  return JSON.parse(result.stdout.toString("utf8"));
}

function runArguments(harness, command, {
  target,
  input,
} = {}) {
  return [
    command,
    ...(target === undefined ? [] : [target]),
    `--run=${harness.runDirectory}`,
    `--key-root=${harness.keyRoot}`,
    ...(input === undefined ? [] : [`--input=${input}`]),
    "--format=json",
  ];
}

async function showPending(harness, target) {
  return parseJson(
    await runSurveyctlProcess(
      runArguments(harness, "show", { target }),
    ),
  );
}

test("separate surveyctl processes commit and cold-validate the complete AT03 Round 1 frame slice", async (testContext) => {
  const harness = await createSurveyctlHarness(testContext, {
    slug: "round-one-process-lifecycle",
  });
  const initialized = parseJson(
    await runSurveyctlProcess([
      "init",
      harness.initOptions.slug,
      `--sessions-root=${harness.sessionsRoot}`,
      `--source-root=${harness.sourceRoot}`,
      "--source=intent.txt",
      "--director-ref=director.synthetic",
      "--proposer-ref=proposer.synthetic",
      "--binding-evidence=surveyctl-v2-test",
      "--axiom-corpus=false",
      `--key-root=${harness.keyRoot}`,
      "--format=json",
    ]),
  );
  harness.runDirectory = initialized.runDirectory;
  harness.sessionFile = path.join(
    initialized.runDirectory,
    "session.json",
  );

  parseJson(
    await runSurveyctlProcess(
      runArguments(harness, "next"),
    ),
  );
  const surveyPending = {
    request: await showPending(harness, "pending:request"),
    contextClosure:
      await showPending(harness, "pending:context"),
    assignment:
      await showPending(harness, "pending:assignment"),
  };
  const surveyInput = await writeSurveyFrameInput(
    harness,
    surveyPending,
  );
  const surveySubmitted = parseJson(
    await runSurveyctlProcess(
      runArguments(harness, "submit", {
        input: surveyInput,
      }),
    ),
  );
  assert.equal(
    surveySubmitted.authoringState,
    "round_1_frame_required",
  );

  const firstRoundNext = await runSurveyctlProcess(
    runArguments(harness, "next"),
  );
  parseJson(firstRoundNext);
  const afterFirstRoundNext = await readFile(
    harness.sessionFile,
  );
  const repeatedRoundNext = await runSurveyctlProcess(
    runArguments(harness, "next"),
  );
  parseJson(repeatedRoundNext);
  assert.deepEqual(
    repeatedRoundNext.stdout,
    firstRoundNext.stdout,
  );
  assert.deepEqual(
    await readFile(harness.sessionFile),
    afterFirstRoundNext,
  );
  const roundPending = {
    request: await showPending(harness, "pending:request"),
    contextClosure:
      await showPending(harness, "pending:context"),
    assignment:
      await showPending(harness, "pending:assignment"),
  };
  assert.deepEqual(
    Object.keys(roundPending.request.spec.operation.inputs),
    ["survey", "survey-frame"],
  );
  assert.deepEqual(
    roundPending.contextClosure.spec.layers.map(
      (layer) => [
        layer.role,
        layer.selectedValue.map(({ path: selected }) => selected),
      ],
    ),
    [
      ["survey-frame", ["/spec"]],
      ["survey", ["/spec/outcomeAxes"]],
    ],
  );
  const roundInput = await writeRoundOneFrameInput(
    harness,
    roundPending,
  );
  const roundSubmitted = parseJson(
    await runSurveyctlProcess(
      runArguments(harness, "submit", {
        input: roundInput,
      }),
    ),
  );
  assert.equal(roundSubmitted.disposition, "committed");
  assert.equal(roundSubmitted.commitRevision, 5);
  assert.equal(
    roundSubmitted.authoringState,
    "round_1_question_frames_required",
  );
  assert.equal(roundSubmitted.semanticRevision, 3);
  assert.equal(roundSubmitted.evidenceRevision, 5);

  const validation = parseJson(
    await runSurveyctlProcess(
      runArguments(harness, "validate"),
    ),
  );
  assert.equal(validation.status, "valid");
  assert.equal(validation.commitRevision, 5);

  const tree = parseJson(
    await runSurveyctlProcess(
      runArguments(harness, "tree"),
    ),
  );
  assert.deepEqual(
    tree.activeHeads.map(({ slot }) => slot),
    [
      "intake",
      "policy",
      "round-1",
      "round-1-frame",
      "survey",
      "survey-frame",
    ],
  );
  assert.equal(
    tree.resourceVersions.filter(
      ({ reference }) =>
        reference.kind === "SurveyRound",
    ).length,
    1,
  );
  assert.equal(
    tree.resourceVersions.filter(
      ({ reference }) =>
        reference.kind === "GenerationRecord",
    ).length,
    2,
  );

  const coldStatus = parseJson(
    await runSurveyctlProcess(
      runArguments(harness, "status"),
    ),
  );
  assert.equal(coldStatus.commitRevision, 5);
  assert.equal(
    coldStatus.authoringState,
    "round_1_question_frames_required",
  );
  assert.equal(coldStatus.pending, null);
  assert.equal(coldStatus.nextDisposition, "issue-or-wait");

  const beforeUnavailable = await readFile(
    harness.sessionFile,
  );
  const unavailable = await runSurveyctlProcess(
    runArguments(harness, "next"),
  );
  assert.equal(unavailable.code, 1);
  assert.equal(unavailable.stdout.byteLength, 0);
  assert.match(
    unavailable.stderr.toString("utf8"),
    /PROFILE_EXECUTION_TRANSITION_UNAVAILABLE/u,
  );
  assert.deepEqual(
    await readFile(harness.sessionFile),
    beforeUnavailable,
  );
});
