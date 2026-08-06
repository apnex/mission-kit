function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, required, optional = []) {
  if (!isRecord(value)) return false;
  const allowed = new Set([...required, ...optional]);
  const keys = Object.keys(value);
  return (
    required.every((key) => Object.hasOwn(value, key)) &&
    keys.every((key) => allowed.has(key))
  );
}

function fail(message) {
  throw new TypeError(message);
}

function selection(recipe, ordinal, role, paths) {
  const value = recipe?.sourceSelections?.[ordinal - 1];
  if (
    !exactKeys(value, [
      "ordinal",
      "role",
      "sourceReference",
      "sourceIntegrityDigest",
      "selectedValues",
    ]) ||
    value.ordinal !== ordinal ||
    value.role !== role ||
    !Array.isArray(value.selectedValues) ||
    value.selectedValues.length !== paths.length ||
    value.selectedValues.some(
      (entry, index) =>
        !exactKeys(entry, ["path", "value"]) ||
        entry.path !== paths[index],
    )
  ) {
    fail(`current-question recipe selection ${ordinal} is invalid`);
  }
  return value.selectedValues.map(({ value: selected }) =>
    structuredClone(selected));
}

function nonempty(value, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    !/\S/u.test(value)
  ) {
    fail(`${label} must be nonempty text`);
  }
  return value;
}

/**
 * Pure dormant renderer. It receives only a closed persisted recipe and has
 * no resolver, workspace, inventory, filesystem, clock, or network access.
 */
export function renderCurrentQuestionPresentation(recipe) {
  if (
    !exactKeys(recipe, [
      "$schema",
      "schemaVersion",
      "viewKind",
      "recipeDigest",
      "instrument",
      "generationContext",
      "unit",
      "sourceSelections",
      "projection",
    ]) ||
    recipe.$schema !==
      "urn:mission-kit:survey-v2:schema:director-projection-recipe:v1" ||
    recipe.schemaVersion !== "1.0.0" ||
    recipe.viewKind !== "question" ||
    recipe.unit?.slot !== 1 ||
    recipe.unit?.questionOrdinal !== 1 ||
    !Array.isArray(recipe.sourceSelections) ||
    recipe.sourceSelections.length !== 4
  ) {
    fail("current-question renderer requires one closed Q1 recipe");
  }
  const [[surveySynopsis], [roundSynopsis], [questionSynopsis]] = [
    selection(recipe, 1, "survey-frame", ["/spec/synopsis"]),
    selection(recipe, 2, "round-frame", ["/spec/synopsis"]),
    selection(recipe, 3, "question-frame", ["/spec/synopsis"]),
  ];
  const [prompt, options, cardinality] = selection(
    recipe,
    4,
    "question",
    [
      "/spec/prompt",
      "/spec/response/options",
      "/spec/response/cardinality",
    ],
  );
  if (
    !exactKeys(prompt, ["text"], ["instruction"]) ||
    !Array.isArray(options) ||
    !exactKeys(cardinality, ["minimum", "maximum"])
  ) {
    fail("current-question recipe contains invalid selected Question values");
  }
  const presentation = {
    $schema:
      "urn:mission-kit:survey-v2:schema:question-presentation:v2",
    schemaVersion: "2.0.0",
    kind: "question",
    questionId: "Q1",
    context: {
      surveySynopsis: nonempty(surveySynopsis, "survey synopsis"),
      roundSynopsis: nonempty(roundSynopsis, "round synopsis"),
      questionSynopsis:
        nonempty(questionSynopsis, "question synopsis"),
    },
    prompt: structuredClone(prompt),
    options: structuredClone(options),
    responseGuidance: {
      syntax: "Pick one or more option letters.",
      minimum: cardinality.minimum,
      maximum: cardinality.maximum,
    },
  };
  return Object.freeze(presentation);
}
