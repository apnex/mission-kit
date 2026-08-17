import assert from "node:assert/strict";
import {
  access,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import {
  IntegrityError,
} from "../../source/executables/engine/index.mjs";
import {
  makeFullRoleCampaignFixture,
} from "../helpers/full-role-campaign-fixture.mjs";

test("failure closure rejects a malformed persisted role record instead of omitting it from readable roots", async (t) => {
  let workspaceRoot;
  let corrupted = false;
  const fixture = await makeFullRoleCampaignFixture({
    async onInvocation(entry) {
      if (
        corrupted ||
        entry.roleClass !== "downstream-consumer"
      ) {
        return;
      }
      corrupted = true;
      const rolesDirectory = join(
        workspaceRoot,
        "evidence",
        "roles",
      );
      const target = (await readdir(rolesDirectory))
        .filter((name) => name.endsWith(".json"))
        .sort()[0];
      const path = join(rolesDirectory, target);
      const record = JSON.parse(await readFile(path, "utf8"));
      record.observableCaptureDigest = "0".repeat(64);
      await writeFile(path, JSON.stringify(record), "utf8");
      throw new Error("first downstream consumer failed");
    },
  });
  workspaceRoot = fixture.workspaceRoot;
  t.after(fixture.cleanup);

  await assert.rejects(
    fixture.orchestrator.advance(),
    (error) =>
      error instanceof IntegrityError &&
      /Role evidence is not self-verifying/u.test(error.message),
  );
  assert.equal(corrupted, true);
  await assert.rejects(
    access(
      join(
        fixture.workspaceRoot,
        "results",
        "campaign-failure-envelope.json",
      ),
    ),
  );
});
