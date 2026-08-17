import { join } from "node:path";
import { readJsonFile } from "./atomic-fs.mjs";
import { deepCloneCanonical } from "./canonical-json.mjs";
import { ValidationError } from "./errors.mjs";
import {
  lintSchema,
  validateSchemaInstance,
} from "../shared/schema-validator.mjs";

const KEYWORD_PATTERNS = [
  ["falseSchema", /false schema/u],
  ["const", /const/u],
  ["enum", /enum/u],
  ["type", /expected type/u],
  ["allOf", /allOf/u],
  ["anyOf", /anyOf/u],
  ["oneOf", /oneOf/u],
  ["not", /forbidden schema/u],
  ["if", /condition/u],
  ["minLength", /minLength/u],
  ["maxLength", /maxLength/u],
  ["pattern", /pattern/u],
  ["format", /date-time/u],
  ["minimum", /minimum/u],
  ["maximum", /maximum/u],
  ["exclusiveMinimum", /exclusiveMinimum/u],
  ["exclusiveMaximum", /exclusiveMaximum/u],
  ["multipleOf", /multipleOf/u],
  ["minItems", /minItems/u],
  ["maxItems", /maxItems/u],
  ["uniqueItems", /unique/u],
  ["contains", /contains/u],
  ["minProperties", /too few properties/u],
  ["maxProperties", /too many properties/u],
  ["required", /missing required/u],
  ["propertyNames", /\{key\}/u],
  ["additionalProperties", /unknown property/u],
  ["dependentRequired", /requires/u],
];

function structuredError(message) {
  const keyword =
    KEYWORD_PATTERNS.find(([, pattern]) => pattern.test(message))?.[0] ??
    "schema";
  const separator = message.indexOf(":");
  return {
    instancePath: separator === -1 ? "$" : message.slice(0, separator),
    schemaPath: "#",
    keyword,
    message,
  };
}

export function validateJsonSchema(instance, schema) {
  const inertSchema = deepCloneCanonical(schema);
  const inertInstance = deepCloneCanonical(instance);
  try {
    lintSchema(inertSchema);
  } catch (error) {
    throw new ValidationError("JSON Schema failed supported-keyword audit", {
      cause: error.message,
    });
  }
  const errors = validateSchemaInstance(inertSchema, inertInstance).map(
    structuredError,
  );
  return { valid: errors.length === 0, errors };
}

export class SchemaValidator {
  static async fromPackageRoot(
    packageRoot,
    {
      catalogPath = join(packageRoot, "source/manifests/schema-catalog.json"),
      schemasRoot = join(packageRoot, "schemas"),
    } = {},
  ) {
    const catalog = await readJsonFile(catalogPath);
    return SchemaValidator.load({ catalog, catalogPath, schemasRoot });
  }

  static async load({ catalog, catalogPath = null, schemasRoot }) {
    if (!catalog || !Array.isArray(catalog.schemas) || !catalog.idPrefix) {
      throw new ValidationError("Schema catalog is malformed", { catalogPath });
    }
    const schemas = new Map();
    const filenames = new Set();
    for (const filename of catalog.schemas) {
      if (
        typeof filename !== "string" ||
        !/^[A-Za-z0-9][A-Za-z0-9._-]*\.schema\.json$/u.test(filename) ||
        filenames.has(filename)
      ) {
        throw new ValidationError(
          "Schema catalog filename is invalid or duplicate",
          { filename },
        );
      }
      filenames.add(filename);
      const schema = await readJsonFile(join(schemasRoot, filename));
      const expectedId = `${catalog.idPrefix}${filename.replace(
        /\.schema\.json$/u,
        "",
      )}`;
      if (schema.$id !== expectedId || schemas.has(schema.$id)) {
        throw new ValidationError(
          "Generated schema identity is invalid or duplicate",
          { filename, expectedId, actualId: schema.$id },
        );
      }
      if (schema.additionalProperties !== false) {
        throw new ValidationError("Generated schema root must be closed", {
          filename,
        });
      }
      try {
        lintSchema(schema, filename);
      } catch (error) {
        throw new ValidationError(
          "Generated schema failed supported-keyword audit",
          { filename, cause: error.message },
        );
      }
      const record = { filename, schema };
      schemas.set(schema.$id, record);
      schemas.set(filename, record);
      schemas.set(filename.replace(/\.schema\.json$/u, ""), record);
    }
    return new SchemaValidator({
      catalog,
      catalogPath,
      schemasRoot,
      schemas,
    });
  }

  constructor({ catalog, catalogPath, schemasRoot, schemas }) {
    this.catalog = catalog;
    this.catalogPath = catalogPath;
    this.schemasRoot = schemasRoot;
    this.schemas = schemas;
  }

  schema(identifier) {
    const record = this.schemas.get(identifier);
    if (!record) throw new ValidationError("Unknown schema", { identifier });
    return record.schema;
  }

  check(identifier, instance) {
    return validateJsonSchema(instance, this.schema(identifier));
  }

  assert(identifier, instance) {
    const result = this.check(identifier, instance);
    if (!result.valid) {
      throw new ValidationError(
        "Value does not satisfy its generated schema",
        { identifier, errors: result.errors },
      );
    }
    return instance;
  }
}
