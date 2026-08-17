import assert from "node:assert/strict";
import test from "node:test";
import { access, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { withPackageCopy } from "../composition/package-fixture.mjs";

test("the evaluator runtime loads from a standalone copy without consulting its repository parent or sibling Survey roots", async () => {
  await withPackageCopy(async (root) => {
    const decoy = join(root, "..", "survey-v2");
    await writeFile(
      join(root, "..", "survey-v2-decoy"),
      "A sibling must never become runtime authority.\n",
      "utf8",
    );
    await assert.rejects(access(join(root, ".git")));
    await assert.rejects(access(decoy));

    const moduleUrl = pathToFileURL(
      join(root, "source", "executables", "engine", "schema-validator.mjs"),
    );
    const { SchemaValidator } = await import(
      `${moduleUrl.href}?standalone=${Date.now()}`
    );
    const validator = await SchemaValidator.fromPackageRoot(root);
    assert.equal(validator.catalog.schemas.length, 141);
    assert.equal(
      validator.schema("campaign").$id,
      "urn:mission-kit:survey-skill-evaluator:campaign",
    );

    await rm(join(root, "schemas", "campaign.schema.json"));
    await assert.rejects(
      SchemaValidator.fromPackageRoot(root),
      /ENOENT|campaign\.schema\.json/u,
    );
  });
});
