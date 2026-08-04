/* GENERATED FILE. Refresh the shared-schema snapshot and run ./compile.sh. */
import { validateById } from "./validators.mjs";
import { validateContextFrameSemantics as semantic_00 } from "../dependencies/shared-schemas/v1/snapshot/context-frame/v1alpha1/context-frame.validator.mjs";
import { validateQuestionSemantics as semantic_01 } from "../dependencies/shared-schemas/v1/snapshot/question/v1alpha1/question.validator.mjs";

const bindings = Object.freeze([
  Object.freeze({ apiVersion: "schemas.mission-kit/v1alpha1", kind: "ContextFrame", schemaId: "urn:mission-kit:schemas:context-frame:v1alpha1", semanticValidatorExport: "validateContextFrameSemantics", validateSemantics: semantic_00 }),
  Object.freeze({ apiVersion: "schemas.mission-kit/v1alpha1", kind: "Question", schemaId: "urn:mission-kit:schemas:question:v1alpha1", semanticValidatorExport: "validateQuestionSemantics", validateSemantics: semantic_01 })
]);
const bindingsByKey = new Map(bindings.map((binding) => [`${binding.apiVersion}\0${binding.kind}`, binding]));

export function sharedResourceBinding(apiVersion, kind) {
  const binding = bindingsByKey.get(`${apiVersion}\0${kind}`);
  if (!binding) return null;
  return Object.freeze({
    apiVersion: binding.apiVersion,
    kind: binding.kind,
    schemaId: binding.schemaId,
    semanticValidatorExport: binding.semanticValidatorExport
  });
}

export function validateSharedResource(apiVersion, kind, value) {
  const binding = bindingsByKey.get(`${apiVersion}\0${kind}`);
  if (!binding) {
    return {
      valid: false,
      schemaId: null,
      structuralErrors: [`unknown shared resource binding ${apiVersion}/${kind}`],
      semanticIssues: []
    };
  }
  const structural = validateById(binding.schemaId, value);
  const structuralErrors = structural.valid ? [] : [...structural.errors];
  const semanticIssues = structural.valid ? binding.validateSemantics(value) : [];
  return {
    valid: structural.valid && semanticIssues.length === 0,
    schemaId: binding.schemaId,
    structuralErrors,
    semanticIssues
  };
}
