function issue(code, path, message) {
  return { code, path, message };
}

function canonicalConstraintKey(constraint) {
  return `${constraint.type}:${[...constraint.optionIds].sort().join(",")}`;
}

function hasSatisfyingMinimumSelection(optionIds, minimum, constraints) {
  const conflicts = new Map(optionIds.map((optionId) => [optionId, new Set()]));

  for (const constraint of constraints) {
    for (let leftIndex = 0; leftIndex < constraint.optionIds.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < constraint.optionIds.length; rightIndex += 1) {
        const left = constraint.optionIds[leftIndex];
        const right = constraint.optionIds[rightIndex];
        conflicts.get(left).add(right);
        conflicts.get(right).add(left);
      }
    }
  }

  function search(startIndex, selected) {
    if (selected.length === minimum) return true;
    if (selected.length + optionIds.length - startIndex < minimum) return false;

    for (let optionIndex = startIndex; optionIndex < optionIds.length; optionIndex += 1) {
      const candidate = optionIds[optionIndex];
      if (selected.some((selectedId) => conflicts.get(candidate).has(selectedId))) {
        continue;
      }

      selected.push(candidate);
      if (search(optionIndex + 1, selected)) return true;
      selected.pop();
    }

    return false;
  }

  return search(0, []);
}

function at(pathPrefix, relativePath) {
  return `${pathPrefix}${relativePath}`;
}

export function validateChoiceResponseSemantics(response, pathPrefix = "") {
  const issues = [];
  const options = Array.isArray(response?.options) ? response.options : [];
  const constraints = Array.isArray(response?.constraints) ? response.constraints : [];
  const optionIds = options.map((option) => option.id);
  const knownOptionIds = new Set(optionIds);
  let hasDuplicateOptionId = false;
  let hasUnknownConstraintOption = false;

  for (const [index, optionId] of optionIds.entries()) {
    if (optionIds.indexOf(optionId) !== index) {
      hasDuplicateOptionId = true;
      issues.push(issue(
        "DUPLICATE_OPTION_ID",
        at(pathPrefix, `/options/${index}/id`),
        `option ID ${JSON.stringify(optionId)} is not unique`
      ));
    }
  }

  const minimum = response?.cardinality?.minimum;
  const maximum = response?.cardinality?.maximum;

  if (Number.isInteger(minimum) && Number.isInteger(maximum) && minimum > maximum) {
    issues.push(issue(
      "CARDINALITY_RANGE_INVERTED",
      at(pathPrefix, "/cardinality"),
      "minimum selections must not exceed maximum selections"
    ));
  }

  if (Number.isInteger(maximum) && maximum > options.length) {
    issues.push(issue(
      "CARDINALITY_EXCEEDS_OPTIONS",
      at(pathPrefix, "/cardinality/maximum"),
      "maximum selections must not exceed the number of available options"
    ));
  }

  if (maximum === 1 && constraints.length > 0) {
    issues.push(issue(
      "REDUNDANT_SINGLE_CHOICE_CONSTRAINT",
      at(pathPrefix, "/constraints"),
      "single-choice cardinality already makes mutually-exclusive constraints redundant"
    ));
  }

  const constraintKeys = new Set();
  for (const [constraintIndex, constraint] of constraints.entries()) {
    const constraintOptionIds = Array.isArray(constraint?.optionIds) ? constraint.optionIds : [];

    for (const [optionIndex, optionId] of constraintOptionIds.entries()) {
      if (!knownOptionIds.has(optionId)) {
        hasUnknownConstraintOption = true;
        issues.push(issue(
          "UNKNOWN_CONSTRAINT_OPTION",
          at(pathPrefix, `/constraints/${constraintIndex}/optionIds/${optionIndex}`),
          `constraint references unknown option ID ${JSON.stringify(optionId)}`
        ));
      }
    }

    if (constraint?.type === "MutuallyExclusive") {
      const key = canonicalConstraintKey(constraint);
      if (constraintKeys.has(key)) {
        issues.push(issue(
          "DUPLICATE_CONSTRAINT",
          at(pathPrefix, `/constraints/${constraintIndex}`),
          "an equivalent mutually-exclusive constraint is already declared"
        ));
      }
      constraintKeys.add(key);
    }
  }

  const cardinalityCanBeEvaluated =
    Number.isInteger(minimum) &&
    Number.isInteger(maximum) &&
    minimum <= maximum &&
    maximum <= options.length;

  if (
    cardinalityCanBeEvaluated &&
    !hasDuplicateOptionId &&
    !hasUnknownConstraintOption &&
    !hasSatisfyingMinimumSelection(optionIds, minimum, constraints)
  ) {
    issues.push(issue(
      "UNSATISFIABLE_CHOICE",
      at(pathPrefix, ""),
      "no selection satisfies the minimum cardinality and all declared constraints"
    ));
  }

  return issues;
}

export function validateQuestionSemantics(question) {
  if (question?.spec?.response?.type !== "Choice") {
    return [];
  }
  return validateChoiceResponseSemantics(question.spec.response, "/spec/response");
}
