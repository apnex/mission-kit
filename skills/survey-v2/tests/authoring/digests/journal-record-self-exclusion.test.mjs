import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  journalRecordDigest
} from "../../../source/authoring/kernel/digests.mjs";

const fixturePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../fixtures/authoring/contracts/positive/authoring-journal-record.json"
);

test("journal-record identity excludes only recordDigest", async () => {
  const record = JSON.parse(await readFile(fixturePath, "utf8"));
  const changedSelf = structuredClone(record);
  changedSelf.recordDigest =
    "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
  const changedPayload = structuredClone(record);
  changedPayload.payloadDigest =
    "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

  assert.equal(journalRecordDigest(record), record.recordDigest);
  assert.equal(journalRecordDigest(changedSelf), record.recordDigest);
  assert.notEqual(journalRecordDigest(changedPayload), record.recordDigest);
});
