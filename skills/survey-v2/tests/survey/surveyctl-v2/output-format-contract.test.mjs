import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import {
  createSurveyctlHarness,
  initializeHarness,
  readSessionBytes,
  runSurveyctlProcess,
} from "./support.mjs";

function nextArguments(harness, format) {
  return [
    "next",
    `--run=${harness.runDirectory}`,
    `--key-root=${harness.keyRoot}`,
    ...(format === undefined
      ? []
      : [`--format=${format}`]),
  ];
}

test(
  "surveyctl defaults deterministically to exact text and requires literal format json opt-in",
  async (testContext) => {
    const harness = await initializeHarness(
      await createSurveyctlHarness(testContext, {
        slug: "output-format-contract",
      }),
    );
    harness.sessionFile = path.join(
      harness.runDirectory,
      "session.json",
    );
    const originalAmbientFormat =
      process.env.SURVEYCTL_FORMAT;
    process.env.SURVEYCTL_FORMAT = "json";
    testContext.after(() => {
      if (originalAmbientFormat === undefined) {
        delete process.env.SURVEYCTL_FORMAT;
      } else {
        process.env.SURVEYCTL_FORMAT =
          originalAmbientFormat;
      }
    });

    const defaultText = await runSurveyctlProcess(
      nextArguments(harness),
    );
    assert.equal(
      defaultText.code,
      0,
      defaultText.stderr.toString("utf8"),
    );
    const afterDefault = await readSessionBytes(harness);

    const explicitText = await runSurveyctlProcess(
      nextArguments(harness, "text"),
    );
    assert.equal(
      explicitText.code,
      0,
      explicitText.stderr.toString("utf8"),
    );
    assert.deepEqual(explicitText.stdout, defaultText.stdout);

    const explicitJson = await runSurveyctlProcess(
      nextArguments(harness, "json"),
    );
    assert.equal(
      explicitJson.code,
      0,
      explicitJson.stderr.toString("utf8"),
    );
    const jsonView = JSON.parse(
      explicitJson.stdout.toString("utf8"),
    );
    assert.equal(jsonView.kind, "SurveyctlAssignmentView");
    assert.deepEqual(
      Buffer.from(jsonView.content.data, "base64"),
      defaultText.stdout,
    );
    assert.deepEqual(
      await readSessionBytes(harness),
      afterDefault,
    );

    const alias = await runSurveyctlProcess([
      ...nextArguments(harness),
      "--json=true",
    ]);
    assert.notEqual(alias.code, 0);
    assert.match(
      alias.stderr.toString("utf8"),
      /SURVEYCTL_OPTION_UNKNOWN/u,
    );
  },
);
