import { deepCloneCanonical } from "../engine/canonical-json.mjs";
import { AuthorizationError, ValidationError } from "../engine/errors.mjs";
import { hashCanonical } from "../engine/hash.mjs";

export class ToolBroker {
  constructor({ allowedTools, handlers = {}, evidenceSink = null }) {
    this.allowedTools = new Set(allowedTools);
    this.handlers = new Map(Object.entries(handlers));
    this.evidenceSink = evidenceSink;
  }

  async call(toolId, args) {
    const argumentDigest = hashCanonical("role-tool-arguments/v1", args);
    if (!this.allowedTools.has(toolId)) {
      const evidence = {
        toolId,
        argumentDigest,
        status: "denied",
        reason: "tool_not_allowlisted",
      };
      await this.evidenceSink?.(evidence);
      throw new AuthorizationError("Role attempted a non-allowlisted tool", {
        toolId,
        argumentDigest,
      });
    }
    const handler = this.handlers.get(toolId);
    if (!handler) {
      throw new ValidationError("Allowlisted tool has no host handler", { toolId });
    }
    const result = await handler(deepCloneCanonical(args));
    const evidence = {
      toolId,
      argumentDigest,
      resultDigest: hashCanonical("role-tool-result/v1", result),
      status: "completed",
    };
    await this.evidenceSink?.(evidence);
    return deepCloneCanonical(result);
  }
}
