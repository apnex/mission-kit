import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import {
  createSurveyctlHarness,
  runSurveyctlProcess,
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
  format = "json",
  target,
  input,
} = {}) {
  return [
    command,
    ...(target === undefined ? [] : [target]),
    `--run=${harness.runDirectory}`,
    `--key-root=${harness.keyRoot}`,
    ...(input === undefined ? [] : [`--input=${input}`]),
    `--format=${format}`,
  ];
}

async function showPending(harness, target) {
  return parseJson(
    await runSurveyctlProcess(
      runArguments(harness, "show", { target }),
    ),
  );
}

test(
  "separate surveyctl processes complete and cold-resume one durable SurveyFrame lifecycle",
  async (testContext) => {
    const harness = await createSurveyctlHarness(testContext, {
      slug: "full-process-lifecycle",
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
    assert.equal(initialized.commitRevision, 1);
    assert.equal(
      initialized.authoringState,
      "survey_frame_required",
    );

    const nextText = await runSurveyctlProcess(
      runArguments(harness, "next", { format: "text" }),
    );
    assert.equal(
      nextText.code,
      0,
      nextText.stderr.toString("utf8"),
    );
    assert.match(
      nextText.stdout.toString("utf8"),
      /^<!-- mission-kit-authoring-text:v1 request=/u,
    );

    const request = await showPending(
      harness,
      "pending:request",
    );
    const contextClosure = await showPending(
      harness,
      "pending:context",
    );
    const assignment = await showPending(
      harness,
      "pending:assignment",
    );
    const exactBlank = Buffer.from(
      assignment.spec.uneditedSkeleton.content.data,
      "base64",
    );
    assert.equal(
      exactBlank.byteLength,
      assignment.spec.uneditedSkeleton.content.byteLength,
    );
    assert.deepEqual(nextText.stdout, exactBlank);

    const input = await writeSurveyFrameInput(harness, {
      request,
      contextClosure,
      assignment,
    });
    const submitted = parseJson(
      await runSurveyctlProcess(
        runArguments(harness, "submit", { input }),
      ),
    );
    assert.equal(submitted.disposition, "committed");
    assert.equal(submitted.commitRevision, 3);
    assert.equal(
      submitted.authoringState,
      "round_1_frame_required",
    );
    assert.equal(submitted.semanticRevision, 2);
    assert.equal(submitted.evidenceRevision, 3);

    const validation = parseJson(
      await runSurveyctlProcess(
        runArguments(harness, "validate"),
      ),
    );
    assert.equal(validation.status, "valid");
    assert.equal(validation.commitRevision, 3);
    assert.match(
      validation.journalHeadDigest,
      /^sha256:[0-9a-f]{64}$/u,
    );

    const tree = parseJson(
      await runSurveyctlProcess(
        runArguments(harness, "tree"),
      ),
    );
    const generationReferences =
      tree.resourceVersions
        .map((entry) => entry.reference)
        .filter(
          (reference) =>
            reference.kind === "GenerationRecord",
        );
    assert.equal(generationReferences.length, 1);
    const generation = parseJson(
      await runSurveyctlProcess(
        runArguments(harness, "show", {
          target:
            `digest:${generationReferences[0].semanticDigest}`,
        }),
      ),
    );
    assert.equal(generation.kind, "GenerationRecord");
    assert.equal(
      generation.evidence.producer.provider,
      "unattested-external-input",
    );
    assert.equal(
      generation.evidence.producer.model,
      "unreported",
    );
    assert.equal(
      generation.spec.result.createdResourceRefs.length,
      2,
    );

    const coldStatus = parseJson(
      await runSurveyctlProcess(
        runArguments(harness, "status"),
      ),
    );
    assert.equal(coldStatus.commitRevision, 3);
    assert.equal(
      coldStatus.authoringState,
      "round_1_frame_required",
    );
    assert.equal(coldStatus.pending, null);
    assert.equal(coldStatus.nextDisposition, "issue-or-wait");
  },
);
