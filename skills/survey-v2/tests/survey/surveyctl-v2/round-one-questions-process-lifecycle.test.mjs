import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import {
  readFile,
} from "node:fs/promises";
import {
  canonicalize,
} from "../../../source/authoring/kernel/canonical.mjs";
import {
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  renderCurrentQuestionPresentation,
} from "../../../source/authoring/survey/director-question-projection.mjs";
import {
  roundOneQuestionFrameValues,
} from "../round-one-question-frames/support.mjs";
import {
  roundOneQuestionValues,
} from "../round-one-questions/support.mjs";
import {
  createSurveyctlHarness,
  runSurveyctlProcess,
  writeRoundOneFrameInput,
  writeRoundOneQuestionFramesInput,
  writeRoundOneQuestionsInput,
  writeSurveyFrameInput,
} from "./support.mjs";

const newProductSlots = Object.freeze([
  "round-1-question-1",
  "round-1-question-2",
  "round-1-question-3",
  "round-1-question-binding-1",
  "round-1-question-binding-2",
  "round-1-question-binding-3",
  "round-1-instrument",
]);

function parseJson(result) {
  assert.equal(
    result.code,
    0,
    result.stderr.toString("utf8"),
  );
  return JSON.parse(result.stdout.toString("utf8"));
}

function commandArguments(
  harness,
  command,
  {
    target,
    input,
  } = {},
) {
  return [
    command,
    ...(target === undefined ? [] : [target]),
    `--run=${harness.runDirectory}`,
    `--key-root=${harness.keyRoot}`,
    ...(input === undefined ? [] : [`--input=${input}`]),
    "--format=json",
  ];
}

async function runJson(harness, command, additions = {}) {
  return parseJson(
    await runSurveyctlProcess(
      commandArguments(harness, command, additions),
    ),
  );
}

async function showPending(harness) {
  return {
    request: await runJson(
      harness,
      "show",
      { target: "pending:request" },
    ),
    contextClosure: await runJson(
      harness,
      "show",
      { target: "pending:context" },
    ),
    assignment: await runJson(
      harness,
      "show",
      { target: "pending:assignment" },
    ),
  };
}

async function submitCurrentTask(harness, writeInput) {
  await runJson(harness, "next");
  const pending = await showPending(harness);
  const input = await writeInput(harness, pending);
  return runJson(harness, "submit", { input });
}

function referenceMap(tree) {
  return new Map(
    tree.activeHeads.map(
      ({ slot, reference }) => [slot, reference],
    ),
  );
}

function compareReferences(left, right) {
  return Buffer.compare(
    Buffer.from(canonicalize(left), "utf8"),
    Buffer.from(canonicalize(right), "utf8"),
  );
}

function exactRoundOneInstrumentEdges(
  references,
  contextClosureReference,
) {
  const questions = [1, 2, 3].map(
    (ordinal) =>
      references.get(`round-1-question-${ordinal}`),
  );
  const bindings = [1, 2, 3].map(
    (ordinal) =>
      references.get(`round-1-question-binding-${ordinal}`),
  );
  const questionFrames = [1, 2, 3].map(
    (ordinal) =>
      references.get(`round-1-question-frame-${ordinal}`),
  );
  const frameSet =
    references.get("round-1-question-frame-set");
  const instrument = references.get("round-1-instrument");
  const bindingTargets = [
    frameSet,
    ...questions,
    ...bindings,
  ].sort(compareReferences);
  return [
    ...questions.map((from, index) => ({
      from,
      to: questionFrames[index],
      relation: "derived-from",
    })),
    ...bindings.flatMap((from, index) => [
      {
        from,
        to: frameSet,
        relation: "belongs-to",
      },
      {
        from,
        to: questions[index],
        relation: "binds",
      },
      {
        from,
        to: questionFrames[index],
        relation: "derived-from",
      },
    ]),
    {
      from: instrument,
      to: references.get("round-1"),
      relation: "belongs-to",
    },
    ...bindingTargets.map((to) => ({
      from: instrument,
      to,
      relation: "binds",
    })),
    {
      from: instrument,
      to: contextClosureReference,
      relation: "derived-from",
    },
    {
      from: instrument,
      to: references.get("policy"),
      relation: "governed-by",
    },
  ];
}

test(
  "separate surveyctl processes commit AT05 and cold-resume the exact Q1-ready instrument",
  async (testContext) => {
    const harness = await createSurveyctlHarness(testContext, {
      slug: "round-one-questions-process",
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

    await submitCurrentTask(
      harness,
      writeSurveyFrameInput,
    );
    await submitCurrentTask(
      harness,
      writeRoundOneFrameInput,
    );
    const frameSetSubmitted = await submitCurrentTask(
      harness,
      writeRoundOneQuestionFramesInput,
    );
    assert.equal(frameSetSubmitted.disposition, "committed");
    assert.equal(frameSetSubmitted.commitRevision, 7);
    assert.equal(frameSetSubmitted.semanticRevision, 4);
    assert.equal(frameSetSubmitted.evidenceRevision, 7);
    assert.equal(
      frameSetSubmitted.authoringState,
      "round_1_questions_required",
    );

    const treeBeforeAt05 = await runJson(harness, "tree");
    const beforeAt05Bytes = await readFile(
      harness.sessionFile,
    );
    const issued = await runSurveyctlProcess(
      commandArguments(harness, "next"),
    );
    const issuedView = parseJson(issued);
    assert.equal(
      issuedView.taskId,
      "author-round-1-questions",
    );
    const afterAt05IssueBytes = await readFile(
      harness.sessionFile,
    );
    assert.notDeepEqual(
      afterAt05IssueBytes,
      beforeAt05Bytes,
    );
    const repeated = await runSurveyctlProcess(
      commandArguments(harness, "next"),
    );
    parseJson(repeated);
    assert.deepEqual(repeated.stdout, issued.stdout);
    assert.deepEqual(
      await readFile(harness.sessionFile),
      afterAt05IssueBytes,
    );

    const pending = await showPending(harness);
    assert.deepEqual(
      pending.contextClosure.spec.layers.map(
        ({ role, selectedValue }) => [
          role,
          selectedValue.map(({ path: selected }) => selected),
        ],
      ),
      [
        ["survey-frame", ["/spec"]],
        ["round-frame", ["/spec"]],
        [
          "question-frame-set",
          [
            "/spec/slots/0/intentDimension",
            "/spec/slots/0/outcomeAxisAnchors",
            "/spec/slots/1/intentDimension",
            "/spec/slots/1/outcomeAxisAnchors",
            "/spec/slots/2/intentDimension",
            "/spec/slots/2/outcomeAxisAnchors",
            "/spec/coverageRationale",
            "/spec/orthogonalityRationale",
          ],
        ],
        ["question-frame-1", ["/spec"]],
        ["question-frame-2", ["/spec"]],
        ["question-frame-3", ["/spec"]],
        [
          "policy",
          [
            "/spec/geometry/questionsPerRound",
            "/spec/geometry/choiceOptions",
            "/spec/disclosure/mode",
            "/spec/disclosure/siblingQuestionFramesVisible",
            "/spec/disclosure/futureQuestionsVisible",
            "/spec/disclosure/interimInterpretationVisible",
            "/spec/validation/rationaleRequired",
            "/spec/validation/authority",
          ],
        ],
      ],
    );
    const contextClosureReference =
      resourceReferenceFrom(pending.contextClosure);
    const input = await writeRoundOneQuestionsInput(
      harness,
      pending,
    );
    const submitted = await runJson(
      harness,
      "submit",
      { input },
    );
    assert.equal(submitted.disposition, "committed");
    assert.equal(submitted.commitRevision, 9);
    assert.equal(submitted.semanticRevision, 5);
    assert.equal(submitted.evidenceRevision, 9);
    assert.equal(
      submitted.authoringState,
      "waiting_for_round_1_responses",
    );

    const committedBytes = await readFile(
      harness.sessionFile,
    );
    const validation = await runJson(harness, "validate");
    assert.equal(validation.status, "valid");
    assert.equal(validation.commitRevision, 9);
    assert.equal(validation.pendingViewDigest, null);
    const status = await runJson(harness, "status");
    assert.equal(status.commitRevision, 9);
    assert.equal(status.phase, "round_1_q1_ready");
    assert.equal(
      status.authoringState,
      "waiting_for_round_1_responses",
    );
    assert.equal(status.pending, null);
    assert.equal(status.nextDisposition, "issue-or-wait");
    const tree = await runJson(harness, "tree");
    assert.deepEqual(
      await readFile(harness.sessionFile),
      committedBytes,
    );

    const session = JSON.parse(
      committedBytes.toString("utf8"),
    );
    assert.equal(session.phase, "round_1_q1_ready");
    assert.equal(
      session.authoring.workspace.spec.authoringState,
      "waiting_for_round_1_responses",
    );
    assert.notEqual(session.pendingProjection, null);
    assert.equal(session.outbox, null);
    assert.deepEqual(session.attempts, []);
    assert.deepEqual(session.responses, {});
    assert.equal(
      session.pendingProjection.viewKind,
      "question",
    );
    assert.equal(
      session.pendingProjection.unit.questionOrdinal,
      1,
    );
    assert.deepEqual(
      session.pendingProjection.sourceSelections.map(
        ({ role }) => role,
      ),
      [
        "survey-frame",
        "round-frame",
        "question-frame",
        "question",
      ],
    );

    const questionValues = roundOneQuestionValues();
    const frameValues = roundOneQuestionFrameValues();
    const recipeText = JSON.stringify(
      session.pendingProjection,
    );
    assert.equal(
      recipeText.includes(questionValues["q1-prompt"]),
      true,
    );
    assert.equal(
      recipeText.includes(frameValues["q1-synopsis"]),
      true,
    );
    for (const sentinel of [
      questionValues["q2-prompt"],
      questionValues["q3-prompt"],
      questionValues["q2-options"][0],
      questionValues["q3-options"][0],
      frameValues["q2-subject"],
      frameValues["q3-subject"],
      frameValues["q2-synopsis"],
      frameValues["q3-synopsis"],
    ]) {
      assert.equal(
        recipeText.includes(sentinel),
        false,
        `Q1 recipe leaked sibling sentinel: ${sentinel}`,
      );
    }
    const presentation = renderCurrentQuestionPresentation(
      session.pendingProjection,
    );
    assert.equal(presentation.kind, "question");
    assert.equal(presentation.questionId, "Q1");
    assert.equal(
      presentation.prompt.text,
      questionValues["q1-prompt"],
    );
    assert.equal(
      presentation.context.questionSynopsis,
      frameValues["q1-synopsis"],
    );
    assert.equal(
      JSON.stringify(presentation).includes(
        questionValues["q2-prompt"],
      ),
      false,
    );

    const beforeSlots = new Set(
      treeBeforeAt05.activeHeads.map(({ slot }) => slot),
    );
    const addedHeads = tree.activeHeads.filter(
      ({ slot }) => !beforeSlots.has(slot),
    );
    assert.deepEqual(
      addedHeads.map(({ slot }) => slot),
      [...newProductSlots].sort(),
    );
    assert.deepEqual(
      addedHeads.map(({ reference }) => reference.kind),
      [
        "RoundInstrument",
        "Question",
        "Question",
        "Question",
        "SurveyQuestionBinding",
        "SurveyQuestionBinding",
        "SurveyQuestionBinding",
      ],
    );

    const references = referenceMap(tree);
    const newSourceKeys = new Set(
      newProductSlots.map(
        (slot) => canonicalize(references.get(slot)),
      ),
    );
    const actualEdges = tree.dependencyEdges.filter(
      ({ from }) =>
        newSourceKeys.has(canonicalize(from)),
    );
    const expectedEdges = exactRoundOneInstrumentEdges(
      references,
      contextClosureReference,
    );
    assert.equal(actualEdges.length, 22);
    assert.deepEqual(actualEdges, expectedEdges);
    assert.deepEqual(
      tree.handoffProducts,
      [{
        slot: "round-1-instrument",
        reference: references.get("round-1-instrument"),
      }],
    );

    const waitingNext = await runSurveyctlProcess(
      commandArguments(harness, "next"),
    );
    assert.equal(waitingNext.code, 0);
    assert.equal(waitingNext.stderr.byteLength, 0);
    assert.deepEqual(
      JSON.parse(waitingNext.stdout.toString("utf8")),
      {
        kind: "SurveyctlWait",
        disposition: "wait",
        state: {
          id: "waiting_for_round_1_responses",
          label: "Wait for Round 1 responses",
          class: "wait",
        },
      },
    );
    assert.deepEqual(
      await readFile(harness.sessionFile),
      committedBytes,
    );
  },
);
