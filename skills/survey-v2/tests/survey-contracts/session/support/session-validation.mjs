import Ajv2020 from "ajv/dist/2020.js";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const supportRoot = path.dirname(fileURLToPath(import.meta.url));
export const packageRoot = path.resolve(supportRoot, "../../../..");

async function readJson(absolutePath) {
  return JSON.parse(await readFile(absolutePath, "utf8"));
}

async function schemaFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await schemaFiles(absolute));
    } else if (entry.isFile() && entry.name.endsWith(".schema.json")) {
      files.push(absolute);
    }
  }
  return files.sort((left, right) =>
    Buffer.from(left, "utf8").compare(Buffer.from(right, "utf8"))
  );
}

let validatorPromise;

export async function sessionStructureValidator() {
  validatorPromise ??= (async () => {
    const roots = [
      path.join(packageRoot, "schemas/v1"),
      path.join(packageRoot, "schemas/authoring/v1alpha1"),
      path.join(packageRoot, "schemas/survey/v1alpha1"),
      path.join(packageRoot, "schemas/v2")
    ];
    const schemas = (
      await Promise.all(roots.map((root) => schemaFiles(root)))
    ).flat();
    const ajv = new Ajv2020({
      allErrors: true,
      strict: true,
      validateFormats: false
    });
    for (const schemaPath of schemas) {
      const schema = await readJson(schemaPath);
      if (!ajv.getSchema(schema.$id)) ajv.addSchema(schema);
    }
    const validate = ajv.getSchema(
      "urn:mission-kit:survey-v2:schema:session-state:v2"
    );
    if (!validate) throw new Error("session-state:v2 did not compile");
    return validate;
  })();
  return validatorPromise;
}

export async function validateSessionStructure(session) {
  const validate = await sessionStructureValidator();
  const valid = validate(session);
  return Object.freeze({
    valid,
    errors: Object.freeze(structuredClone(validate.errors ?? []))
  });
}

export function semanticCodes(issues) {
  return issues.map((item) => item.code);
}
