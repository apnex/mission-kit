import assert from "node:assert/strict";
import test from "node:test";
import {
  createTextSubmission,
} from "../../../source/authoring/kernel/assignment-dag.mjs";
import {
  validateContract,
} from "../contracts/support/contract-validation.mjs";
import {
  evidenceDigest,
  issueK10TextAssignment,
  populatedTextBytes,
  producerProvenance,
} from "./support.mjs";

test(
  "generation provider and model bounds count Unicode scalars consistently with their schema",
  async () => {
    const scenario = await issueK10TextAssignment();
    const provenance = producerProvenance();
    provenance.generation = {
      attemptId: "unicode-scalar-bound",
      provider: "😀".repeat(512),
      model: "🧠".repeat(512),
      adapter: {
        id: "text-adapter",
        digest: evidenceDigest,
      },
      configurationDigest: evidenceDigest,
    };
    const { submission } = createTextSubmission({
      name: "unicode-generation-submission",
      request: scenario.request,
      contextClosure: scenario.contextClosure,
      assignment: scenario.assignment,
      projectionArtifact: scenario.projectionArtifact,
      projectionBinding: scenario.projectionBinding,
      formDefinition: scenario.formDefinition,
      submittedBytes: populatedTextBytes(scenario),
      producerProvenance: provenance,
      renderProjection: scenario.renderProjection,
    });

    assert.equal(
      [...submission.evidence.producerProvenance.generation.provider]
        .length,
      512,
    );
    assert.equal(
      [...submission.evidence.producerProvenance.generation.model]
        .length,
      512,
    );
    assert.deepEqual(
      await validateContract(
        "authoring-submission",
        submission,
      ),
      {
        valid: true,
        structuralErrors: [],
        semanticIssues: [],
      },
    );
  },
);
