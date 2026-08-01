import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { types as utilTypes } from "node:util";
import {
  assertNoSymlinkAncestors,
  assertSafeSegment,
  createContainedDirectoryOnce,
  ensureContainedDirectory,
  resolveContained,
  writeCanonicalJson,
} from "../engine/atomic-fs.mjs";
import {
  deepCloneCanonical,
  deepFreeze,
} from "../engine/canonical-json.mjs";
import { HASH_PROFILE_ID, hashCanonical } from "../engine/hash.mjs";
import {
  AuthorizationError,
  IntegrityError,
  ValidationError,
} from "../engine/errors.mjs";
import { ToolBroker } from "./tool-broker.mjs";

const FORBIDDEN_RESULT_KEYS = new Set([
  "awareness",
  "awarenessGuess",
  "armMap",
  "promotion",
  "release",
  "canonicalMutation",
]);

function scanResult(value, path = "$") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanResult(item, `${path}[${index}]`));
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN_RESULT_KEYS.has(key)) {
      throw new AuthorizationError("Role result contains a forbidden authority field", {
        path: `${path}.${key}`,
      });
    }
    scanResult(item, `${path}.${key}`);
  }
}

export class IsolatedRoleRunner {
  constructor({
    rootPath,
    toolHandlers = {},
    validateOutput = null,
    isolationProvider = null,
    allowTestInProcess = false,
    clock = () => Date.now(),
  }) {
    if (!rootPath) throw new ValidationError("IsolatedRoleRunner requires rootPath");
    this.rootPath = rootPath;
    this.toolHandlers = toolHandlers;
    this.validateOutput = validateOutput;
    this.isolationProvider = isolationProvider;
    this.allowTestInProcess = allowTestInProcess;
    this.clock = clock;
    this.usedInvocationIds = new Set();
  }

  validateHostAttestation(attestation, capsule, workspace) {
    const expectedToolPolicyDigest = hashCanonical(
      "role-tool-policy/v1",
      capsule.allowedTools,
    );
    const required = {
      freshContext: true,
      workspaceRoot: workspace,
      workspaceConfined: true,
      networkPolicy: capsule.network,
      toolPolicyDigest: expectedToolPolicyDigest,
      sharedCache: false,
      sharedMemory: false,
      sharedClipboard: false,
      sharedProviderThread: false,
      productionCredentials: false,
      ...(capsule.executionConfigurationDigest === null
        ? {}
        : {
            executionConfigurationDigest:
              capsule.executionConfigurationDigest,
          }),
    };
    const mismatches = Object.entries(required)
      .filter(([key, value]) => attestation?.[key] !== value)
      .map(([key, value]) => ({
        key,
        expected: value,
        actual: attestation?.[key],
      }));
    if (mismatches.length > 0) {
      throw new AuthorizationError("Host isolation attestation failed closed", {
        contaminationCode: "ROLE_COLLAPSE_OR_CONTEXT_REUSE",
        findingClass: "role_contamination",
        resumableInPlace: false,
        workOrderId: capsule.workOrderId,
        workspace,
        mismatches,
      });
    }
    return deepCloneCanonical(attestation);
  }

  async run(capsule, testAdapterFactory = null) {
    if (
      capsule.isolation?.freshContext !== true ||
      capsule.isolation?.sharedCache !== false ||
      capsule.isolation?.sharedProviderThread !== false
    ) {
      throw new AuthorizationError("Role capsule does not require fresh isolation");
    }
    const invocationId = randomUUID();
    if (this.usedInvocationIds.has(invocationId)) {
      throw new IntegrityError("Invocation identity collision");
    }
    this.usedInvocationIds.add(invocationId);
    const workspace = resolveContained(
      this.rootPath,
      "role-workspaces",
      assertSafeSegment(capsule.writableWorkspaceId, "workspace ID"),
      invocationId,
    );
    const workspaceAuthority = resolveContained(
      this.rootPath,
      "role-workspaces",
      assertSafeSegment(capsule.writableWorkspaceId, "workspace ID"),
    );
    await ensureContainedDirectory(this.rootPath, workspaceAuthority, {
      mode: 0o700,
    });
    await assertNoSymlinkAncestors(this.rootPath, workspace);
    await createContainedDirectoryOnce(this.rootPath, workspace, {
      mode: 0o700,
    });
    const toolEvidence = [];
    const broker = new ToolBroker({
      allowedTools: capsule.allowedTools,
      handlers: this.toolHandlers,
      evidenceSink: (entry) => toolEvidence.push(deepCloneCanonical(entry)),
    });
    const startedAtMs = this.clock();
    let output;
    let hostAttestation;
    let executionBoundary;
    if (this.isolationProvider) {
      if (testAdapterFactory !== null) {
        throw new ValidationError(
          "A production isolation provider cannot be combined with an in-process adapter",
        );
      }
      const providerInvocation = this.isolationProvider.invoke({
        capsule: deepCloneCanonical(capsule),
        invocationId,
        workspace,
        tools: { call: broker.call.bind(broker) },
      });
      if (utilTypes.isProxy(providerInvocation)) {
        throw new ValidationError(
          "Isolation provider returned an executable proxy view",
        );
      }
      const response = deepCloneCanonical(await providerInvocation);
      output = response?.output;
      hostAttestation = this.validateHostAttestation(
        response?.attestation,
        capsule,
        workspace,
      );
      executionBoundary = "attested_host_isolation";
    } else {
      if (!this.allowTestInProcess || typeof testAdapterFactory !== "function") {
        throw new AuthorizationError(
          "Production role execution requires an attested host isolation provider; in-process adapters are test-only",
        );
      }
      const adapter = await testAdapterFactory({
        invocationId,
        workspace,
        network: capsule.network,
        testOnly: true,
      });
      if (typeof adapter !== "function") {
        throw new ValidationError("Test adapter factory must return one invocation function");
      }
      const adapterInvocation = adapter({
        input: deepFreeze(deepCloneCanonical(capsule.inputProjection)),
        tools: deepFreeze({ call: broker.call.bind(broker) }),
        workspace,
        invocationId,
      });
      if (utilTypes.isProxy(adapterInvocation)) {
        throw new ValidationError(
          "Test role adapter returned an executable proxy view",
        );
      }
      output = await adapterInvocation;
      hostAttestation = {
        testOnlyInProcess: true,
        productionEligible: false,
        freshContext: true,
        workspaceRoot: workspace,
        ...(capsule.executionConfigurationDigest === null
          ? {}
          : {
              executionConfigurationDigest:
                capsule.executionConfigurationDigest,
            }),
      };
      executionBoundary = "test_only_in_process";
    }
    const inertOutput = deepCloneCanonical(output);
    scanResult(inertOutput);
    if (
      capsule.roleClass === "synthetic-director" &&
      inertOutput?.syntheticRatification === true &&
      inertOutput.namespace !== capsule.workOrderId
    ) {
      throw new AuthorizationError(
        "Synthetic ratification escaped its disposable work-order namespace",
        {
          expectedNamespace: capsule.workOrderId,
          actualNamespace: inertOutput.namespace ?? null,
        },
      );
    }
    await this.validateOutput?.(capsule.outputSchemaId, inertOutput);
    const outputCore = {
      hashProfileId: HASH_PROFILE_ID,
      invocationId,
      roleClass: capsule.roleClass,
      workOrderId: capsule.workOrderId,
      capsuleDigest: capsule.capsuleDigest,
      content: inertOutput,
      contentDigest: hashCanonical("role-result-content/v1", inertOutput),
      startedAtMs,
      finishedAtMs: this.clock(),
      workspace,
      executionBoundary,
      hostIsolationAttestation: hostAttestation,
      visibility: {
        inputProjectionDigest: capsule.inputProjectionDigest,
        allowedTools: [...capsule.allowedTools],
        network: capsule.network,
        freshContext: true,
        sharedProviderThread: false,
        sharedCache: false,
        productionEligible: executionBoundary === "attested_host_isolation",
      },
      toolEvidence,
    };
    const result = {
      ...outputCore,
      resultDigest: hashCanonical("role-result/v1", outputCore),
    };
    await writeCanonicalJson(join(workspace, "role-result.json"), result, {
      createOnce: true,
      mode: 0o600,
      authorityRoot: this.rootPath,
    });
    return result;
  }
}

export { FORBIDDEN_RESULT_KEYS };
