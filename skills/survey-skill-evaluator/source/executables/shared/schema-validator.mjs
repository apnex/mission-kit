import { types as utilTypes } from "node:util";

const SUPPORTED_KEYWORDS = new Set([
  "$schema",
  "$id",
  "$defs",
  "$ref",
  "title",
  "description",
  "type",
  "const",
  "enum",
  "properties",
  "patternProperties",
  "additionalProperties",
  "required",
  "dependentRequired",
  "dependentSchemas",
  "propertyNames",
  "minProperties",
  "maxProperties",
  "items",
  "prefixItems",
  "contains",
  "minContains",
  "maxContains",
  "minItems",
  "maxItems",
  "uniqueItems",
  "minLength",
  "maxLength",
  "pattern",
  "format",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "allOf",
  "anyOf",
  "oneOf",
  "not",
  "if",
  "then",
  "else",
  "default",
  "examples",
  "readOnly",
  "writeOnly"
]);

function assertInertJsonData(value, path = "$", ancestors = new Set()) {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string"
  ) {
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(`${path}: non-finite JSON number`);
    }
    return;
  }
  if (typeof value !== "object") {
    throw new TypeError(`${path}: value is outside the JSON data model`);
  }
  if (utilTypes.isProxy(value)) {
    throw new TypeError(`${path}: proxy objects are outside the JSON data model`);
  }
  if (ancestors.has(value)) {
    throw new TypeError(`${path}: cyclic JSON value`);
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const key of Reflect.ownKeys(descriptors)) {
    const descriptor = descriptors[key];
    if (
      !Object.hasOwn(descriptor, "value") ||
      Object.hasOwn(descriptor, "get") ||
      Object.hasOwn(descriptor, "set")
    ) {
      throw new TypeError(`${path}: JSON properties must be inert data properties`);
    }
  }
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const length = descriptors.length.value;
      const expected = new Set([
        ...Array.from({ length }, (_, index) => String(index)),
        "length"
      ]);
      const keys = Reflect.ownKeys(descriptors);
      if (
        keys.length !== expected.size ||
        keys.some((key) => typeof key !== "string" || !expected.has(key))
      ) {
        throw new TypeError(`${path}: JSON arrays cannot have extra properties`);
      }
      for (let index = 0; index < length; index += 1) {
        assertInertJsonData(
          descriptors[index].value,
          `${path}[${index}]`,
          ancestors
        );
      }
      return;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(`${path}: JSON object must have a plain prototype`);
    }
    for (const key of Reflect.ownKeys(descriptors)) {
      if (typeof key !== "string" || descriptors[key].enumerable !== true) {
        throw new TypeError(
          `${path}: JSON object members must be enumerable string data properties`
        );
      }
      assertInertJsonData(
        descriptors[key].value,
        `${path}.${key}`,
        ancestors
      );
    }
  } finally {
    ancestors.delete(value);
  }
}

function canonicalize(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string" || typeof value === "number") {
    return JSON.stringify(Object.is(value, -0) ? 0 : value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
    .join(",")}}`;
}

function sameJson(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function decodePointerSegment(segment) {
  return segment.replaceAll("~1", "/").replaceAll("~0", "~");
}

export function resolveInternalRef(rootSchema, reference) {
  if (reference === "#") return rootSchema;
  if (!reference.startsWith("#/")) {
    throw new Error(`external or malformed schema reference is forbidden: ${reference}`);
  }
  let cursor = rootSchema;
  for (const encoded of reference.slice(2).split("/")) {
    const segment = decodePointerSegment(encoded);
    if (!isObject(cursor) || !Object.hasOwn(cursor, segment)) {
      throw new Error(`unresolved internal schema reference: ${reference}`);
    }
    cursor = cursor[segment];
  }
  return cursor;
}

function typeMatches(type, value) {
  switch (type) {
    case "null":
      return value === null;
    case "boolean":
      return typeof value === "boolean";
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "integer":
      return Number.isInteger(value);
    case "array":
      return Array.isArray(value);
    case "object":
      return isObject(value);
    default:
      throw new Error(`unsupported JSON Schema type: ${type}`);
  }
}

function probe(schema, instance, rootSchema) {
  const errors = [];
  validate(schema, instance, rootSchema, "$", errors);
  return errors;
}

function validate(schema, instance, rootSchema, instancePath, errors) {
  if (schema === true) return;
  if (schema === false) {
    errors.push(`${instancePath}: rejected by false schema`);
    return;
  }
  if (!isObject(schema)) {
    throw new Error(`${instancePath}: schema node must be an object or boolean`);
  }

  if (schema.$ref !== undefined) {
    validate(
      resolveInternalRef(rootSchema, schema.$ref),
      instance,
      rootSchema,
      instancePath,
      errors
    );
  }
  if (schema.const !== undefined && !sameJson(instance, schema.const)) {
    errors.push(`${instancePath}: value does not equal const`);
  }
  if (
    Array.isArray(schema.enum) &&
    !schema.enum.some((candidate) => sameJson(instance, candidate))
  ) {
    errors.push(`${instancePath}: value is not in enum`);
  }
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type) => typeMatches(type, instance))) {
      errors.push(`${instancePath}: expected type ${types.join("|")}`);
      return;
    }
  }

  if (Array.isArray(schema.allOf)) {
    for (const member of schema.allOf) {
      validate(member, instance, rootSchema, instancePath, errors);
    }
  }
  if (Array.isArray(schema.anyOf)) {
    const matches = schema.anyOf.filter(
      (member) => probe(member, instance, rootSchema).length === 0
    );
    if (matches.length === 0) errors.push(`${instancePath}: no anyOf branch matched`);
  }
  if (Array.isArray(schema.oneOf)) {
    const matches = schema.oneOf.filter(
      (member) => probe(member, instance, rootSchema).length === 0
    );
    if (matches.length !== 1) {
      errors.push(`${instancePath}: expected one oneOf match, got ${matches.length}`);
    }
  }
  if (schema.not !== undefined && probe(schema.not, instance, rootSchema).length === 0) {
    errors.push(`${instancePath}: forbidden schema matched`);
  }
  if (schema.if !== undefined) {
    const conditionMatches = probe(schema.if, instance, rootSchema).length === 0;
    if (conditionMatches && schema.then !== undefined) {
      validate(schema.then, instance, rootSchema, instancePath, errors);
    } else if (!conditionMatches && schema.else !== undefined) {
      validate(schema.else, instance, rootSchema, instancePath, errors);
    }
  }

  if (typeof instance === "string") {
    if (schema.minLength !== undefined && [...instance].length < schema.minLength) {
      errors.push(`${instancePath}: string shorter than minLength`);
    }
    if (schema.maxLength !== undefined && [...instance].length > schema.maxLength) {
      errors.push(`${instancePath}: string longer than maxLength`);
    }
    if (schema.pattern !== undefined && !new RegExp(schema.pattern, "u").test(instance)) {
      errors.push(`${instancePath}: string does not match pattern`);
    }
    if (
      schema.format === "date-time" &&
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/u.test(instance)
    ) {
      errors.push(`${instancePath}: invalid date-time`);
    }
  }

  if (typeof instance === "number" && Number.isFinite(instance)) {
    if (schema.minimum !== undefined && instance < schema.minimum) {
      errors.push(`${instancePath}: number below minimum`);
    }
    if (schema.maximum !== undefined && instance > schema.maximum) {
      errors.push(`${instancePath}: number above maximum`);
    }
    if (schema.exclusiveMinimum !== undefined && instance <= schema.exclusiveMinimum) {
      errors.push(`${instancePath}: number not above exclusiveMinimum`);
    }
    if (schema.exclusiveMaximum !== undefined && instance >= schema.exclusiveMaximum) {
      errors.push(`${instancePath}: number not below exclusiveMaximum`);
    }
    if (
      schema.multipleOf !== undefined &&
      Math.abs(instance / schema.multipleOf - Math.round(instance / schema.multipleOf)) >
        Number.EPSILON * 8
    ) {
      errors.push(`${instancePath}: number is not a multipleOf value`);
    }
  }

  if (Array.isArray(instance)) {
    if (schema.minItems !== undefined && instance.length < schema.minItems) {
      errors.push(`${instancePath}: array shorter than minItems`);
    }
    if (schema.maxItems !== undefined && instance.length > schema.maxItems) {
      errors.push(`${instancePath}: array longer than maxItems`);
    }
    if (schema.uniqueItems === true) {
      const seen = new Set();
      for (const value of instance) {
        const key = canonicalize(value);
        if (seen.has(key)) {
          errors.push(`${instancePath}: array items are not unique`);
          break;
        }
        seen.add(key);
      }
    }
    const prefixLength = Array.isArray(schema.prefixItems)
      ? schema.prefixItems.length
      : 0;
    if (Array.isArray(schema.prefixItems)) {
      for (
        let index = 0;
        index < Math.min(instance.length, schema.prefixItems.length);
        index += 1
      ) {
        validate(
          schema.prefixItems[index],
          instance[index],
          rootSchema,
          `${instancePath}[${index}]`,
          errors
        );
      }
    }
    if (schema.items !== undefined) {
      for (let index = prefixLength; index < instance.length; index += 1) {
        validate(
          schema.items,
          instance[index],
          rootSchema,
          `${instancePath}[${index}]`,
          errors
        );
      }
    }
    if (schema.contains !== undefined) {
      const matchCount = instance.filter(
        (value) => probe(schema.contains, value, rootSchema).length === 0
      ).length;
      const minimum = schema.minContains ?? 1;
      const maximum = schema.maxContains ?? Number.POSITIVE_INFINITY;
      if (matchCount < minimum || matchCount > maximum) {
        errors.push(`${instancePath}: contains match count is outside bounds`);
      }
    }
  }

  if (isObject(instance)) {
    const keys = Object.keys(instance);
    if (schema.minProperties !== undefined && keys.length < schema.minProperties) {
      errors.push(`${instancePath}: object has too few properties`);
    }
    if (schema.maxProperties !== undefined && keys.length > schema.maxProperties) {
      errors.push(`${instancePath}: object has too many properties`);
    }
    for (const required of schema.required ?? []) {
      if (!Object.hasOwn(instance, required)) {
        errors.push(`${instancePath}: missing required property ${required}`);
      }
    }
    const properties = schema.properties ?? {};
    if (schema.propertyNames !== undefined) {
      for (const key of keys) {
        validate(
          schema.propertyNames,
          key,
          rootSchema,
          `${instancePath}{key}`,
          errors
        );
      }
    }
    for (const [key, propertySchema] of Object.entries(properties)) {
      if (Object.hasOwn(instance, key)) {
        validate(
          propertySchema,
          instance[key],
          rootSchema,
          `${instancePath}.${key}`,
          errors
        );
      }
    }
    const patternProperties = schema.patternProperties ?? {};
    for (const key of keys) {
      const matchedPatternSchemas = Object.entries(patternProperties)
        .filter(([pattern]) => new RegExp(pattern, "u").test(key))
        .map(([, propertySchema]) => propertySchema);
      for (const propertySchema of matchedPatternSchemas) {
        validate(
          propertySchema,
          instance[key],
          rootSchema,
          `${instancePath}.${key}`,
          errors
        );
      }
      const named = Object.hasOwn(properties, key);
      if (!named && matchedPatternSchemas.length === 0) {
        if (schema.additionalProperties === false) {
          errors.push(`${instancePath}: unknown property ${key}`);
        } else if (isObject(schema.additionalProperties) || schema.additionalProperties === false) {
          validate(
            schema.additionalProperties,
            instance[key],
            rootSchema,
            `${instancePath}.${key}`,
            errors
          );
        }
      }
    }
    for (const [key, dependents] of Object.entries(schema.dependentRequired ?? {})) {
      if (Object.hasOwn(instance, key)) {
        for (const dependent of dependents) {
          if (!Object.hasOwn(instance, dependent)) {
            errors.push(`${instancePath}: ${key} requires ${dependent}`);
          }
        }
      }
    }
    for (const [key, dependentSchema] of Object.entries(
      schema.dependentSchemas ?? {}
    )) {
      if (Object.hasOwn(instance, key)) {
        validate(dependentSchema, instance, rootSchema, instancePath, errors);
      }
    }
  }
}

export function validateSchemaInstance(schema, instance) {
  assertInertJsonData(schema);
  assertInertJsonData(instance);
  const errors = [];
  validate(schema, instance, schema, "$", errors);
  return errors;
}

export function assertSchemaInstance(schema, instance, label = null) {
  const errors = validateSchemaInstance(schema, instance);
  label = label ?? schema.$id ?? "schema";
  if (errors.length > 0) {
    throw new Error(`${label} rejected instance:\n${errors.join("\n")}`);
  }
}

export function lintSchema(schema, label = null) {
  assertInertJsonData(schema);
  label = label ?? schema.$id ?? "schema";
  const seen = new Set();
  function visit(node, location) {
    if (node === true || node === false) return;
    if (!isObject(node) || seen.has(node)) return;
    seen.add(node);
    for (const keyword of Object.keys(node)) {
      if (!SUPPORTED_KEYWORDS.has(keyword)) {
        throw new Error(`${label}${location}: unsupported schema keyword ${keyword}`);
      }
    }
    if (node.$ref !== undefined) resolveInternalRef(schema, node.$ref);
    if (
      node.type === "object" &&
      node.additionalProperties === undefined
    ) {
      throw new Error(`${label}${location}: object schema has no explicit closure policy`);
    }
    if (
      node.required !== undefined &&
      (!Array.isArray(node.required) ||
        new Set(node.required).size !== node.required.length)
    ) {
      throw new Error(`${label}${location}: invalid or duplicate required fields`);
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === "enum" || key === "required" || key === "examples") continue;
      if (Array.isArray(value)) {
        value.forEach((member, index) => {
          if (isObject(member) || typeof member === "boolean") {
            visit(member, `${location}/${key}/${index}`);
          }
        });
      } else if (isObject(value) || typeof value === "boolean") {
        if (
          [
            "properties",
            "patternProperties",
            "$defs",
            "dependentSchemas"
          ].includes(key)
        ) {
          for (const [childKey, child] of Object.entries(value)) {
            visit(child, `${location}/${key}/${childKey}`);
          }
        } else {
          visit(value, `${location}/${key}`);
        }
      }
    }
  }
  visit(schema, "#");
}
