import { stableValue } from "./canonical.mjs";
import { formDefinitionDigest } from "./digests.mjs";

const utf8Decoder = new TextDecoder("utf-8", { fatal: true });

export const AUTHORING_TEXT_GRAMMAR_VERSION =
  "mission-kit-authoring-text/v1";
export const DEFAULT_FORM_MARKER_NAMESPACE = "mission-kit-authoring-text";
export const TEXT_FORM_MEDIA_TYPE = "text/plain;charset=utf-8";
export const MAX_TEXT_FORM_BYTES = 1048576;

export const AUTHORING_FIELD_ID_PATTERN =
  /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;

const digestPattern = /^sha256:[0-9a-f]{64}$/;
const handlePattern = /^[0-9a-f]{8,64}$/;
const requestMarkerPattern =
  /^<!-- ([a-z][a-z0-9-]{0,63}):v1 request=([0-9a-f]{8,64}) -->$/;
const openFieldMarkerPattern =
  /^<!-- field:([a-z][a-z0-9]*(?:[._-][a-z0-9]+)*) type=(paragraph|string-list|enum|boolean) -->$/;
const closeFieldMarkerPattern =
  /^<!-- \/field:([a-z][a-z0-9]*(?:[._-][a-z0-9]+)*) -->$/;
const reservedMarkerPattern =
  /<!--\s*(?:\/?field:|[a-z][a-z0-9-]*:v[0-9]+\s+request=)/i;
const horizontalBlankPattern = /^[\t ]*$/;
const trailingHorizontalPattern = /[\t ]+$/u;

export class AuthoringTextFormError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "AuthoringTextFormError";
    this.code = code;
    for (const [key, value] of Object.entries(details)) this[key] = value;
  }
}

function fail(code, message, details) {
  throw new AuthoringTextFormError(code, message, details);
}

function isRecord(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function assertPlainRecord(value, code, label) {
  if (!isRecord(value)) fail(code, `${label} must be an object`);
}

function assertExactKeys(value, required, optional, label) {
  assertPlainRecord(value, "FORM_DEFINITION_INVALID", label);
  const allowed = new Set([...required, ...optional]);
  const keys = Object.keys(value);
  if (
    required.some((key) => !Object.hasOwn(value, key)) ||
    keys.some((key) => !allowed.has(key))
  ) {
    fail(
      "FORM_DEFINITION_INVALID",
      `${label} does not have its exact closed key set`
    );
  }
}

function assertMetadata(metadata) {
  assertExactKeys(
    metadata,
    ["name"],
    ["annotations", "labels"],
    "form metadata"
  );
  if (
    typeof metadata.name !== "string" ||
    metadata.name.length > 253 ||
    !/^[a-z0-9](?:[-a-z0-9]*[a-z0-9])?(?:\.[a-z0-9](?:[-a-z0-9]*[a-z0-9])?)*$/.test(
      metadata.name
    )
  ) {
    fail("FORM_DEFINITION_INVALID", "form metadata.name is invalid");
  }
  for (const field of ["annotations", "labels"]) {
    if (!Object.hasOwn(metadata, field)) continue;
    assertPlainRecord(
      metadata[field],
      "FORM_DEFINITION_INVALID",
      `form metadata.${field}`
    );
    const entries = Object.entries(metadata[field]);
    if (
      entries.length > 64 ||
      entries.some(([key, value]) => (
        key.length < 1 ||
        key.length > 128 ||
        !/^[A-Za-z0-9](?:[A-Za-z0-9._/-]*[A-Za-z0-9])?$/.test(key) ||
        typeof value !== "string" ||
        value.length > 4096 ||
        !value.isWellFormed()
      ))
    ) {
      fail(
        "FORM_DEFINITION_INVALID",
        `form metadata.${field} is invalid`
      );
    }
  }
}

function codePointLength(value) {
  return [...value].length;
}

function assertBoundedBytes(bytes, label) {
  if (!(bytes instanceof Uint8Array)) {
    fail(
      "TEXT_BYTES_REQUIRED",
      `${label} must be supplied as a Uint8Array, not text or a path`
    );
  }
  if (bytes.byteLength > MAX_TEXT_FORM_BYTES) {
    fail(
      "TEXT_BYTE_BOUND_EXCEEDED",
      `${label} exceeds the ${MAX_TEXT_FORM_BYTES}-byte bound`
    );
  }
}

function copyBytes(bytes) {
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function decodeStrictUtf8(bytes, label) {
  assertBoundedBytes(bytes, label);
  const exact = copyBytes(bytes);
  if (
    exact.byteLength >= 3 &&
    exact[0] === 0xef &&
    exact[1] === 0xbb &&
    exact[2] === 0xbf
  ) {
    fail("TEXT_BOM_FORBIDDEN", `${label} cannot begin with a UTF-8 BOM`);
  }
  if (exact.includes(0)) {
    fail("TEXT_NUL_FORBIDDEN", `${label} cannot contain NUL`);
  }
  try {
    return utf8Decoder.decode(exact);
  } catch {
    fail("TEXT_UTF8_INVALID", `${label} is not strict UTF-8`);
  }
}

function normalizeNewlines(value) {
  return value.replace(/\r\n?|\n/gu, "\n");
}

function canonicalDecoded(bytes, label) {
  const rawText = decodeStrictUtf8(bytes, label);
  const text = normalizeNewlines(rawText);
  return Object.freeze({
    text,
    bytes: Buffer.from(text, "utf8")
  });
}

export function canonicalizeAuthoringTextInput(bytes) {
  return Buffer.from(canonicalDecoded(bytes, "authoring text input").bytes);
}

function canonicalLineText(value, label, maximumLength = 4096) {
  if (typeof value !== "string" || value.length === 0 || !/\S/u.test(value)) {
    fail("FORM_DEFINITION_INVALID", `${label} must be non-empty text`);
  }
  if (/[\r\n\u0000]/u.test(value)) {
    fail(
      "FORM_PRESENTATION_LINE_INVALID",
      `${label} must be one canonical UTF-8 line`
    );
  }
  if (!value.isWellFormed() || trailingHorizontalPattern.test(value)) {
    fail(
      "FORM_PRESENTATION_LINE_INVALID",
      `${label} must contain Unicode scalar values and no trailing horizontal whitespace`
    );
  }
  if (codePointLength(value) > maximumLength) {
    fail(
      "FORM_PRESENTATION_LINE_INVALID",
      `${label} exceeds its ${maximumLength}-character bound`
    );
  }
  if (reservedMarkerPattern.test(value)) {
    fail(
      "FORM_RESERVED_MARKER",
      `${label} cannot contain reserved protocol marker syntax`
    );
  }
  return value;
}

function canonicalBlockText(value, label, maximumLength = 4096) {
  if (typeof value !== "string" || value.length === 0 || !/\S/u.test(value)) {
    fail("FORM_DEFINITION_INVALID", `${label} must be non-empty text`);
  }
  if (/[\r\u0000]/u.test(value)) {
    fail(
      "FORM_PRESENTATION_TEXT_INVALID",
      `${label} must use canonical LF text without BOM or NUL`
    );
  }
  if (!value.isWellFormed()) {
    fail(
      "FORM_PRESENTATION_TEXT_INVALID",
      `${label} must contain only Unicode scalar values`
    );
  }
  if (codePointLength(value) > maximumLength) {
    fail(
      "FORM_PRESENTATION_TEXT_INVALID",
      `${label} exceeds its ${maximumLength}-character bound`
    );
  }
  const lines = value.split("\n");
  if (
    horizontalBlankPattern.test(lines[0]) ||
    horizontalBlankPattern.test(lines.at(-1))
  ) {
    fail(
      "FORM_PRESENTATION_TEXT_INVALID",
      `${label} cannot begin or end with a blank line`
    );
  }
  for (const line of lines) {
    if (trailingHorizontalPattern.test(line)) {
      fail(
        "FORM_PRESENTATION_TEXT_INVALID",
        `${label} cannot contain trailing horizontal whitespace`
      );
    }
    if (reservedMarkerPattern.test(line)) {
      fail(
        "FORM_RESERVED_MARKER",
        `${label} cannot contain reserved protocol marker syntax`
      );
    }
  }
  return value;
}

function assertInteger(value, label, minimum, maximum) {
  if (
    !Number.isInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    fail(
      "FORM_DEFINITION_INVALID",
      `${label} must be an integer from ${minimum} through ${maximum}`
    );
  }
}

function assertConstraintKeys(constraints, expected, fieldId) {
  assertPlainRecord(
    constraints,
    "FORM_DEFINITION_INVALID",
    `field ${fieldId} constraints`
  );
  const actual = Object.keys(constraints).sort();
  const canonical = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(canonical)) {
    fail(
      "FORM_DEFINITION_INVALID",
      `field ${fieldId} has invalid constraint keys`
    );
  }
}

function assertFieldConstraints(field) {
  const { constraints, id, type } = field;
  if (type === "paragraph") {
    assertConstraintKeys(constraints, ["minLength", "maxLength"], id);
    assertInteger(constraints.minLength, `${id}.minLength`, 0, 65536);
    assertInteger(constraints.maxLength, `${id}.maxLength`, 1, 65536);
    if (constraints.minLength > constraints.maxLength) {
      fail("FORM_CONSTRAINT_INVERTED", `field ${id} has inverted length bounds`);
    }
    return;
  }
  if (type === "string-list") {
    assertConstraintKeys(
      constraints,
      [
        "minItems",
        "maxItems",
        "itemMinLength",
        "itemMaxLength",
        "uniqueItems"
      ],
      id
    );
    assertInteger(constraints.minItems, `${id}.minItems`, 0, 1024);
    assertInteger(constraints.maxItems, `${id}.maxItems`, 1, 1024);
    assertInteger(
      constraints.itemMinLength,
      `${id}.itemMinLength`,
      0,
      4096
    );
    assertInteger(
      constraints.itemMaxLength,
      `${id}.itemMaxLength`,
      1,
      4096
    );
    if (
      constraints.uniqueItems !== true ||
      constraints.minItems > constraints.maxItems ||
      constraints.itemMinLength > constraints.itemMaxLength
    ) {
      fail("FORM_CONSTRAINT_INVERTED", `field ${id} has invalid list bounds`);
    }
    return;
  }
  if (type === "enum") {
    assertConstraintKeys(constraints, ["members"], id);
    if (
      !Array.isArray(constraints.members) ||
      constraints.members.length < 1 ||
      constraints.members.length > 128
    ) {
      fail("FORM_DEFINITION_INVALID", `field ${id} needs 1 through 128 enum members`);
    }
    const seen = new Set();
    for (const member of constraints.members) {
      canonicalLineText(member, `field ${id} enum member`, 160);
      if (member.trim() !== member) {
        fail(
          "FORM_PRESENTATION_LINE_INVALID",
          `field ${id} enum member ${JSON.stringify(member)} is not reachable after normalization`
        );
      }
      if (seen.has(member)) {
        fail("FORM_DEFINITION_INVALID", `field ${id} repeats enum member ${member}`);
      }
      seen.add(member);
    }
    if (constraints.members.includes(field.placeholder)) {
      fail(
        "FORM_PLACEHOLDER_INVALID",
        `field ${id} placeholder cannot equal an enum member`
      );
    }
    return;
  }
  if (type === "boolean") {
    assertConstraintKeys(constraints, ["trueLiteral", "falseLiteral"], id);
    if (
      constraints.trueLiteral !== "yes" ||
      constraints.falseLiteral !== "no"
    ) {
      fail(
        "FORM_DEFINITION_INVALID",
        `field ${id} boolean literals must be exactly yes and no`
      );
    }
    if (
      field.placeholder === constraints.trueLiteral ||
      field.placeholder === constraints.falseLiteral
    ) {
      fail(
        "FORM_PLACEHOLDER_INVALID",
        `field ${id} placeholder cannot equal a Boolean literal`
      );
    }
    return;
  }
  fail("FORM_DEFINITION_INVALID", `field ${id} has unknown type ${String(type)}`);
}

/**
 * Enforce the executable subset of the sealed AuthoringFormDefinition
 * contract without importing a JSON-schema implementation into the kernel.
 */
export function assertExecutableFormDefinition(formDefinition) {
  assertExactKeys(
    formDefinition,
    ["apiVersion", "kind", "metadata", "spec"],
    [],
    "form definition"
  );
  assertMetadata(formDefinition.metadata);
  assertExactKeys(
    formDefinition.spec,
    ["fields", "formDigest", "grammarVersion", "title"],
    ["introduction"],
    "form definition spec"
  );
  if (
    formDefinition.apiVersion !== "authoring.mission-kit/v1alpha1" ||
    formDefinition.kind !== "AuthoringFormDefinition" ||
    !isRecord(formDefinition.spec) ||
    formDefinition.spec.grammarVersion !== AUTHORING_TEXT_GRAMMAR_VERSION ||
    !digestPattern.test(formDefinition.spec.formDigest ?? "")
  ) {
    fail(
      "FORM_DEFINITION_INVALID",
      "form definition does not identify the sealed authoring text contract"
    );
  }
  canonicalLineText(formDefinition.spec.title, "form title", 4096);
  if (Object.hasOwn(formDefinition.spec, "introduction")) {
    canonicalBlockText(
      formDefinition.spec.introduction,
      "form introduction",
      4096
    );
  }
  const fields = formDefinition.spec.fields;
  if (!Array.isArray(fields) || fields.length < 1 || fields.length > 128) {
    fail("FORM_DEFINITION_INVALID", "form must contain 1 through 128 fields");
  }
  const seen = new Set();
  fields.forEach((field, index) => {
    assertExactKeys(
      field,
      [
        "constraints",
        "heading",
        "id",
        "ordinal",
        "placeholder",
        "required",
        "type"
      ],
      ["instruction"],
      `form field ${index + 1}`
    );
    if (
      !AUTHORING_FIELD_ID_PATTERN.test(field.id ?? "") ||
      field.id.length > 80
    ) {
      fail(
        "FORM_FIELD_ID_INVALID",
        `field ${index + 1} has an invalid field ID`
      );
    }
    if (seen.has(field.id)) {
      fail("FORM_FIELD_DUPLICATE", `form repeats field ${field.id}`, {
        fieldId: field.id
      });
    }
    seen.add(field.id);
    if (field.ordinal !== index + 1) {
      fail(
        "FORM_FIELD_ORDER_INVALID",
        `field ${field.id} ordinal differs from its array position`,
        { fieldId: field.id }
      );
    }
    canonicalLineText(field.heading, `field ${field.id} heading`, 160);
    canonicalLineText(field.placeholder, `field ${field.id} placeholder`, 160);
    if (
      field.type !== "paragraph" &&
      field.placeholder.trim() !== field.placeholder
    ) {
      fail(
        "FORM_PLACEHOLDER_INVALID",
        `field ${field.id} placeholder is not canonical under its field normalization`
      );
    }
    if (Object.hasOwn(field, "instruction")) {
      canonicalBlockText(
        field.instruction,
        `field ${field.id} instruction`,
        1000
      );
    }
    if (typeof field.required !== "boolean") {
      fail(
        "FORM_DEFINITION_INVALID",
        `field ${field.id} required must be Boolean`
      );
    }
    assertFieldConstraints(field);
  });
  if (formDefinition.spec.formDigest !== formDefinitionDigest(formDefinition)) {
    fail(
      "FORM_DIGEST_MISMATCH",
      "form definition digest differs from its canonical resource core"
    );
  }
  return formDefinition;
}

function placeholderBody(field) {
  return field.type === "string-list"
    ? [`- ${field.placeholder}`]
    : [field.placeholder];
}

function requestMarker(handle) {
  if (!handlePattern.test(handle ?? "")) {
    fail(
      "REQUEST_HANDLE_INVALID",
      "request handle must contain 8 through 64 lowercase hexadecimal characters"
    );
  }
  return `<!-- ${DEFAULT_FORM_MARKER_NAMESPACE}:v1 request=${handle} -->`;
}

function assertNoReservedMarkerLines(lines, fieldId) {
  for (const [index, line] of lines.entries()) {
    if (reservedMarkerPattern.test(line)) {
      fail(
        "RESERVED_MARKER_INJECTION",
        `field ${fieldId} contains reserved marker syntax`,
        { fieldId, bodyLine: index + 1 }
      );
    }
  }
}

function trimParagraphLines(lines) {
  const normalized = lines.map((line) => line.replace(trailingHorizontalPattern, ""));
  while (
    normalized.length > 0 &&
    horizontalBlankPattern.test(normalized[0])
  ) {
    normalized.shift();
  }
  while (
    normalized.length > 0 &&
    horizontalBlankPattern.test(normalized.at(-1))
  ) {
    normalized.pop();
  }
  return normalized;
}

function fieldConstraintFailure(field, message) {
  fail("FIELD_CONSTRAINT_VIOLATION", `field ${field.id} ${message}`, {
    fieldId: field.id
  });
}

function absentField(field) {
  if (field.required) {
    fail("FIELD_REQUIRED", `field ${field.id} is required`, {
      fieldId: field.id
    });
  }
  return Object.freeze({ present: false });
}

function normalizeParagraph(field, lines) {
  const trimmed = trimParagraphLines(lines);
  if (trimmed.length === 0) return absentField(field);
  const value = trimmed.join("\n");
  const length = codePointLength(value);
  if (
    length < field.constraints.minLength ||
    length > field.constraints.maxLength
  ) {
    fieldConstraintFailure(field, "is outside its paragraph length bounds");
  }
  return Object.freeze({ present: true, value });
}

function normalizeStringList(field, lines) {
  const values = [];
  for (const [index, line] of lines.entries()) {
    if (horizontalBlankPattern.test(line)) continue;
    if (!line.startsWith("- ")) {
      fail(
        "FIELD_LIST_SYNTAX_INVALID",
        `field ${field.id} line ${index + 1} must begin with '- '`,
        { fieldId: field.id, bodyLine: index + 1 }
      );
    }
    const item = line.slice(2).trim();
    if (item.length === 0) {
      fail(
        "FIELD_LIST_ITEM_EMPTY",
        `field ${field.id} contains an empty list item`,
        { fieldId: field.id, bodyLine: index + 1 }
      );
    }
    const length = codePointLength(item);
    if (
      length < field.constraints.itemMinLength ||
      length > field.constraints.itemMaxLength
    ) {
      fieldConstraintFailure(field, `item ${index + 1} is outside its length bounds`);
    }
    values.push(item);
  }
  if (values.length === 0) return absentField(field);
  if (new Set(values).size !== values.length) {
    fail(
      "FIELD_LIST_ITEM_DUPLICATE",
      `field ${field.id} contains duplicate list items`,
      { fieldId: field.id }
    );
  }
  if (
    values.length < field.constraints.minItems ||
    values.length > field.constraints.maxItems
  ) {
    fieldConstraintFailure(field, "is outside its list cardinality bounds");
  }
  return Object.freeze({ present: true, value: Object.freeze(values) });
}

function oneTrimmedLine(field, lines, invalidCode, label) {
  const nonBlank = lines.filter((line) => !horizontalBlankPattern.test(line));
  if (nonBlank.length === 0) return absentField(field);
  if (nonBlank.length !== 1) {
    fail(invalidCode, `field ${field.id} must contain exactly one ${label} line`, {
      fieldId: field.id
    });
  }
  const value = nonBlank[0].trim();
  if (value.length === 0) return absentField(field);
  return Object.freeze({ present: true, value });
}

function normalizeEnum(field, lines) {
  const normalized = oneTrimmedLine(
    field,
    lines,
    "FIELD_ENUM_INVALID",
    "enum"
  );
  if (!normalized.present) return normalized;
  if (!field.constraints.members.includes(normalized.value)) {
    fail(
      "FIELD_ENUM_INVALID",
      `field ${field.id} is not a declared enum member`,
      { fieldId: field.id }
    );
  }
  return normalized;
}

function normalizeBoolean(field, lines) {
  const normalized = oneTrimmedLine(
    field,
    lines,
    "FIELD_BOOLEAN_INVALID",
    "boolean"
  );
  if (!normalized.present) return normalized;
  if (normalized.value === field.constraints.trueLiteral) {
    return Object.freeze({ present: true, value: true });
  }
  if (normalized.value === field.constraints.falseLiteral) {
    return Object.freeze({ present: true, value: false });
  }
  fail(
    "FIELD_BOOLEAN_INVALID",
    `field ${field.id} must be exactly yes or no`,
    { fieldId: field.id }
  );
}

function normalizeField(field, lines) {
  assertNoReservedMarkerLines(lines, field.id);
  const placeholder = placeholderBody(field);
  if (placeholder.some((line) => lines.includes(line))) {
    fail(
      "FIELD_PLACEHOLDER_UNEDITED",
      `field ${field.id} still contains its generated placeholder`,
      { fieldId: field.id }
    );
  }
  let normalizedPlaceholderCandidate;
  if (field.type === "paragraph") {
    const trimmed = trimParagraphLines(lines);
    normalizedPlaceholderCandidate =
      trimmed.length === 0 ? undefined : trimmed.join("\n");
  } else if (field.type === "string-list") {
    const nonBlank = lines.filter(
      (line) => !horizontalBlankPattern.test(line)
    );
    normalizedPlaceholderCandidate =
      nonBlank.length > 0 &&
      nonBlank.every((line) => line.startsWith("- "))
        ? nonBlank.map((line) => line.slice(2).trim())
        : undefined;
  } else if (field.type === "enum" || field.type === "boolean") {
    const nonBlank = lines.filter(
      (line) => !horizontalBlankPattern.test(line)
    );
    normalizedPlaceholderCandidate =
      nonBlank.length === 1 ? nonBlank[0].trim() : undefined;
  }
  const placeholderSemanticValue =
    field.type === "string-list"
      ? [field.placeholder]
      : field.placeholder;
  if (
    normalizedPlaceholderCandidate !== undefined &&
    JSON.stringify(normalizedPlaceholderCandidate) ===
      JSON.stringify(placeholderSemanticValue)
  ) {
    fail(
      "FIELD_PLACEHOLDER_UNEDITED",
      `field ${field.id} still contains its normalized generated placeholder`,
      { fieldId: field.id }
    );
  }
  switch (field.type) {
    case "paragraph":
      return normalizeParagraph(field, lines);
    case "string-list":
      return normalizeStringList(field, lines);
    case "enum":
      return normalizeEnum(field, lines);
    case "boolean":
      return normalizeBoolean(field, lines);
    default:
      fail("FORM_DEFINITION_INVALID", `field ${field.id} has an unknown type`);
  }
}

function canonicalFieldBody(field, value, present) {
  if (!present) {
    if (field.required) {
      fail("FIELD_REQUIRED", `field ${field.id} is required`, {
        fieldId: field.id
      });
    }
    return [];
  }
  let lines;
  if (field.type === "paragraph") {
    if (
      typeof value !== "string" ||
      !value.isWellFormed() ||
      /[\r\u0000]/u.test(value)
    ) {
      fail("FIELD_VALUE_NON_CANONICAL", `field ${field.id} is not canonical text`, {
        fieldId: field.id
      });
    }
    lines = value.split("\n");
  } else if (field.type === "string-list") {
    if (!Array.isArray(value)) {
      fail("FIELD_VALUE_NON_CANONICAL", `field ${field.id} must be an array`, {
        fieldId: field.id
      });
    }
    lines = value.map((item) => {
      if (
        typeof item !== "string" ||
        item.trim() !== item ||
        item.length === 0 ||
        !item.isWellFormed() ||
        /[\r\n\u0000]/u.test(item)
      ) {
        fail(
          "FIELD_VALUE_NON_CANONICAL",
          `field ${field.id} contains a non-canonical list item`,
          { fieldId: field.id }
        );
      }
      return `- ${item}`;
    });
  } else if (field.type === "enum") {
    if (typeof value !== "string") {
      fail("FIELD_VALUE_NON_CANONICAL", `field ${field.id} must be text`, {
        fieldId: field.id
      });
    }
    lines = [value];
  } else if (field.type === "boolean") {
    if (typeof value !== "boolean") {
      fail("FIELD_VALUE_NON_CANONICAL", `field ${field.id} must be Boolean`, {
        fieldId: field.id
      });
    }
    lines = [
      value
        ? field.constraints.trueLiteral
        : field.constraints.falseLiteral
    ];
  } else {
    fail("FORM_DEFINITION_INVALID", `field ${field.id} has an unknown type`);
  }
  const normalized = normalizeField(field, lines);
  if (!normalized.present || JSON.stringify(normalized.value) !== JSON.stringify(value)) {
    fail(
      "FIELD_VALUE_NON_CANONICAL",
      `field ${field.id} differs from its canonical normalized value`,
      { fieldId: field.id }
    );
  }
  return lines;
}

function formLines({
  formDefinition,
  contextClosure,
  requestHandle,
  mode,
  values
}) {
  assertExecutableFormDefinition(formDefinition);
  const lines = [
    requestMarker(requestHandle),
    "",
    `# ${formDefinition.spec.title}`
  ];
  if (contextClosure !== undefined) {
    if (
      !isRecord(contextClosure) ||
      contextClosure.apiVersion !== "authoring.mission-kit/v1alpha1" ||
      contextClosure.kind !== "ContextClosure" ||
      !Array.isArray(contextClosure.spec?.layers)
    ) {
      fail(
        "FORM_CONTEXT_INVALID",
        "text-form context must be one ContextClosure resource"
      );
    }
    const visibleContext = contextClosure.spec.layers.map((layer, index) => {
      if (
        !isRecord(layer) ||
        layer.ordinal !== index + 1 ||
        typeof layer.role !== "string" ||
        !Object.hasOwn(layer, "selectedValue")
      ) {
        fail(
          "FORM_CONTEXT_INVALID",
          "text-form context layers must be ordered, role-labelled selected values"
        );
      }
      return {
        ordinal: layer.ordinal,
        role: layer.role,
        value: layer.selectedValue
      };
    });
    // Escaping '<' prevents selected context text from materializing an HTML
    // protocol marker while preserving its exact JSON string value.
    let contextJson;
    try {
      contextJson = JSON.stringify(stableValue(visibleContext))
        .replaceAll("<", "\\u003c");
    } catch {
      fail(
        "FORM_CONTEXT_INVALID",
        "text-form selected context must contain canonical JSON values"
      );
    }
    lines.push("", "## Context", "```json", contextJson, "```");
  }
  if (Object.hasOwn(formDefinition.spec, "introduction")) {
    lines.push("", ...formDefinition.spec.introduction.split("\n"));
  }
  const declared = new Set(formDefinition.spec.fields.map((field) => field.id));
  if (mode === "populated") {
    assertPlainRecord(values, "FIELD_VALUES_INVALID", "field values");
    for (const key of Object.keys(values)) {
      if (!declared.has(key)) {
        fail("FIELD_UNDECLARED", `field values contain undeclared field ${key}`, {
          fieldId: key
        });
      }
    }
  }
  for (const field of formDefinition.spec.fields) {
    lines.push("", `## ${field.heading}`);
    if (Object.hasOwn(field, "instruction")) {
      lines.push(...field.instruction.split("\n"));
    }
    lines.push(`<!-- field:${field.id} type=${field.type} -->`);
    if (mode === "blank") {
      lines.push(...placeholderBody(field));
    } else {
      const present = Object.hasOwn(values, field.id);
      lines.push(...canonicalFieldBody(field, values[field.id], present));
    }
    lines.push(`<!-- /field:${field.id} -->`);
  }
  return lines;
}

function encodeCanonicalLines(lines) {
  const bytes = Buffer.from(`${lines.join("\n")}\n`, "utf8");
  if (bytes.byteLength > MAX_TEXT_FORM_BYTES) {
    fail(
      "TEXT_BYTE_BOUND_EXCEEDED",
      `rendered text form exceeds the ${MAX_TEXT_FORM_BYTES}-byte bound`
    );
  }
  return bytes;
}

export function renderBlankTextForm({
  formDefinition,
  contextClosure,
  requestHandle
}) {
  return encodeCanonicalLines(formLines({
    formDefinition,
    contextClosure,
    requestHandle,
    mode: "blank",
    values: undefined
  }));
}

export function renderPopulatedTextForm({
  formDefinition,
  contextClosure,
  requestHandle,
  values
}) {
  return encodeCanonicalLines(formLines({
    formDefinition,
    contextClosure,
    requestHandle,
    mode: "populated",
    values
  }));
}

function markerLike(line) {
  return reservedMarkerPattern.test(line);
}

function scanTextStructure(text, formDefinition, expectedHandle, label) {
  const lines = text.split("\n");
  const first = requestMarkerPattern.exec(lines[0] ?? "");
  if (!first) {
    fail(
      "REQUEST_MARKER_INVALID",
      `${label} does not begin with one canonical request marker`,
      { line: 1 }
    );
  }
  if (first[1] !== DEFAULT_FORM_MARKER_NAMESPACE) {
    fail(
      "REQUEST_MARKER_INVALID",
      `${label} uses an unregistered request marker namespace`,
      { line: 1 }
    );
  }
  if (expectedHandle !== undefined && first[2] !== expectedHandle) {
    fail(
      "REQUEST_MARKER_MISMATCH",
      `${label} request handle differs from its assignment`,
      { line: 1 }
    );
  }
  const fields = formDefinition.spec.fields;
  const byId = new Map(fields.map((field, index) => [field.id, { field, index }]));
  const seen = new Set();
  const regions = [];
  let active = null;
  let expectedIndex = 0;
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    const open = openFieldMarkerPattern.exec(line);
    const close = closeFieldMarkerPattern.exec(line);
    const anotherRequest = requestMarkerPattern.exec(line);
    if (anotherRequest) {
      fail(
        "REQUEST_MARKER_DUPLICATE",
        `${label} contains another request marker`,
        { line: index + 1 }
      );
    }
    if (open) {
      const id = open[1];
      if (active) {
        fail(
          "FIELD_MARKER_NESTED",
          `${label} nests field ${id} inside field ${active.id}`,
          { fieldId: id, line: index + 1 }
        );
      }
      const declared = byId.get(id);
      if (!declared) {
        fail(
          "FIELD_UNDECLARED",
          `${label} contains undeclared field ${id}`,
          { fieldId: id, line: index + 1 }
        );
      }
      if (seen.has(id)) {
        fail(
          "FIELD_MARKER_DUPLICATE",
          `${label} repeats field ${id}`,
          { fieldId: id, line: index + 1 }
        );
      }
      if (declared.index !== expectedIndex) {
        fail(
          "FIELD_MARKER_REORDERED",
          `${label} field ${id} is out of declared order`,
          { fieldId: id, line: index + 1 }
        );
      }
      if (open[2] !== declared.field.type) {
        fail(
          "FIELD_MARKER_TYPE_MISMATCH",
          `${label} field ${id} marker has the wrong type`,
          { fieldId: id, line: index + 1 }
        );
      }
      active = { id, openLine: index, field: declared.field };
      seen.add(id);
      continue;
    }
    if (close) {
      const id = close[1];
      if (!active || active.id !== id) {
        fail(
          "FIELD_MARKER_CLOSE_MISMATCH",
          `${label} closes field ${id} outside its matching region`,
          { fieldId: id, line: index + 1 }
        );
      }
      regions.push(Object.freeze({
        field: active.field,
        openLine: active.openLine,
        closeLine: index,
        bodyLines: Object.freeze(lines.slice(active.openLine + 1, index))
      }));
      active = null;
      expectedIndex += 1;
      continue;
    }
    if (markerLike(line)) {
      fail(
        "RESERVED_MARKER_INJECTION",
        `${label} contains malformed or injected marker syntax`,
        { line: index + 1 }
      );
    }
  }
  if (active) {
    fail(
      "FIELD_MARKER_MISSING_CLOSE",
      `${label} does not close field ${active.id}`,
      { fieldId: active.id }
    );
  }
  if (expectedIndex !== fields.length) {
    fail(
      "FIELD_MARKER_MISSING",
      `${label} omits field ${fields[expectedIndex].id}`,
      { fieldId: fields[expectedIndex].id }
    );
  }
  return Object.freeze({
    handle: first[2],
    markerNamespace: first[1],
    lines,
    regions: Object.freeze(regions)
  });
}

function skeletonOf(structure) {
  const output = [];
  let cursor = 0;
  for (const region of structure.regions) {
    output.push(...structure.lines.slice(cursor, region.openLine + 1));
    output.push(`\u0000editable:${region.field.id}\u0000`);
    cursor = region.closeLine;
  }
  output.push(...structure.lines.slice(cursor));
  return output.join("\n");
}

export function parseTextForm({
  formDefinition,
  blankViewBytes,
  submittedBytes,
  expectedHandle
}) {
  assertExecutableFormDefinition(formDefinition);
  if (!handlePattern.test(expectedHandle ?? "")) {
    fail("REQUEST_HANDLE_INVALID", "expected request handle is invalid");
  }
  const blank = canonicalDecoded(blankViewBytes, "blank text view");
  const submitted = canonicalDecoded(submittedBytes, "submitted text form");
  const blankStructure = scanTextStructure(
    blank.text,
    formDefinition,
    expectedHandle,
    "blank text view"
  );
  for (const region of blankStructure.regions) {
    if (
      JSON.stringify(region.bodyLines) !==
        JSON.stringify(placeholderBody(region.field))
    ) {
      fail(
        "BLANK_VIEW_PLACEHOLDER_MISMATCH",
        `blank text view field ${region.field.id} differs from its declared placeholder`,
        { fieldId: region.field.id }
      );
    }
  }
  const submittedStructure = scanTextStructure(
    submitted.text,
    formDefinition,
    expectedHandle,
    "submitted text form"
  );
  if (
    submittedStructure.markerNamespace !== blankStructure.markerNamespace ||
    skeletonOf(submittedStructure) !== skeletonOf(blankStructure)
  ) {
    fail(
      "IMMUTABLE_SKELETON_CHANGED",
      "submitted bytes outside editable field bodies differ from the blank view"
    );
  }
  const normalizedValues = {};
  submittedStructure.regions.forEach((region) => {
    const normalized = normalizeField(region.field, [...region.bodyLines]);
    if (normalized.present) {
      normalizedValues[region.field.id] = normalized.value;
    }
  });
  return Object.freeze({
    requestHandle: expectedHandle,
    normalizedValues: Object.freeze(normalizedValues),
    canonicalBytes: submitted.bytes,
    newlineNormalized:
      !submitted.bytes.equals(copyBytes(submittedBytes))
  });
}

export function validateAuthoringFieldValues({
  formDefinition,
  normalizedValues
}) {
  const requestHandle = "00000000";
  const blankViewBytes = renderBlankTextForm({
    formDefinition,
    requestHandle
  });
  const submittedBytes = renderPopulatedTextForm({
    formDefinition,
    requestHandle,
    values: normalizedValues
  });
  return parseTextForm({
    formDefinition,
    blankViewBytes,
    submittedBytes,
    expectedHandle: requestHandle
  }).normalizedValues;
}

export function exactTextContent(bytes) {
  assertBoundedBytes(bytes, "text content");
  const exact = copyBytes(bytes);
  decodeStrictUtf8(exact, "text content");
  return Object.freeze({
    mediaType: TEXT_FORM_MEDIA_TYPE,
    encoding: "base64",
    byteLength: exact.byteLength,
    data: exact.toString("base64")
  });
}

export function textContentBytes(content) {
  if (
    !isRecord(content) ||
    Object.keys(content).sort().join("\u0000") !==
      ["byteLength", "data", "encoding", "mediaType"].sort().join("\u0000") ||
    content.mediaType !== TEXT_FORM_MEDIA_TYPE ||
    content.encoding !== "base64" ||
    !Number.isInteger(content.byteLength) ||
    content.byteLength < 0 ||
    content.byteLength > MAX_TEXT_FORM_BYTES ||
    typeof content.data !== "string"
  ) {
    fail(
      "TEXT_CONTENT_INVALID",
      "text content must be one exact closed text/plain UTF-8 byte carrier"
    );
  }
  const bytes = Buffer.from(content.data, "base64");
  if (
    bytes.toString("base64") !== content.data ||
    bytes.byteLength !== content.byteLength
  ) {
    fail(
      "TEXT_CONTENT_INVALID",
      "text content base64 or byte length is non-canonical"
    );
  }
  decodeStrictUtf8(bytes, "text content");
  return bytes;
}

export function requestHandleFromBlankView(bytes) {
  const { text } = canonicalDecoded(bytes, "blank text view");
  const first = requestMarkerPattern.exec(text.split("\n")[0] ?? "");
  if (!first) {
    fail(
      "REQUEST_MARKER_INVALID",
      "blank text view does not begin with one canonical request marker"
    );
  }
  return first[2];
}

export function requestDigestHex(requestDigest) {
  if (!digestPattern.test(requestDigest ?? "")) {
    fail("REQUEST_DIGEST_INVALID", "request digest must be a canonical sha256 digest");
  }
  return requestDigest.slice("sha256:".length);
}
