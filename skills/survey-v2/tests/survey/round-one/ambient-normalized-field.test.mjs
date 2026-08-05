import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRoundOneFrameProducts,
  RoundOneFrameAuthorityError,
} from "../../../source/authoring/survey/round-one-frame-authority.mjs";
import {
  roundOneContextClosure,
  roundOneFrameValues,
} from "./support.mjs";

test("Round 1 frame authority rejects an ambient normalized field without mutating its inputs", () => {
  const normalizedValues = {
    ...roundOneFrameValues(),
    recommendation: "Prefer option A",
  };
  const contextClosure = roundOneContextClosure();
  const beforeValues = structuredClone(normalizedValues);
  const beforeClosure = structuredClone(contextClosure);

  assert.throws(
    () => buildRoundOneFrameProducts({
      normalizedValues,
      contextClosure,
    }),
    (error) =>
      error instanceof RoundOneFrameAuthorityError &&
      error.code === "ROUND_ONE_FRAME_VALUES_INVALID" &&
      error.field === "/normalizedValues",
  );
  assert.deepEqual(normalizedValues, beforeValues);
  assert.deepEqual(contextClosure, beforeClosure);
});
