import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const supportDirectory = path.dirname(fileURLToPath(import.meta.url));
export const schemasRoot = path.resolve(supportDirectory, "../..");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(schemasRoot, relativePath), "utf8"));
}

export const schemaCatalog = readJson("catalog.json");
export const catalogSchemas = schemaCatalog.schemas.map((entry) => ({
  ...entry,
  schema: readJson(entry.path)
}));
export const contextFrameSchema = catalogSchemas.find(
  (entry) => entry.id === "urn:mission-kit:schemas:context-frame:v1alpha1"
).schema;

const ajv = new Ajv2020({
  allErrors: true,
  strict: true
});

for (const entry of catalogSchemas) {
  ajv.addSchema(entry.schema);
}

export const validateContextFrameStructure = ajv.getSchema(contextFrameSchema.$id);

export function readContextFrameExample(name) {
  return readJson(`context-frame/v1alpha1/examples/${name}`);
}

export function clone(value) {
  return structuredClone(value);
}
