import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  LifecycleEngine,
  LifecycleRegistry,
  RuntimeProductStateValidator,
  SchemaValidator,
  StateStore,
  hashCanonical,
} from "../../source/executables/engine/index.mjs";
import { createExternalAuthorityFixture } from "./external-authority-fixture.mjs";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

export const SIMPLE_MANIFEST = {
  schemaVersion: "1",
  machines: [
    {
      machineId: "sample",
      terminalStates: ["DONE"],
      transitions: [
        {
          transitionId: "S01",
          machineId: "sample",
          eventType: "OPEN",
          fromState: "absent",
          toState: "OPEN",
          creationClass: "absent",
          guardId: "always",
          actionPipelineId: "emit",
          mutationId: "merge",
          participantPolicyId: "sample-owner",
          idempotencyClass: "exact",
          failureRoute: "reject",
          learningTriggerPolicyId: "none",
        },
        {
          transitionId: "S02",
          machineId: "sample",
          eventType: "CLOSE",
          fromState: "OPEN",
          toState: "DONE",
          creationClass: "existing",
          guardId: "always",
          actionPipelineId: "none",
          mutationId: "merge",
          participantPolicyId: "sample-owner",
          idempotencyClass: "exact",
          failureRoute: "reject",
          learningTriggerPolicyId: "none",
        },
      ],
    },
  ],
  participantPolicies: [
    {
      participantPolicyId: "sample-owner",
      commandAuthorization: { single: "owner" },
    },
  ],
  actionPipelines: [
    {
      actionPipelineId: "emit",
      actions: [{ actionId: "emit", executorAuthorityId: "engine" }],
    },
    { actionPipelineId: "none", actions: [] },
  ],
};

export async function makeRuntimeFixture(manifest = SIMPLE_MANIFEST) {
  const rootPath = await mkdtemp(join(tmpdir(), "survey-evaluator-runtime-"));
  const registry = new LifecycleRegistry(manifest);
  const schemaValidator = await SchemaValidator.fromPackageRoot(packageRoot);
  const authority = createExternalAuthorityFixture({
    authorityIds: ["owner"],
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
    actions: {
      emit: ({ command }) => ({
        core: { emitted: command.input.value },
        messages: [{ kind: "sample_work", value: command.input.value }],
      }),
    },
  });
  const command = ({
    transitionId = "S01",
    expectedRevision = "absent",
    idempotencyKey = "sample/open/1",
    value = 1,
    objectId = "sample-1",
  } = {}) => {
    const input = { value };
    const raw = {
      machineId: "sample",
      objectId,
      transitionId,
      expectedRevision,
      idempotencyKey,
      input,
      mutation: input,
      inputDigest: hashCanonical("test-input/v1", input),
    };
    const policy = registry.participantPolicy("sample-owner");
    return authority.authorizeSync({
      policy,
      command: raw,
      machineId: "sample",
      participantPolicyDigest:
        registry.participantPolicyDigest("sample-owner"),
    });
  };
  return {
    rootPath,
    registry,
    stateStore,
    engine,
    authority,
    schemaValidator,
    command,
    cleanup: () => rm(rootPath, { recursive: true, force: true }),
  };
}
