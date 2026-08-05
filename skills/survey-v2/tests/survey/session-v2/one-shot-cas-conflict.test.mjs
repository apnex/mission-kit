import assert from "node:assert/strict";
import test from "node:test";
import {
  snapshotExpectedToken,
} from "../../../source/authoring/runtime/store-port.mjs";
import {
  createSurveySessionStore,
} from "../../../source/authoring/survey/session-store-adapter.mjs";
import {
  authenticationKey,
  candidateSelector,
  createPersistentCandidate,
  readSessionBytes,
} from "./support.mjs";

const mismatchedRootSeal =
  `sha256:${"f".repeat(64)}`;

test(
  "one Survey writer permits one compare-and-commit attempt and a stale token leaves the root unchanged",
  async (testContext) => {
    const harness = await createPersistentCandidate(
      testContext,
    );
    const store = createSurveySessionStore({
      runDirectory: harness.runDirectory,
      selector: candidateSelector,
      authenticationKey,
    });
    const beforeBytes = await readSessionBytes(harness);
    let expiredWriter;

    const result = await store.withWriter(
      harness.session.sessionId,
      async (writer) => {
        expiredWriter = writer;
        const snapshot = await writer.read();
        const expected = {
          ...snapshotExpectedToken(
            snapshot,
            harness.identity,
          ),
          rootSealDigest: mismatchedRootSeal,
        };
        const request = {
          expected,
          next: {},
        };
        const first = await writer.compareAndCommit(request);
        await assert.rejects(
          writer.compareAndCommit(request),
          (error) => {
            assert.equal(
              error?.code,
              "SURVEY_SESSION_WRITER_ALREADY_USED",
            );
            return true;
          },
        );
        return first;
      },
    );

    assert.deepEqual(result, { status: "conflict" });
    assert.deepEqual(
      await readSessionBytes(harness),
      beforeBytes,
    );
    await assert.rejects(
      expiredWriter.read(),
      (error) => {
        assert.equal(
          error?.code,
          "SURVEY_SESSION_WRITER_EXPIRED",
        );
        return true;
      },
    );
  },
);
