import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { readJson } from "./fixture.mjs";

function createAjv() {
  return new Ajv2020({
    allErrors: true,
    strict: true,
    validateFormats: false
  });
}

export async function structuralValidatorPair({
  packageRoot,
  authorityRoot,
  manifest,
  schemaId
}) {
  const catalog = await readJson(path.join(authorityRoot, "catalog.json"));
  const authorityAjv = createAjv();
  for (const binding of catalog.schemas) {
    authorityAjv.addSchema(await readJson(path.join(authorityRoot, binding.path)));
  }
  const snapshotAjv = createAjv();
  for (const member of manifest.schemas) {
    snapshotAjv.addSchema(await readJson(path.join(packageRoot, member.snapshotPath)));
  }
  return {
    authority: authorityAjv.getSchema(schemaId),
    snapshot: snapshotAjv.getSchema(schemaId)
  };
}

export function structuralResult(validator, value) {
  const valid = validator(value);
  return {
    valid,
    errors: valid
      ? []
      : (validator.errors ?? []).map((error) => ({
          instancePath: error.instancePath,
          schemaPath: error.schemaPath,
          keyword: error.keyword,
          params: error.params,
          message: error.message
        }))
  };
}

export async function semanticValidatorPair({
  packageRoot,
  authorityRoot,
  manifest,
  sourcePath,
  exportName
}) {
  const member = manifest.validators.find((entry) => entry.sourcePath === sourcePath);
  if (!member) throw new Error(`snapshot validator is absent: ${sourcePath}`);
  const authorityModule = await import(pathToFileURL(path.join(authorityRoot, sourcePath)));
  const snapshotModule = await import(
    pathToFileURL(path.join(packageRoot, member.snapshotPath))
  );
  return {
    authority: authorityModule[exportName],
    snapshot: snapshotModule[exportName]
  };
}

export async function exactFileBytes(filePath) {
  return readFile(filePath);
}
