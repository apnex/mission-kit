import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { PACKAGE_ROOT } from "../composition/package-fixture.mjs";

test("each role capsule exactly projects its registered content and capability boundary", async () => {
  const registry = JSON.parse(
    await readFile(
      join(PACKAGE_ROOT, "source/fragments/roles/role-registry.json"),
      "utf8",
    ),
  );
  for (const role of registry.roles) {
    const capsule = JSON.parse(
      await readFile(
        join(PACKAGE_ROOT, "references/role-capsules", `${role.roleId}.json`),
        "utf8",
      ),
    );
    assert.deepEqual(capsule.authorizedContents, role.authorizedContents);
    assert.deepEqual(capsule.forbiddenContents, role.forbiddenContents);
    assert.deepEqual(capsule.allowedCapabilities, role.allowedCapabilities);
    assert.deepEqual(capsule.forbiddenCapabilities, role.forbiddenCapabilities);
    assert.deepEqual(
      capsule.authorizedContents.filter((item) =>
        capsule.forbiddenContents.includes(item),
      ),
      [],
    );
  }
});
