import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  HASH_PROFILE_ID,
  SchemaValidator,
} from "../../source/executables/engine/index.mjs";
import { LearningProtocol } from "../../source/executables/orchestrator/index.mjs";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const learningDigest = "a".repeat(64);

export async function makeLearningProtocol() {
  return new LearningProtocol({
    schemaValidator: await SchemaValidator.fromPackageRoot(packageRoot),
    registeredObserverAuthorityIds: ["registered-observer"],
  });
}

export function baseSource(sourceType) {
  return {
    sourceRequestId: `source-${sourceType}`,
    sourceType,
    sourceObjectId: "source-object",
    sourceEventDigest: learningDigest,
    sourceSemanticRoot: learningDigest,
    upstreamOutboxId: "outbox-1",
    upstreamOutboxDigest: learningDigest,
    correlationId: "correlation-1",
    producerAuthorityId: "producer-1",
  };
}

export function sourceDisposition(kind, targetOperation = "LC01") {
  return {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    sourceDispositionId: `disposition-${kind}-${targetOperation}`,
    kind,
    learningCapitalRequestId: "lcr-1",
    sourceRequestDigest: learningDigest,
    targetOperation,
    grantOrDeniedProjectionRef: learningDigest,
    ordinaryResultRef: learningDigest,
    ...(kind === "lc02_success"
      ? { paybackObservationRef: learningDigest }
      : {}),
    ...(kind === "entry_conflict"
      ? { conflictRef: learningDigest }
      : {}),
    resultingLearningCapitalRoot: learningDigest,
  };
}
