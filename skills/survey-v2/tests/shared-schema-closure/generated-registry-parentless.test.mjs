import assert from "node:assert/strict";
import {
  access,
  cp,
  mkdir,
  mkdtemp,
  rm
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { ids, surveyRoot } from "./support/fixture.mjs";

function question() {
  return {
    apiVersion: "schemas.mission-kit/v1alpha1",
    kind: "Question",
    metadata: { name: "placement", labels: {}, annotations: {} },
    spec: {
      prompt: { text: "Where should this run?" },
      response: {
        type: "Choice",
        cardinality: { minimum: 1, maximum: 1 },
        options: [
          { id: "edge", label: "Edge", meaning: "Run at the edge." },
          { id: "core", label: "Core", meaning: "Run in the core." }
        ],
        constraints: []
      }
    }
  };
}

function contextFrame() {
  return {
    apiVersion: "schemas.mission-kit/v1alpha1",
    kind: "ContextFrame",
    metadata: { name: "placement", labels: {}, annotations: {} },
    spec: {
      subject: "Service placement",
      purpose: "Choose the deployment boundary.",
      scope: {
        included: ["Deployment location"],
        excluded: []
      },
      givens: [],
      synopsis: "Select a deployment boundary for the service.",
      terms: []
    }
  };
}

test("generated shared validators run structurally and semantically without a parent or node_modules", async () => {
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "survey-v2-shared-registry-")
  );
  try {
    await mkdir(path.join(temporaryRoot, "generated"), { recursive: true });
    await cp(
      path.join(surveyRoot, "generated/validators.mjs"),
      path.join(temporaryRoot, "generated/validators.mjs")
    );
    await cp(
      path.join(surveyRoot, "generated/shared-semantic-validators.mjs"),
      path.join(temporaryRoot, "generated/shared-semantic-validators.mjs")
    );
    await cp(
      path.join(surveyRoot, "dependencies/shared-schemas"),
      path.join(temporaryRoot, "dependencies/shared-schemas"),
      { recursive: true }
    );
    await assert.rejects(access(path.join(temporaryRoot, "node_modules")));

    const structural = await import(pathToFileURL(
      path.join(temporaryRoot, "generated/validators.mjs")
    ));
    const semantic = await import(pathToFileURL(
      path.join(temporaryRoot, "generated/shared-semantic-validators.mjs")
    ));

    const validQuestion = question();
    assert.equal(structural.validateById(ids.question, validQuestion).valid, true);
    assert.equal(
      semantic.validateSharedResource(
        "schemas.mission-kit/v1alpha1",
        "Question",
        validQuestion
      ).valid,
      true
    );
    const structurallyInvalidQuestion = structuredClone(validQuestion);
    structurallyInvalidQuestion.status = {};
    const questionStructureResult = semantic.validateSharedResource(
      "schemas.mission-kit/v1alpha1",
      "Question",
      structurallyInvalidQuestion
    );
    assert.equal(questionStructureResult.valid, false);
    assert.ok(questionStructureResult.structuralErrors.length > 0);
    assert.deepEqual(questionStructureResult.semanticIssues, []);
    const semanticallyInvalidQuestion = structuredClone(validQuestion);
    semanticallyInvalidQuestion.spec.response.options[1].id =
      semanticallyInvalidQuestion.spec.response.options[0].id;
    const questionSemanticResult = semantic.validateSharedResource(
      "schemas.mission-kit/v1alpha1",
      "Question",
      semanticallyInvalidQuestion
    );
    assert.equal(questionSemanticResult.valid, false);
    assert.deepEqual(questionSemanticResult.structuralErrors, []);
    assert.ok(questionSemanticResult.semanticIssues.length > 0);

    const validContextFrame = contextFrame();
    assert.equal(structural.validateById(ids.contextFrame, validContextFrame).valid, true);
    assert.equal(
      semantic.validateSharedResource(
        "schemas.mission-kit/v1alpha1",
        "ContextFrame",
        validContextFrame
      ).valid,
      true
    );
    const structurallyInvalidContextFrame = structuredClone(validContextFrame);
    structurallyInvalidContextFrame.round = 1;
    const contextStructureResult = semantic.validateSharedResource(
      "schemas.mission-kit/v1alpha1",
      "ContextFrame",
      structurallyInvalidContextFrame
    );
    assert.equal(contextStructureResult.valid, false);
    assert.ok(contextStructureResult.structuralErrors.length > 0);
    assert.deepEqual(contextStructureResult.semanticIssues, []);
    const semanticallyInvalidContextFrame = structuredClone(validContextFrame);
    semanticallyInvalidContextFrame.spec.scope.included.push(
      semanticallyInvalidContextFrame.spec.scope.included[0]
    );
    const contextSemanticResult = semantic.validateSharedResource(
      "schemas.mission-kit/v1alpha1",
      "ContextFrame",
      semanticallyInvalidContextFrame
    );
    assert.equal(contextSemanticResult.valid, false);
    assert.deepEqual(contextSemanticResult.structuralErrors, []);
    assert.ok(contextSemanticResult.semanticIssues.length > 0);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
