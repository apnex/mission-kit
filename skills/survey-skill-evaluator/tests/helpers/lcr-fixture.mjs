import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SchemaValidator } from "../../source/executables/engine/index.mjs";
import { LearningProtocol } from "../../source/executables/orchestrator/index.mjs";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const lcrDigest = "a".repeat(64);

export async function makeLcrFixture() {
  const learning = new LearningProtocol({
    schemaValidator: await SchemaValidator.fromPackageRoot(packageRoot),
  });
  const request = learning.buildSourceRequest({
    sourceRequestId: "source-1",
    sourceType: "completion_reflection",
    sourceObjectId: "work-1",
    sourceEventDigest: lcrDigest,
    sourceSemanticRoot: lcrDigest,
    upstreamOutboxId: "outbox-1",
    upstreamOutboxDigest: lcrDigest,
    correlationId: "correlation-1",
    producerAuthorityId: "producer-1",
    conceptPatternKey: "concept-1",
    completionReflectionRoot: lcrDigest,
  }).request;
  return { learning, request };
}
