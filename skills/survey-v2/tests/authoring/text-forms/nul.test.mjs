import test from "node:test";

import {
  assertErrorCode,
  canonicalizeAuthoringTextInput
} from "./support.mjs";

test("authoring text rejects NUL", () => {
  const nulContaining = Buffer.from("before\u0000after", "utf8");

  assertErrorCode(
    () => canonicalizeAuthoringTextInput(nulContaining),
    "TEXT_NUL_FORBIDDEN"
  );
});
