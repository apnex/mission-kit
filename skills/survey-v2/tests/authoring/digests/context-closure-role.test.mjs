import assert from "node:assert/strict";
import test from "node:test";
import { authoringDigest } from "../../../source/authoring/kernel/digests.mjs";
import { digestA } from "./resource-fixture.mjs";

test("ContextClosure layer roles are identity-bearing", () => {
  const layer = {
    order: 1,
    role: "root",
    reference: { name: "root", semanticDigest: digestA }
  };
  assert.notEqual(
    authoringDigest("context-closure", { layers: [layer] }),
    authoringDigest("context-closure", {
      layers: [{ ...layer, role: "supporting" }]
    })
  );
});
