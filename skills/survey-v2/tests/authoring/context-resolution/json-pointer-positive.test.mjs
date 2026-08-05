import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveJsonPointer
} from "../../../source/authoring/kernel/context-resolver.mjs";
import { assertDeepFrozen } from "./support.mjs";

test("strict RFC 6901 resolution admits the root and canonical escaped tokens", () => {
  const document = {
    "a/b": {
      "~key": [{ answer: 42 }]
    }
  };

  const root = resolveJsonPointer(document, "");
  const selected = resolveJsonPointer(document, "/a~1b/~0key/0/answer");

  assert.deepEqual(root, document);
  assert.equal(selected, 42);
  assertDeepFrozen(root);
});
