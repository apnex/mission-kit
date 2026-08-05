import assert from "node:assert/strict";
import {
  readdir,
  readFile,
  stat
} from "node:fs/promises";
import test from "node:test";
import { surveyRoot } from "../fixtures/root.mjs";

async function fragmentDescriptorPaths(directory, prefix = "source") {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    const relative = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      paths.push(...await fragmentDescriptorPaths(
        `${directory}/${entry.name}`,
        relative
      ));
    } else if (entry.isFile() && entry.name.endsWith(".fragment.json")) {
      paths.push(relative);
    }
  }
  return paths.sort();
}

test("every fragment has one descriptor, payload and purpose", async () => {
  const packageManifest = JSON.parse(await readFile(`${surveyRoot}/survey-v2.package.json`, "utf8"));
  const descriptorMembers = packageManifest.members
    .filter((member) => member.path.endsWith(".fragment.json"));
  assert.deepEqual(
    descriptorMembers.map((member) => member.path).sort(),
    await fragmentDescriptorPaths(`${surveyRoot}/source`)
  );
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
});
