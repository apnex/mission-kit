import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import {
  protocolSourceBytesDigest
} from "../../../source/authoring/survey/protocol-semantics.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
export const packageRoot = path.resolve(here, "../../..");

const schemaPaths = Object.freeze([
  "schemas/authoring/v1alpha1/common.schema.json",
  "schemas/authoring/v1alpha1/resource-reference.schema.json",
  "schemas/authoring/v1alpha1/authoring-protocol.schema.json",
  "schemas/v2/common.schema.json",
  "schemas/v2/protocol.schema.json",
  "schemas/v2/paired-state-matrix.schema.json",
  "schemas/v2/protocol-selection.schema.json"
]);

let validatorsPromise;

export async function readPackageJson(relativePath) {
  return JSON.parse(
    await readFile(path.join(packageRoot, relativePath), "utf8")
  );
}

export async function readPackageBytes(relativePath) {
  return readFile(path.join(packageRoot, relativePath));
}

export async function contractValidators() {
  if (!validatorsPromise) {
    validatorsPromise = (async () => {
      const ajv = new Ajv2020({
        allErrors: true,
        strict: true,
        validateFormats: false
      });
      for (const relativePath of schemaPaths) {
        ajv.addSchema(await readPackageJson(relativePath));
      }
      return ajv;
    })();
  }
  return validatorsPromise;
}

export async function assertStructurallyValid(schemaId, value) {
  const ajv = await contractValidators();
  const validate = ajv.getSchema(schemaId);
  assert.ok(validate, `schema is registered: ${schemaId}`);
  assert.equal(
    validate(value),
    true,
    JSON.stringify(validate.errors ?? [])
  );
}

export async function loadProtocolContractSet() {
  const [
    authoringProtocol,
    protocol,
    pairedStateMatrix,
    protocolSelection,
    goldenBindings,
    v1ProtocolBytes,
    candidateProtocolBytes
  ] = await Promise.all([
    readPackageJson(
      "source/authoring/survey/survey-authoring.protocol.json"
    ),
    readPackageJson("source/protocol/survey-v2.protocol.json"),
    readPackageJson("source/protocol/paired-state-matrix.v2.json"),
    readPackageJson("source/protocol/protocol-selection.json"),
    readPackageJson("tests/fixtures/survey/protocol/golden-bindings.json"),
    readPackageBytes("source/protocol/survey.protocol.json"),
    readPackageBytes("source/protocol/survey-v2.protocol.json")
  ]);
  return {
    authoringProtocol,
    protocol,
    pairedStateMatrix,
    protocolSelection,
    goldenBindings,
    v1ProtocolBytes,
    candidateProtocolBytes,
    v1ProtocolSourceDigest: protocolSourceBytesDigest(v1ProtocolBytes),
    candidateProtocolSourceDigest:
      protocolSourceBytesDigest(candidateProtocolBytes)
  };
}
