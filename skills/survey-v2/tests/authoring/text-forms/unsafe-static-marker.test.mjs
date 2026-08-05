import test from "node:test";

import {
  assertErrorCode,
  enumField,
  makeForm,
  paragraphField,
  renderBlank
} from "./support.mjs";

test("form-authored static text cannot materialize reserved protocol markers", () => {
  const fieldMarker = "<!-- field:rogue type=paragraph -->";
  const requestMarker =
    "<!-- mission-kit-authoring-text:v1 request=01234567 -->";
  const unsafeForms = [
    () => makeForm({ title: `Unsafe ${fieldMarker}` }),
    () => makeForm({ introduction: `Unsafe\n${requestMarker}` }),
    () =>
      makeForm({
        fields: [paragraphField({ heading: `Unsafe ${fieldMarker}` })]
      }),
    () =>
      makeForm({
        fields: [paragraphField({ instruction: `Unsafe\n${requestMarker}` })]
      }),
    () =>
      makeForm({
        fields: [paragraphField({ placeholder: fieldMarker })]
      }),
    () =>
      makeForm({
        fields: [
          enumField({
            constraints: {
              members: ["low", fieldMarker]
            }
          })
        ]
      })
  ];

  for (const createForm of unsafeForms) {
    assertErrorCode(
      () => renderBlank(createForm()),
      "FORM_RESERVED_MARKER"
    );
  }
});
