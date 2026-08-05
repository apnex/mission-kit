import test from "node:test";

import {
  assertErrorCode,
  canonicalizeAuthoringTextInput
} from "./support.mjs";

test("authoring text rejects a UTF-8 BOM", () => {
  const bomPrefixed = Buffer.concat([
    Buffer.from([0xef, 0xbb, 0xbf]),
    Buffer.from("text", "utf8")
  ]);

  assertErrorCode(
    () => canonicalizeAuthoringTextInput(bomPrefixed),
    "TEXT_BOM_FORBIDDEN"
  );
});
