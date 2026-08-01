import {
  prettyJson,
  sha256Bytes,
  stableValue
} from "./canonical.mjs";

function fenced(value) {
  return `\`\`\`json\n${prettyJson(value)}\`\`\``;
}

function list(values) {
  if (!Array.isArray(values) || values.length === 0) return "- None recorded.";
  return values.map((value) => `- ${typeof value === "string" ? value : JSON.stringify(value)}`).join("\n");
}

export function renderEnvelopeModel(model) {
  const sections = [
    `# ${model.title} — Survey intent envelope`,
    "## Identity and lifecycle",
    fenced({
      methodology: model.methodology,
      authority: model.authority,
      lifecycleHandoff: model.lifecycleHandoff
    }),
    "## Source work item and outcome axes",
    model.workItem,
    fenced(model.outcomeAxes),
    "## Frozen instrument",
    fenced(model.instrument),
    "## Director evidence",
    fenced(model.responses),
    "## Interpretations and mappings",
    fenced(model.interpretations),
    "## Contradictions, tensions and uncertainty",
    "### Contradictions",
    list(model.contradictions),
    "### Tensions",
    list(model.tensions),
    "## Composite intent",
    model.compositeIntent,
    "## Scope and anti-goals",
    "### Scope",
    list(model.scope),
    "### Anti-goals",
    list(model.antiGoals),
    "## Open design questions",
    list(model.openDesignQuestions),
    "## Dependency and triangulation evidence",
    fenced(model.dependencies),
    "## Calibration",
    fenced(model.calibration),
    "## Ratification and planning handoff",
    fenced(model.ratification)
  ];
  return `${sections.join("\n\n")}\n`;
}

export function envelopeDigest(model) {
  return sha256Bytes(Buffer.from(renderEnvelopeModel(model), "utf8"));
}

export function attachRatificationEvidence(candidateModel, ratification) {
  const model = stableValue(candidateModel);
  if (
    model.ratification?.authority !== "director-only" ||
    model.ratification.status !== "pending" ||
    model.ratification.eventId !== null ||
    model.ratification.semanticDigest !== null ||
    model.ratification.renderDigest !== null
  ) {
    throw new TypeError("reviewed candidate must carry only the pending ratification target");
  }
  if (
    !ratification ||
    typeof ratification.eventId !== "string" ||
    typeof ratification.semanticDigest !== "string" ||
    typeof ratification.renderDigest !== "string"
  ) {
    throw new TypeError("ratification evidence is incomplete");
  }
  model.ratification = {
    authority: "director-only",
    status: "ratified",
    eventId: ratification.eventId,
    semanticDigest: ratification.semanticDigest,
    renderDigest: ratification.renderDigest
  };
  return model;
}

export function walkthroughSegments(model) {
  const groups = [
    {
      id: "identity-methodology-and-authority",
      fields: [
        "$schema",
        "schemaVersion",
        "title",
        "workItem",
        "methodology",
        "authority",
        "outcomeAxes",
        "lifecycleHandoff"
      ]
    },
    {
      id: "frozen-instrument",
      fields: ["instrument"]
    },
    {
      id: "director-evidence-and-interpretations",
      fields: [
        "responses",
        "interpretations",
        "contradictions",
        "tensions"
      ]
    },
    {
      id: "composite-scope-and-open-questions",
      fields: [
        "compositeIntent",
        "scope",
        "antiGoals",
        "openDesignQuestions"
      ]
    },
    {
      id: "dependencies-calibration-and-ratification-target",
      fields: [
        "dependencies",
        "calibration",
        "ratification"
      ]
    }
  ];
  const seen = new Set();
  const segments = groups.map(({ id, fields }) => {
    const reviewObject = {};
    for (const field of fields) {
      if (!Object.hasOwn(model, field)) {
        throw new TypeError(`walkthrough field is absent from candidate: ${field}`);
      }
      if (seen.has(field)) {
        throw new TypeError(`walkthrough field is duplicated: ${field}`);
      }
      seen.add(field);
      reviewObject[field] = model[field];
    }
    return {
      id,
      content: prettyJson(reviewObject).trimEnd()
    };
  });
  const modelFields = Object.keys(model).sort();
  const reviewedFields = [...seen].sort();
  if (JSON.stringify(modelFields) !== JSON.stringify(reviewedFields)) {
    throw new TypeError("walkthrough field coverage differs from the frozen candidate");
  }
  const reconstructed = Object.assign(
    {},
    ...segments.map((segment) => JSON.parse(segment.content))
  );
  if (JSON.stringify(stableValue(reconstructed)) !== JSON.stringify(stableValue(model))) {
    throw new TypeError("walkthrough content does not reconstruct the frozen candidate");
  }
  return segments;
}
