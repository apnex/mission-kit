import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import {
  IntegrityError,
  LifecycleRegistry,
} from "../../source/executables/engine/index.mjs";
import { packageRoot } from "../helpers/package-root.mjs";

test("an injected policy cannot change canonical transition authority", async () => {
  await assert.rejects(
    LifecycleRegistry.fromFile(
      join(packageRoot, "source/manifests/lifecycles.json"),
      {
        participantPolicies: [
          {
            schemaVersion: "1.0.0",
            hashProfileId: "survey-evaluator-sha256-jcs-v1",
            participantPolicyId: "participants.AW00",
            commandAuthority: {
              kind: "single",
              authorityId: "attacker",
            },
            guardOwnerId: "attacker",
            orderedActionExecutors: [],
            requiredAttestationAuthorityIds: [],
          },
        ],
      },
    ),
    IntegrityError,
  );
});
