import { ValidationError } from "./errors.mjs";
import { types as utilTypes } from "node:util";

const HIGH_SURROGATE_START = 0xd800;
const HIGH_SURROGATE_END = 0xdbff;
const LOW_SURROGATE_START = 0xdc00;
const LOW_SURROGATE_END = 0xdfff;

function assertUnicodeScalarString(value, path) {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= HIGH_SURROGATE_START && unit <= HIGH_SURROGATE_END) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= LOW_SURROGATE_START && next <= LOW_SURROGATE_END)) {
        throw new ValidationError("String contains an unpaired high surrogate", {
          path,
          index,
        });
      }
      index += 1;
      continue;
    }
    if (unit >= LOW_SURROGATE_START && unit <= LOW_SURROGATE_END) {
      throw new ValidationError("String contains an unpaired low surrogate", {
        path,
        index,
      });
    }
  }
}

function ownDataDescriptors(value, path) {
  if (utilTypes.isProxy(value)) {
    throw new ValidationError(
      "Canonical JSON rejects proxies because their property view is not inert",
      { path },
    );
  }

  let descriptors;
  try {
    descriptors = Object.getOwnPropertyDescriptors(value);
  } catch (error) {
    throw new ValidationError(
      "Canonical JSON could not obtain a stable property view",
      { path },
      { cause: error },
    );
  }

  for (const propertyKey of Reflect.ownKeys(descriptors)) {
    const descriptor = descriptors[propertyKey];
    if (
      !Object.hasOwn(descriptor, "value") ||
      Object.hasOwn(descriptor, "get") ||
      Object.hasOwn(descriptor, "set")
    ) {
      throw new ValidationError(
        "Canonical JSON rejects accessor properties",
        {
          path,
          property:
            typeof propertyKey === "symbol"
              ? propertyKey.toString()
              : propertyKey,
        },
      );
    }
  }
  return descriptors;
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function serialize(value, path, ancestors) {
  if (value === null) {
    return "null";
  }
  switch (typeof value) {
    case "boolean":
      return value ? "true" : "false";
    case "string":
      assertUnicodeScalarString(value, path);
      return JSON.stringify(value);
    case "number":
      if (!Number.isFinite(value)) {
        throw new ValidationError("Canonical JSON rejects non-finite numbers", {
          path,
          value: String(value),
        });
      }
      return Object.is(value, -0) ? "0" : JSON.stringify(value);
    case "undefined":
    case "bigint":
    case "function":
    case "symbol":
      throw new ValidationError("Value is outside the canonical JSON domain", {
        path,
        type: typeof value,
      });
    case "object":
      break;
    default:
      throw new ValidationError("Unsupported canonical JSON value", {
        path,
        type: typeof value,
      });
  }

  const descriptors = ownDataDescriptors(value, path);
  if (ancestors.has(value)) {
    throw new ValidationError("Canonical JSON rejects cyclic values", { path });
  }
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const ownKeys = Reflect.ownKeys(descriptors);
      const length = descriptors.length.value;
      const expectedKeys = new Set([
        ...Array.from({ length }, (_, index) => String(index)),
        "length",
      ]);
      if (
        ownKeys.length !== expectedKeys.size ||
        ownKeys.some(
          (key) => typeof key !== "string" || !expectedKeys.has(key),
        )
      ) {
        throw new ValidationError(
          "Canonical JSON arrays cannot have extra properties",
          { path },
        );
      }
      const parts = [];
      for (let index = 0; index < length; index += 1) {
        const descriptor = descriptors[index];
        if (descriptor === undefined) {
          throw new ValidationError("Canonical JSON rejects sparse arrays", {
            path,
            index,
          });
        }
        parts.push(serialize(descriptor.value, `${path}[${index}]`, ancestors));
      }
      return `[${parts.join(",")}]`;
    }
    if (!isPlainObject(value)) {
      throw new ValidationError("Canonical JSON accepts only plain objects", {
        path,
      });
    }
    const ownKeys = Reflect.ownKeys(descriptors);
    if (ownKeys.some((key) => typeof key !== "string")) {
      throw new ValidationError(
        "Canonical JSON objects cannot have symbol properties",
        { path },
      );
    }
    const keys = [...ownKeys].sort();
    const parts = [];
    for (const key of keys) {
      if (!descriptors[key].enumerable) {
        throw new ValidationError(
          "Canonical JSON object properties must be enumerable",
          { path, property: key },
        );
      }
      assertUnicodeScalarString(key, `${path}{key}`);
      parts.push(
        `${JSON.stringify(key)}:${serialize(
          descriptors[key].value,
          `${path}.${key}`,
          ancestors,
        )}`,
      );
    }
    return `{${parts.join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
}

export function canonicalize(value) {
  return serialize(value, "$", new Set());
}

export function canonicalBytes(value) {
  return Buffer.from(canonicalize(value), "utf8");
}

class StrictJsonParser {
  constructor(text) {
    this.text = text;
    this.index = 0;
  }

  fail(message) {
    throw new ValidationError(message, { offset: this.index });
  }

  skipWhitespace() {
    while (this.index < this.text.length && /[\t\n\r ]/.test(this.text[this.index])) {
      this.index += 1;
    }
  }

  parse() {
    this.skipWhitespace();
    const value = this.parseValue();
    this.skipWhitespace();
    if (this.index !== this.text.length) {
      this.fail("Unexpected trailing JSON content");
    }
    canonicalize(value);
    return value;
  }

  parseValue() {
    this.skipWhitespace();
    const token = this.text[this.index];
    if (token === "{") return this.parseObject();
    if (token === "[") return this.parseArray();
    if (token === '"') return this.parseString();
    if (token === "t") return this.parseLiteral("true", true);
    if (token === "f") return this.parseLiteral("false", false);
    if (token === "n") return this.parseLiteral("null", null);
    if (token === "-" || (token >= "0" && token <= "9")) return this.parseNumber();
    this.fail("Unexpected JSON token");
  }

  parseLiteral(literal, value) {
    if (this.text.slice(this.index, this.index + literal.length) !== literal) {
      this.fail(`Expected ${literal}`);
    }
    this.index += literal.length;
    return value;
  }

  parseString() {
    const start = this.index;
    this.index += 1;
    let escaped = false;
    while (this.index < this.text.length) {
      const code = this.text.charCodeAt(this.index);
      if (!escaped && code === 0x22) {
        this.index += 1;
        const raw = this.text.slice(start, this.index);
        let value;
        try {
          value = JSON.parse(raw);
        } catch (error) {
          throw new ValidationError("Invalid JSON string", { offset: start }, { cause: error });
        }
        assertUnicodeScalarString(value, `$@${start}`);
        return value;
      }
      if (!escaped && code < 0x20) {
        this.fail("Unescaped control character in JSON string");
      }
      if (!escaped && code === 0x5c) {
        escaped = true;
        this.index += 1;
        continue;
      }
      escaped = false;
      this.index += 1;
    }
    this.fail("Unterminated JSON string");
  }

  parseNumber() {
    const remaining = this.text.slice(this.index);
    const match = remaining.match(
      /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/,
    );
    if (!match) this.fail("Invalid JSON number");
    const raw = match[0];
    this.index += raw.length;
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      this.fail("JSON number is outside the finite IEEE-754 domain");
    }
    return value;
  }

  parseArray() {
    this.index += 1;
    const result = [];
    this.skipWhitespace();
    if (this.text[this.index] === "]") {
      this.index += 1;
      return result;
    }
    while (true) {
      result.push(this.parseValue());
      this.skipWhitespace();
      const token = this.text[this.index];
      if (token === "]") {
        this.index += 1;
        return result;
      }
      if (token !== ",") this.fail("Expected ',' or ']' in JSON array");
      this.index += 1;
    }
  }

  parseObject() {
    this.index += 1;
    const result = Object.create(null);
    const keys = new Set();
    this.skipWhitespace();
    if (this.text[this.index] === "}") {
      this.index += 1;
      return result;
    }
    while (true) {
      this.skipWhitespace();
      if (this.text[this.index] !== '"') this.fail("Expected object key");
      const key = this.parseString();
      if (keys.has(key)) {
        throw new ValidationError("Duplicate JSON object key", {
          offset: this.index,
          key,
        });
      }
      keys.add(key);
      this.skipWhitespace();
      if (this.text[this.index] !== ":") this.fail("Expected ':' after object key");
      this.index += 1;
      result[key] = this.parseValue();
      this.skipWhitespace();
      const token = this.text[this.index];
      if (token === "}") {
        this.index += 1;
        return result;
      }
      if (token !== ",") this.fail("Expected ',' or '}' in JSON object");
      this.index += 1;
    }
  }
}

export function parseStrictJson(text) {
  if (typeof text !== "string") {
    throw new ValidationError("Strict JSON input must be a string");
  }
  return new StrictJsonParser(text).parse();
}

export function deepCloneCanonical(value) {
  return parseStrictJson(canonicalize(value));
}

export function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value)) deepFreeze(item);
  }
  return value;
}
