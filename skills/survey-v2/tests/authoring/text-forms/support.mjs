import assert from "node:assert/strict";

import {
  formDefinitionDigest
} from "../../../source/authoring/kernel/digests.mjs";
import {
  AUTHORING_FIELD_ID_PATTERN,
  AuthoringTextFormError,
  assertExecutableFormDefinition,
  canonicalizeAuthoringTextInput,
  parseTextForm,
  renderBlankTextForm,
  renderPopulatedTextForm
} from "../../../source/authoring/kernel/text-forms.mjs";

export {
  AUTHORING_FIELD_ID_PATTERN,
  assertExecutableFormDefinition,
  canonicalizeAuthoringTextInput,
  parseTextForm,
  renderBlankTextForm,
  renderPopulatedTextForm
};

export const REQUEST_HANDLE = "0123456789abcdef";
export const OTHER_REQUEST_HANDLE = "fedcba9876543210";

const ZERO_DIGEST = `sha256:${"0".repeat(64)}`;

function mergeField(base, overrides) {
  const field = {
    ...base,
    ...structuredClone(overrides)
  };
  if (Object.hasOwn(base, "constraints")) {
    field.constraints = {
      ...base.constraints,
      ...(overrides.constraints ?? {})
    };
  }
  return field;
}

export function paragraphField(overrides = {}) {
  return mergeField(
    {
      id: "summary",
      heading: "Summary",
      instruction: "Write a concise summary.",
      type: "paragraph",
      required: true,
      placeholder: "Replace this summary",
      constraints: {
        minLength: 1,
        maxLength: 200
      }
    },
    overrides
  );
}

export function stringListField(overrides = {}) {
  return mergeField(
    {
      id: "items",
      heading: "Items",
      instruction: "Write one item on each Markdown list line.",
      type: "string-list",
      required: true,
      placeholder: "Replace with one item per line",
      constraints: {
        minItems: 1,
        maxItems: 4,
        itemMinLength: 1,
        itemMaxLength: 40,
        uniqueItems: true
      }
    },
    overrides
  );
}

export function enumField(overrides = {}) {
  return mergeField(
    {
      id: "priority",
      heading: "Priority",
      instruction: "Choose low, medium, or high.",
      type: "enum",
      required: true,
      placeholder: "Replace with low, medium, or high",
      constraints: {
        members: ["low", "medium", "high"]
      }
    },
    overrides
  );
}

export function booleanField(overrides = {}) {
  return mergeField(
    {
      id: "approved",
      heading: "Approved",
      instruction: "Answer exactly yes or no.",
      type: "boolean",
      required: true,
      placeholder: "Replace with yes or no",
      constraints: {
        trueLiteral: "yes",
        falseLiteral: "no"
      }
    },
    overrides
  );
}

export function sealForm(formDefinition) {
  const sealed = structuredClone(formDefinition);
  sealed.spec.formDigest = ZERO_DIGEST;
  sealed.spec.formDigest = formDefinitionDigest(sealed);
  return sealed;
}

export function makeForm({
  fields = [paragraphField()],
  title = "K11 text form",
  introduction = "Complete each field without changing the surrounding form."
} = {}) {
  const spec = {
    formDigest: ZERO_DIGEST,
    grammarVersion: "mission-kit-authoring-text/v1",
    title,
    fields: fields.map((field, index) => ({
      ...structuredClone(field),
      ordinal: index + 1
    }))
  };
  if (introduction !== undefined) spec.introduction = introduction;
  return sealForm({
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringFormDefinition",
    metadata: {
      name: "k11-text-form"
    },
    spec
  });
}

export function makeAllTypesForm() {
  return makeForm({
    fields: [
      paragraphField({
        id: "summary_text",
        heading: "Summary text"
      }),
      stringListField({
        id: "key-points",
        heading: "Key points",
        required: false
      }),
      enumField({
        id: "priority.level",
        heading: "Priority level"
      }),
      booleanField()
    ]
  });
}

export function renderBlank(formDefinition, contextClosure) {
  return renderBlankTextForm({
    formDefinition,
    contextClosure,
    requestHandle: REQUEST_HANDLE
  });
}

export function renderPopulated(formDefinition, values, contextClosure) {
  return renderPopulatedTextForm({
    formDefinition,
    contextClosure,
    requestHandle: REQUEST_HANDLE,
    values
  });
}

export function editFieldBody(bytes, fieldId, bodyLines) {
  const text = Buffer.from(bytes).toString("utf8");
  const openPrefix = `<!-- field:${fieldId} `;
  const openStart = text.indexOf(openPrefix);
  assert.notEqual(openStart, -1, `opening marker for ${fieldId} must exist`);
  const bodyStart = text.indexOf("\n", openStart) + 1;
  assert.notEqual(bodyStart, 0, `opening marker for ${fieldId} must end`);
  const closeMarker = `<!-- /field:${fieldId} -->`;
  const closeStart = text.indexOf(closeMarker, bodyStart);
  assert.notEqual(closeStart, -1, `closing marker for ${fieldId} must exist`);
  const replacement =
    bodyLines.length === 0 ? "" : `${bodyLines.join("\n")}\n`;
  return Buffer.from(
    `${text.slice(0, bodyStart)}${replacement}${text.slice(closeStart)}`,
    "utf8"
  );
}

export function parseEditedBody(formDefinition, fieldId, bodyLines) {
  const blankViewBytes = renderBlank(formDefinition);
  return parseTextForm({
    formDefinition,
    blankViewBytes,
    submittedBytes: editFieldBody(blankViewBytes, fieldId, bodyLines),
    expectedHandle: REQUEST_HANDLE
  });
}

export function assertErrorCode(callback, expectedCode) {
  let caught;
  try {
    callback();
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof AuthoringTextFormError, "expected an authoring text-form error");
  assert.equal(caught.code, expectedCode);
  return caught;
}
