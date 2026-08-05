import assert from "node:assert/strict";
import test from "node:test";
import {
  assertPackageIdentity,
  PackageIdentityError
} from "../../source/executables/compiler/package-identity.mjs";

const baseline = Object.freeze({
  packageManifest: Object.freeze({
    id: "urn:mission-kit:survey-v2:package:survey-v2",
    version: "2.0.0"
  }),
  npmPackage: Object.freeze({
    name: "@mission-kit/survey-v2",
    version: "2.0.0"
  }),
  npmLock: Object.freeze({
    name: "@mission-kit/survey-v2",
    version: "2.0.0",
    packages: Object.freeze({
      "": Object.freeze({
        name: "@mission-kit/survey-v2",
        version: "2.0.0"
      })
    })
  })
});

test("package, npm, and supply-lock versions must agree before compilation", () => {
  assert.deepEqual(assertPackageIdentity(baseline), {
    npmName: "@mission-kit/survey-v2",
    packageId: "urn:mission-kit:survey-v2:package:survey-v2",
    version: "2.0.0"
  });

  for (const mutant of [
    {
      ...baseline,
      packageManifest: { ...baseline.packageManifest, version: "2.0.1" }
    },
    {
      ...baseline,
      npmPackage: { ...baseline.npmPackage, version: "2.0.1" }
    },
    {
      ...baseline,
      npmLock: { ...baseline.npmLock, version: "2.0.1" }
    },
    {
      ...baseline,
      npmLock: {
        ...baseline.npmLock,
        packages: {
          "": { ...baseline.npmLock.packages[""], version: "2.0.1" }
        }
      }
    },
    {
      ...baseline,
      npmLock: { ...baseline.npmLock, name: "@mission-kit/other" }
    }
  ]) {
    assert.throws(
      () => assertPackageIdentity(mutant),
      (error) =>
        error instanceof PackageIdentityError &&
        error.code === "PACKAGE_IDENTITY_MISMATCH"
    );
  }
});
