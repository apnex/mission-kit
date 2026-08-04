function issue(code, path, message) {
  return { code, path, message };
}

function duplicateStringIssues(values, pathPrefix, code, noun) {
  const issues = [];
  const seen = new Set();

  for (const [index, value] of values.entries()) {
    if (typeof value !== "string") continue;
    if (seen.has(value)) {
      issues.push(issue(
        code,
        `${pathPrefix}/${index}`,
        `${noun} ${JSON.stringify(value)} is not unique`
      ));
    }
    seen.add(value);
  }

  return issues;
}

export function validateContextFrameSemantics(contextFrame) {
  const spec = contextFrame?.spec;
  const included = Array.isArray(spec?.scope?.included) ? spec.scope.included : [];
  const excluded = Array.isArray(spec?.scope?.excluded) ? spec.scope.excluded : [];
  const givens = Array.isArray(spec?.givens) ? spec.givens : [];
  const terms = Array.isArray(spec?.terms) ? spec.terms : [];
  const issues = [
    ...duplicateStringIssues(
      included,
      "/spec/scope/included",
      "DUPLICATE_INCLUDED_BOUNDARY",
      "included boundary"
    ),
    ...duplicateStringIssues(
      excluded,
      "/spec/scope/excluded",
      "DUPLICATE_EXCLUDED_BOUNDARY",
      "excluded boundary"
    )
  ];

  const includedBoundaries = new Set(included.filter((value) => typeof value === "string"));
  for (const [index, boundary] of excluded.entries()) {
    if (typeof boundary === "string" && includedBoundaries.has(boundary)) {
      issues.push(issue(
        "CROSS_BOUNDARY_SCOPE_STATEMENT",
        `/spec/scope/excluded/${index}`,
        `scope statement ${JSON.stringify(boundary)} cannot be both included and excluded`
      ));
    }
  }

  issues.push(...duplicateStringIssues(
    givens.map((given) => given?.text),
    "/spec/givens",
    "DUPLICATE_GIVEN",
    "given text"
  ).map((givenIssue) => ({
    ...givenIssue,
    path: `${givenIssue.path}/text`
  })));

  issues.push(...duplicateStringIssues(
    terms.map((entry) => entry?.term),
    "/spec/terms",
    "DUPLICATE_TERM",
    "term"
  ).map((termIssue) => ({
    ...termIssue,
    path: `${termIssue.path}/term`
  })));

  return issues;
}
