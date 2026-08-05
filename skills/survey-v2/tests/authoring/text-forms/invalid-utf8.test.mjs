import test from "node:test";

import {
  assertErrorCode,
  canonicalizeAuthoringTextInput
} from "./support.mjs";

test("authoring text rejects invalid UTF-8 bytes", () => {
  const invalidUtf8 = Buffer.from([0x66, 0x6f, 0x80, 0x6f]);

  assertErrorCode(
    () => canonicalizeAuthoringTextInput(invalidUtf8),
    "TEXT_UTF8_INVALID"
  );
});
