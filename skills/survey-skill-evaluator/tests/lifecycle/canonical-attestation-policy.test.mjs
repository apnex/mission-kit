import assert from "node:assert/strict";
import test from "node:test";
import {
  LifecycleEngine,
  LifecycleRegistry,
  RuntimeProductStateValidator,
  SchemaValidator,
  StateStore,
  hashCanonical,
} from "../../source/executables/engine/index.mjs";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createExternalAuthorityFixture } from "../helpers/external-authority-fixture.mjs";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

const manifest = {
  machines: [
    {
      machineId: "attested",
      transitions: [
        {
          transitionId: "A01",
          machineId: "attested",
          eventType: "CREATE",
          fromState: "absent",
          toState: "OPEN",
          creationClass: "absent",
          guardId: "always",
          actionPipelineId: "none",
          mutationId: "merge",
          participantPolicyId: "attested-policy",
          idempotencyClass: "create_once",
          failureRoute: "quarantine.attested",
          learningTriggerPolicyId: "none",
        },
      ],
    },
  ],
  participantPolicies: [
    {
      participantPolicyId: "attested-policy",
      commandAuthority: { kind: "single", authorityId: "owner" },
      requiredAttestationAuthorityIds: ["auditor"],
    },
  ],
  actionPipelines: [{ actionPipelineId: "none", actions: [] }],
};

test("canonical required authorities bind to externally issued exact-command receipts", async () => {
  const rootPath = await mkdtemp(join(tmpdir(), "survey-policy-"));
  try {
    const registry = new LifecycleRegistry(manifest);
    const schemaValidator = await SchemaValidator.fromPackageRoot(packageRoot);
    const authority = createExternalAuthorityFixture({
      authorityIds: ["owner", "auditor"],
      schemaValidator,
    });
    const stateStore = new StateStore({
      rootPath,
      schemaVersion: "1.0.0",
      productStateValidator: new RuntimeProductStateValidator({
        schemaValidator,
        registry,
      }),
    });
    await stateStore.initialize();
    const engine = new LifecycleEngine({
      registry,
      stateStore,
      authorityReceiptVerifier: authority.verifier,
    });
    const input = { value: 1 };
    const command = {
      transitionId: "A01",
      objectId: "object-1",
      expectedRevision: "absent",
      idempotencyKey: "object-1/create",
      input,
      inputDigest: hashCanonical("test-input/v1", input),
      commandActorContexts: [{ authorityId: "owner" }],
      authorizationEvidenceRefs: ["evidence://auditor"],
    };

    await assert.rejects(
      engine.execute(command),
      /Caller-authored authority assertions are forbidden/u,
    );
    const unsigned = {
      ...command,
      commandActorContexts: [],
      authorizationEvidenceRefs: [],
    };
    const policy = registry.participantPolicy("attested-policy");
    const authorized = authority.authorizeSync({
      policy,
      command: unsigned,
      machineId: "attested",
      participantPolicyDigest:
        registry.participantPolicyDigest("attested-policy"),
    });
    const result = await engine.execute(authorized);
    assert.equal(result.state, "OPEN");
  } finally {
    await rm(rootPath, { recursive: true, force: true });
  }
});
