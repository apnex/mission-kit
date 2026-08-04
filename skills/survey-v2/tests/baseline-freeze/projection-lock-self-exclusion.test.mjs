import assert from "node:assert/strict";
import {
  cp,
  mkdtemp,
  readFile,
  rm,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  prettyJson,
  sha256Value
} from "../../source/executables/runtime/lib/canonical.mjs";
import {
  FrozenPackageRequiredError,
  verifyFrozenPackageRoot
} from "./package-compatibility.mjs";
import { surveyRoot } from "../fixtures/root.mjs";

test("the self-excluded projection lock accepts neither byte nor metadata drift", async () => {
  const temporary = await mkdtemp(
    path.join(os.tmpdir(), "survey-v2-projection-lock-boundary-")
  );
  const changedRoot = path.join(temporary, "subject");
  try {
    const manifest = JSON.parse(
      await readFile(path.join(surveyRoot, "survey-v2.package.json"), "utf8")
    );
    const lockPath = path.join(
      surveyRoot,
      "generated",
      "projection-lock.json"
    );
    const lockBytes = await readFile(lockPath);
    const lock = JSON.parse(lockBytes);
    const protocol = JSON.parse(
      await readFile(
        path.join(surveyRoot, "source", "protocol", "survey.protocol.json"),
        "utf8"
      )
    );
    const requiredPackage = {
      id: manifest.id,
      version: manifest.version,
      projectionDigest: lock.aggregateDigest,
      protocolDigest: sha256Value(protocol)
    };
    const verified = await verifyFrozenPackageRoot({
      subjectRoot: surveyRoot,
      requiredPackage
    });
    assert.equal(verified.registeredMemberCount, manifest.members.length);

    await cp(surveyRoot, changedRoot, {
      recursive: true,
      dereference: false,
      filter(source) {
        const relative = path.relative(surveyRoot, source);
        if (relative === "") return true;
        const first = relative.split(path.sep)[0];
        return ![".git", "node_modules", "surveys"].includes(first);
      }
    });
    const changedLockPath = path.join(
      changedRoot,
      "generated",
      "projection-lock.json"
    );
    await writeFile(changedLockPath, Buffer.concat([lockBytes, Buffer.from(" ")]));
    await assert.rejects(
      verifyFrozenPackageRoot({
        subjectRoot: changedRoot,
        requiredPackage
      }),
      (error) =>
        error instanceof FrozenPackageRequiredError &&
        error.code === "FROZEN_PACKAGE_REQUIRED"
    );

    const changedMetadata = {
      ...lock,
      id: "urn:mission-kit:survey-v2:projection-lock:tampered",
      unexpected: true
    };
    await writeFile(changedLockPath, prettyJson(changedMetadata));
    await assert.rejects(
      verifyFrozenPackageRoot({
        subjectRoot: changedRoot,
        requiredPackage
      }),
      (error) =>
        error instanceof FrozenPackageRequiredError &&
        error.code === "FROZEN_PACKAGE_REQUIRED"
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
