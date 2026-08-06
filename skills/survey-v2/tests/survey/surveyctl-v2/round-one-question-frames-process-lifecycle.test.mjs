import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { readFile } from "node:fs/promises";
import {
  createSurveyctlHarness,
  runSurveyctlProcess,
  writeRoundOneFrameInput,
  writeRoundOneQuestionFramesInput,
  writeSurveyFrameInput,
} from "./support.mjs";

function parse(result) {
  assert.equal(result.code, 0, result.stderr.toString("utf8"));
  return JSON.parse(result.stdout.toString("utf8"));
}

function args(harness, command, additions = []) {
  return [
    command,
    `--run=${harness.runDirectory}`,
    `--key-root=${harness.keyRoot}`,
    ...additions,
    "--format=json",
  ];
}

async function show(harness, target) {
  return parse(await runSurveyctlProcess([
    "show",
    target,
    `--run=${harness.runDirectory}`,
    `--key-root=${harness.keyRoot}`,
    "--format=json",
  ]));
}

async function pending(harness) {
  return {
    request: await show(harness, "pending:request"),
    contextClosure: await show(harness, "pending:context"),
    assignment: await show(harness, "pending:assignment"),
  };
}

test("separate surveyctl processes cold-resume through AT04 and reproduce the issued AT05 assignment", async (context) => {
  const harness = await createSurveyctlHarness(context, {
    slug: "round-one-question-frames-process",
  });
  const initialized = parse(await runSurveyctlProcess([
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
  ]));
  harness.runDirectory = initialized.runDirectory;
  harness.sessionFile = path.join(harness.runDirectory, "session.json");

  parse(await runSurveyctlProcess(args(harness, "next")));
  let current = await pending(harness);
  let input = await writeSurveyFrameInput(harness, current);
  parse(await runSurveyctlProcess(
    args(harness, "submit", [`--input=${input}`]),
  ));

  parse(await runSurveyctlProcess(args(harness, "next")));
  current = await pending(harness);
  input = await writeRoundOneFrameInput(harness, current);
  parse(await runSurveyctlProcess(
    args(harness, "submit", [`--input=${input}`]),
  ));

  const firstNext = await runSurveyctlProcess(args(harness, "next"));
  parse(firstNext);
  const afterFirstNext = await readFile(harness.sessionFile);
  const repeatedNext = await runSurveyctlProcess(args(harness, "next"));
  parse(repeatedNext);
  assert.deepEqual(repeatedNext.stdout, firstNext.stdout);
  assert.deepEqual(await readFile(harness.sessionFile), afterFirstNext);
  current = await pending(harness);
  assert.deepEqual(
    current.contextClosure.spec.layers.map((layer) => [
      layer.role,
      layer.selectedValue.map(({ path: selected }) => selected),
    ]),
    [
      ["survey-frame", ["/spec"]],
      ["round-frame", ["/spec"]],
      ["survey", ["/spec/outcomeAxes"]],
    ],
  );
  input = await writeRoundOneQuestionFramesInput(harness, current);
  const submitted = parse(await runSurveyctlProcess(
    args(harness, "submit", [`--input=${input}`]),
  ));
  assert.equal(submitted.disposition, "committed");
  assert.equal(submitted.commitRevision, 7);
  assert.equal(submitted.semanticRevision, 4);
  assert.equal(submitted.evidenceRevision, 7);
  assert.equal(
    submitted.authoringState,
    "round_1_questions_required",
  );

  const validation = parse(await runSurveyctlProcess(
    args(harness, "validate"),
  ));
  assert.equal(validation.status, "valid");
  assert.equal(validation.commitRevision, 7);
  const firstQuestionNext = await runSurveyctlProcess(
    args(harness, "next"),
  );
  const firstQuestionOutput = parse(firstQuestionNext);
  assert.equal(
    firstQuestionOutput.taskId,
    "author-round-1-questions",
  );
  const afterQuestionIssue = await readFile(harness.sessionFile);
  const repeatedQuestionNext = await runSurveyctlProcess(
    args(harness, "next"),
  );
  assert.deepEqual(repeatedQuestionNext.stdout, firstQuestionNext.stdout);
  assert.deepEqual(
    await readFile(harness.sessionFile),
    afterQuestionIssue,
  );
});
