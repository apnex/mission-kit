import { readFileSync } from "node:fs";
import {
  resolveInternalRef,
  validateSchemaInstance,
} from "../../source/executables/shared/schema-validator.mjs";
import { generateSchemas } from "../../source/executables/compiler/lib/schemas.mjs";

const clone = (value) => JSON.parse(JSON.stringify(value));

export function generatedContractFixtureSet() {
  const catalog = JSON.parse(
    readFileSync(
      new URL("../../source/manifests/schema-catalog.json", import.meta.url),
      "utf8",
    ),
  );
  const lifecycleManifest = JSON.parse(
    readFileSync(
      new URL("../../source/manifests/lifecycles.json", import.meta.url),
      "utf8",
    ),
  );
  return {
    catalog,
    lifecycleManifest,
    generated: generateSchemas(catalog, { lifecycleManifest }),
  };
}

function patternValue(pattern) {
  const samples = [
    "a".repeat(64),
    "1.0.0",
    "TE01",
    "EI01",
    "EM01",
    "E0",
    "METRIC",
    "group-name",
    "domain.name",
    "$.field",
    "source/fragments/domain/item.json",
    "source/test-descriptors/implemented/te01.descriptor.json",
    "tests/schemas/contract.test.mjs",
    "item",
    "id",
  ];
  const expression = new RegExp(pattern, "u");
  const sample = samples.find((candidate) => expression.test(candidate));
  if (!sample) {
    throw new Error(`fixture synthesizer has no sample for pattern: ${pattern}`);
  }
  return sample;
}

function mergeMissing(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (!Object.hasOwn(target, key)) target[key] = value;
  }
  return target;
}

function conditionMatches(condition, instance) {
  return validateSchemaInstance(condition, instance).length === 0;
}

function uniquifyArrayItem(item, itemSchema, index, priorItems) {
  const isUnused = (candidate) =>
    !priorItems.some(
      (prior) => JSON.stringify(prior) === JSON.stringify(candidate),
    );
  const isValid = (candidate) =>
    validateSchemaInstance(itemSchema, candidate).length === 0;
  if (typeof item === "string") {
    const candidates = [
      `${item}-${index + 1}`,
      `${index + 1}`.repeat(64).slice(0, 64),
      `id-${index + 1}`,
      `VALUE_${index + 1}`,
    ];
    return candidates.find(
      (candidate) => isUnused(candidate) && isValid(candidate),
    );
  }
  if (Number.isInteger(item)) {
    for (let offset = 1; offset <= 100; offset += 1) {
      const candidate = item + index + offset;
      if (isUnused(candidate) && isValid(candidate)) return candidate;
    }
  }
  if (item && typeof item === "object" && !Array.isArray(item)) {
    for (const key of Object.keys(item).sort()) {
      const propertySchema = itemSchema.properties?.[key];
      if (!propertySchema) continue;
      const candidate = clone(item);
      candidate[key] = uniquifyArrayItem(
        item[key],
        propertySchema,
        index,
        priorItems.map((prior) => prior?.[key]),
      );
      if (
        candidate[key] !== undefined &&
        isUnused(candidate) &&
        isValid(candidate)
      ) {
        return candidate;
      }
    }
  }
  return undefined;
}

function synthesizeObject(schema, rootSchema) {
  const value = {};
  const properties = schema.properties ?? {};
  for (const key of schema.required ?? []) {
    if (!Object.hasOwn(properties, key)) {
      throw new Error(`required property has no schema: ${key}`);
    }
    value[key] = synthesize(properties[key], rootSchema);
  }
  for (const member of schema.allOf ?? []) {
    if (member.if !== undefined) {
      const selected = conditionMatches(member.if, value)
        ? member.then
        : member.else;
      if (selected) {
        const selectedSchema =
          selected.$ref === undefined
            ? selected
            : resolveInternalRef(rootSchema, selected.$ref);
        for (const key of selectedSchema.required ?? []) {
          if (!Object.hasOwn(value, key)) {
            const propertySchema =
              selectedSchema.properties?.[key] ?? properties[key];
            if (!propertySchema) {
              throw new Error(
                `conditional required property has no schema: ${key}`,
              );
            }
            value[key] = synthesize(propertySchema, rootSchema);
          }
        }
      }
    } else {
      const memberValue = synthesize(member, rootSchema);
      if (
        memberValue &&
        typeof memberValue === "object" &&
        !Array.isArray(memberValue)
      ) {
        mergeMissing(value, memberValue);
      }
    }
  }
  return value;
}

export function synthesize(schema, rootSchema = schema) {
  if (schema.$ref !== undefined) {
    return synthesize(resolveInternalRef(rootSchema, schema.$ref), rootSchema);
  }
  if (schema.const !== undefined) return clone(schema.const);
  if (Array.isArray(schema.enum)) return clone(schema.enum[0]);
  if (Array.isArray(schema.oneOf)) {
    return synthesize(schema.oneOf[0], rootSchema);
  }
  if (Array.isArray(schema.anyOf)) {
    return synthesize(schema.anyOf[0], rootSchema);
  }
  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  switch (type) {
    case "object":
      return synthesizeObject(schema, rootSchema);
    case "array": {
      const value = (schema.prefixItems ?? []).map((item) =>
        synthesize(item, rootSchema),
      );
      const count = Math.max(schema.minItems ?? 0, value.length);
      while (value.length < count) {
        value.push(synthesize(schema.items ?? {}, rootSchema));
      }
      if (schema.uniqueItems === true) {
        for (let index = 1; index < value.length; index += 1) {
          if (
            value
              .slice(0, index)
              .some(
                (prior) =>
                  JSON.stringify(prior) === JSON.stringify(value[index]),
              )
          ) {
            const itemSchema = schema.items ?? {};
            value[index] = uniquifyArrayItem(
              value[index],
              itemSchema,
              index,
              value.slice(0, index),
            );
            if (value[index] === undefined) {
              throw new Error("could not synthesize unique array items");
            }
          }
        }
      }
      return value;
    }
    case "string":
      if (schema.format === "date-time") return "2026-01-01T00:00:00Z";
      if (schema.pattern !== undefined) return patternValue(schema.pattern);
      return "value";
    case "integer": {
      let value = schema.minimum ?? 0;
      if (schema.exclusiveMinimum !== undefined) {
        value = Math.floor(schema.exclusiveMinimum) + 1;
      }
      return value;
    }
    case "number": {
      let value = schema.minimum ?? 0;
      if (schema.exclusiveMinimum !== undefined) {
        value = schema.exclusiveMinimum + 1;
      }
      return value;
    }
    case "boolean":
      return false;
    case "null":
      return null;
    case undefined:
      if (schema.properties !== undefined || schema.required !== undefined) {
        return synthesizeObject(schema, rootSchema);
      }
      return {};
    default:
      throw new Error(`unsupported fixture type: ${type}`);
  }
}

export function firstDomainRequired(schema) {
  return schema.required.find(
    (key) => key !== "schemaVersion" && key !== "hashProfileId",
  );
}

function resolved(schema, rootSchema) {
  return schema.$ref === undefined
    ? schema
    : resolveInternalRef(rootSchema, schema.$ref);
}

function allowedJsonTypes(schema, rootSchema, types = new Set()) {
  schema = resolved(schema, rootSchema);
  if (schema.const !== undefined) {
    types.add(
      schema.const === null
        ? "null"
        : Array.isArray(schema.const)
          ? "array"
          : typeof schema.const,
    );
  }
  for (const value of schema.enum ?? []) {
    types.add(
      value === null ? "null" : Array.isArray(value) ? "array" : typeof value,
    );
  }
  const declared = Array.isArray(schema.type) ? schema.type : [schema.type];
  for (const type of declared) {
    if (type !== undefined) types.add(type === "integer" ? "number" : type);
  }
  for (const branch of [...(schema.oneOf ?? []), ...(schema.anyOf ?? [])]) {
    allowedJsonTypes(branch, rootSchema, types);
  }
  return types;
}

export function wrongTypeValue(schema, rootSchema) {
  const allowed = allowedJsonTypes(schema, rootSchema);
  const candidates = [
    ["null", null],
    ["boolean", true],
    ["number", 7],
    ["string", "wrong"],
    ["array", []],
    ["object", { wrong: true }],
  ];
  const candidate = candidates.find(([type]) => !allowed.has(type));
  if (!candidate) {
    throw new Error("schema accepts every JSON type");
  }
  return clone(candidate[1]);
}

function atPath(instance, path) {
  let cursor = instance;
  for (const segment of path) cursor = cursor[segment];
  return cursor;
}

function deleteCandidate(instance, path, key) {
  const candidate = clone(instance);
  delete atPath(candidate, path)[key];
  return candidate;
}

function replaceCandidate(instance, path, key, value) {
  const candidate = clone(instance);
  atPath(candidate, path)[key] = value;
  return candidate;
}

function *conditionalCandidates(
  schema,
  node,
  rootSchema,
  wholeInstance,
  path = [],
) {
  schema = resolved(schema, rootSchema);
  if (Array.isArray(schema.oneOf)) {
    for (const branch of schema.oneOf) {
      const probeSchema =
        rootSchema.$defs === undefined
          ? branch
          : { ...branch, $defs: rootSchema.$defs };
      const branchErrors = validateSchemaInstance(probeSchema, node);
      if (branchErrors.length !== 0) continue;
      const resolvedBranch = resolved(branch, rootSchema);
      for (const key of resolvedBranch.required ?? []) {
        if (node && Object.hasOwn(node, key)) {
          yield deleteCandidate(wholeInstance, path, key);
        }
      }
      for (const [key, property] of Object.entries(
        resolvedBranch.properties ?? {},
      )) {
        if (property.const !== undefined && node && Object.hasOwn(node, key)) {
          yield replaceCandidate(wholeInstance, path, key, {
            invalidDiscriminator: true,
          });
        }
      }
      yield *conditionalCandidates(
        resolvedBranch,
        node,
        rootSchema,
        wholeInstance,
        path,
      );
      break;
    }
  }
  for (const member of schema.allOf ?? []) {
    if (member.if !== undefined) {
      const selected = conditionMatches(member.if, node)
        ? member.then
        : member.else;
      if (selected) {
        const selectedSchema = resolved(selected, rootSchema);
        for (const key of selectedSchema.required ?? []) {
          if (node && Object.hasOwn(node, key)) {
            yield deleteCandidate(wholeInstance, path, key);
          }
        }
      }
      if (member.then) {
        const forced = clone(wholeInstance);
        const forcedNode = atPath(forced, path);
        for (const [key, conditionProperty] of Object.entries(
          member.if.properties ?? {},
        )) {
          forcedNode[key] = synthesize(conditionProperty, rootSchema);
        }
        const thenSchema = resolved(member.then, rootSchema);
        const missing = (thenSchema.required ?? []).find((key) =>
          Object.hasOwn(forcedNode, key),
        );
        if (missing !== undefined) {
          delete forcedNode[missing];
        } else {
          const conditionalConst = Object.entries(
            thenSchema.properties ?? {},
          ).find(
            ([key, property]) =>
              property.const !== undefined && Object.hasOwn(forcedNode, key),
          );
          if (conditionalConst) {
            forcedNode[conditionalConst[0]] = {
              invalidConditionalValue: true,
            };
          }
        }
        yield forced;
      }
    }
  }
  if (!node || typeof node !== "object") return;
  for (const [key, propertySchema] of Object.entries(schema.properties ?? {})) {
    if (!Object.hasOwn(node, key)) continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (let index = 0; index < child.length; index += 1) {
        yield *conditionalCandidates(
          propertySchema.items ?? {},
          child[index],
          rootSchema,
          wholeInstance,
          [...path, key, index],
        );
      }
    } else {
      yield *conditionalCandidates(
        propertySchema,
        child,
        rootSchema,
        wholeInstance,
        [...path, key],
      );
    }
  }
}

function *conditionalEnrichments(
  schema,
  node,
  rootSchema,
  wholeInstance,
  path = [],
) {
  schema = resolved(schema, rootSchema);
  if (Array.isArray(schema.oneOf)) {
    for (const branch of schema.oneOf) {
      const probeSchema =
        rootSchema.$defs === undefined
          ? branch
          : { ...branch, $defs: rootSchema.$defs };
      if (validateSchemaInstance(probeSchema, node).length === 0) {
        yield *conditionalEnrichments(
          branch,
          node,
          rootSchema,
          wholeInstance,
          path,
        );
        break;
      }
    }
  }
  if (!node || typeof node !== "object") return;
  for (const [key, propertySchema] of Object.entries(schema.properties ?? {})) {
    if (!Object.hasOwn(node, key)) {
      if (containsConditional(propertySchema)) {
        const enriched = clone(wholeInstance);
        atPath(enriched, path)[key] = synthesize(propertySchema, rootSchema);
        yield enriched;
      }
      continue;
    }
    const child = node[key];
    if (Array.isArray(child)) {
      if (
        child.length === 0 &&
        containsConditional(propertySchema.items ?? {})
      ) {
        const enriched = clone(wholeInstance);
        atPath(enriched, [...path, key]).push(
          synthesize(propertySchema.items, rootSchema),
        );
        yield enriched;
      }
      for (let index = 0; index < child.length; index += 1) {
        yield *conditionalEnrichments(
          propertySchema.items ?? {},
          child[index],
          rootSchema,
          wholeInstance,
          [...path, key, index],
        );
      }
    } else {
      yield *conditionalEnrichments(
        propertySchema,
        child,
        rootSchema,
        wholeInstance,
        [...path, key],
      );
    }
  }
}

export function conditionalRejectionFixture(schema, instance) {
  for (const candidate of conditionalCandidates(
    schema,
    instance,
    schema,
    instance,
  )) {
    if (validateSchemaInstance(schema, candidate).length > 0) return candidate;
  }
  for (const enriched of conditionalEnrichments(
    schema,
    instance,
    schema,
    instance,
  )) {
    if (validateSchemaInstance(schema, enriched).length !== 0) continue;
    for (const candidate of conditionalCandidates(
      schema,
      enriched,
      schema,
      enriched,
    )) {
      if (validateSchemaInstance(schema, candidate).length > 0) {
        return candidate;
      }
    }
  }
  return null;
}

export function containsConditional(schema) {
  if (!schema || typeof schema !== "object") return false;
  if (Array.isArray(schema)) return schema.some(containsConditional);
  if (schema.oneOf !== undefined || schema.if !== undefined) return true;
  return Object.values(schema).some(containsConditional);
}
