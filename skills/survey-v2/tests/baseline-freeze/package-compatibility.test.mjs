import assert from "node:assert/strict";
import test from "node:test";
import {
  admitFrozenPackage,
  FrozenPackageRequiredError
} from "./package-compatibility.mjs";
import { sha256Value } from "../../source/executables/runtime/lib/canonical.mjs";

test("frozen session admission compares package and protocol identity without mutation", () => {
  const protocolSnapshot = { id: "urn:mission-kit:survey-v2:protocol:survey", schemaVersion: "1.0.0" };
  const requiredPackage = {
    id: "urn:mission-kit:survey-v2:package:survey-v2",
    version: "1.0.0",
    projectionDigest:
      "sha256:6603b777b82783176fca6129bfecde7a6e253f5be86f9becf94703d818b9757c",
    protocolDigest: sha256Value(protocolSnapshot)
  };
  const session = {
    package: {
      id: requiredPackage.id,
      version: requiredPackage.version,
      projectionDigest: requiredPackage.projectionDigest
    },
    protocol: {
      digest: requiredPackage.protocolDigest,
      snapshot: protocolSnapshot
    }
  };
  const verifiedPackage = {
    verified: true,
    id: requiredPackage.id,
    version: requiredPackage.version,
    projectionDigest: requiredPackage.projectionDigest
  };
  const before = structuredClone({ session, verifiedPackage });
  assert.deepEqual(
    admitFrozenPackage({ session, verifiedPackage, requiredPackage }),
    {
      admitted: true,
      policy: "characterization-only-pre-runtime-selection",
      package: requiredPackage
    }
  );
  assert.throws(
    () => admitFrozenPackage({
      session,
      verifiedPackage: {
        ...verifiedPackage,
        projectionDigest: "sha256:".padEnd(71, "0")
      },
      requiredPackage
    }),
    (error) =>
      error instanceof FrozenPackageRequiredError &&
      error.code === "FROZEN_PACKAGE_REQUIRED"
  );
  assert.deepEqual({ session, verifiedPackage }, before);
});
