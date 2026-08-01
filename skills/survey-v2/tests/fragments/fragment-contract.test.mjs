import assert from "node:assert/strict";
import {
  readFile,
  stat
} from "node:fs/promises";
import test from "node:test";
import { surveyRoot } from "../fixtures/root.mjs";

test("every fragment has one descriptor, payload and purpose", async () => {
  const packageManifest = JSON.parse(await readFile(`${surveyRoot}/survey-v2.package.json`, "utf8"));
  const descriptorMembers = packageManifest.members
    .filter((member) => member.path.endsWith(".fragment.json"));
  const ids = new Set();
  const payloads = new Set();
  for (const member of descriptorMembers) {
    const descriptor = JSON.parse(await readFile(`${surveyRoot}/${member.path}`, "utf8"));
    assert.equal(ids.has(descriptor.id), false);
    ids.add(descriptor.id);
    assert.match(descriptor.purpose, /^[A-Z].*[.!?]$/);
    assert.equal(payloads.has(descriptor.representation.payloadPath), false);
    payloads.add(descriptor.representation.payloadPath);
    assert.ok(packageManifest.members.some((item) => item.path === descriptor.representation.payloadPath));
    assert.equal((await stat(`${surveyRoot}/${descriptor.representation.payloadPath}`)).isFile(), true);
  }
  assert.equal(descriptorMembers.length, 27);
});
