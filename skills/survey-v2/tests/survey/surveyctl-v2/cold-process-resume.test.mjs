import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import {
  createSurveyctlHarness,
  readSessionBytes,
  runSurveyctlProcess,
} from "./support.mjs";

test(
  "independent surveyctl processes resume one run and reissue the exact pending view",
  async (testContext) => {
    const harness = await createSurveyctlHarness(testContext, {
      slug: "cold-process-resume",
    });
    const init = await runSurveyctlProcess([
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
    ]);
    assert.equal(init.code, 0, init.stderr.toString("utf8"));
    const initView = JSON.parse(init.stdout.toString("utf8"));
    assert.equal(
      path.isAbsolute(initView.runDirectory),
      true,
    );
    harness.runDirectory = initView.runDirectory;
    harness.sessionFile = path.join(
      initView.runDirectory,
      "session.json",
    );

    const nextArguments = [
      "next",
      `--run=${harness.runDirectory}`,
      `--key-root=${harness.keyRoot}`,
      "--format=text",
    ];
    const first = await runSurveyctlProcess(nextArguments);
    assert.equal(first.code, 0, first.stderr.toString("utf8"));
    const afterFirst = await readSessionBytes(harness);
    const second = await runSurveyctlProcess(nextArguments);

    assert.equal(second.code, 0, second.stderr.toString("utf8"));
    assert.deepEqual(second.stdout, first.stdout);
    assert.deepEqual(
      await readSessionBytes(harness),
      afterFirst,
    );
  },
);
