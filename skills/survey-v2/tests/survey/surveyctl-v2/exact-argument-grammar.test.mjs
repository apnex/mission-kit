import assert from "node:assert/strict";
import test from "node:test";
import {
  parseSurveyctlArguments,
} from "../../../source/executables/runtime/lib/surveyctl-arguments.mjs";

function rejectsWith(argv, code) {
  assert.throws(
    () => parseSurveyctlArguments(argv),
    (error) => {
      assert.equal(error?.code, code);
      return true;
    },
  );
}

test(
  "surveyctl admits only its exact command, positional, and --key=value grammar",
  () => {
    const parsed = parseSurveyctlArguments([
      "init",
      "argument-test",
      "--sessions-root=/tmp/surveyctl-sessions",
      "--source-root=/tmp/surveyctl-source",
      "--source=intent.txt",
      "--source=nested/context.txt",
      "--director-ref=director.synthetic",
      "--proposer-ref=proposer.synthetic",
      "--axiom-corpus=false",
      "--format=json",
    ]);
    assert.deepEqual(parsed.sources, [
      "intent.txt",
      "nested/context.txt",
    ]);
    assert.equal(parsed.slug, "argument-test");
    assert.equal(parsed.format, "json");
    assert.equal(Object.isFrozen(parsed), true);
    assert.equal(Object.isFrozen(parsed.sources), true);

    rejectsWith(
      ["status", "--run", "/tmp/run"],
      "SURVEYCTL_OPTION_SYNTAX_INVALID",
    );
    rejectsWith(
      ["status", "--run=/tmp/run", "--run=/tmp/other"],
      "SURVEYCTL_OPTION_DUPLICATE",
    );
    rejectsWith(
      ["status", "--run=/tmp/run", "--source=x.txt"],
      "SURVEYCTL_OPTION_UNKNOWN",
    );
    rejectsWith(
      ["show", "../session", "--run=/tmp/run"],
      "SURVEYCTL_POSITIONAL_INVALID",
    );
    rejectsWith(
      [
        "init",
        "argument-test",
        "--sessions-root=/tmp/surveyctl-sessions",
        "--source-root=/tmp/surveyctl-source",
        "--source=../intent.txt",
        "--director-ref=director.synthetic",
        "--proposer-ref=proposer.synthetic",
      ],
      "SURVEYCTL_OPTION_VALUE_INVALID",
    );
  },
);
