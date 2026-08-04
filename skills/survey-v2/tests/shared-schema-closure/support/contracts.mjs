import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { readJson, surveyRoot } from "./fixture.mjs";

export async function localContractValidators() {
  const common = await readJson(path.join(
    surveyRoot,
    "schemas/v1/common.schema.json"
  ));
  const roots = await readJson(path.join(
    surveyRoot,
    "schemas/v1/shared-schema-roots.schema.json"
  ));
  const closure = await readJson(path.join(
    surveyRoot,
    "schemas/v1/shared-schema-closure.schema.json"
  ));
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    validateFormats: false
  });
  for (const schema of [common, roots, closure]) ajv.addSchema(schema);
  return {
    roots: ajv.getSchema(roots.$id),
    closure: ajv.getSchema(closure.$id)
  };
}
