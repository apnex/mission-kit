import { types } from "node:util";
import {
  canonicalize,
  stableValue,
} from "../kernel/canonical.mjs";

const digestPattern = /^sha256:[0-9a-f]{64}$/u;
const semanticIdPattern =
  /^[a-z][a-z0-9]*(?:[._:/-][a-z0-9]+)*$/u;

export class AuthoringCommandAdmissionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "AuthoringCommandAdmissionError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new AuthoringCommandAdmissionError(code, message);
}

function isRecord(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !types.isProxy(value)
  );
}

function exactBinding(value) {
  let binding;
  try {
    binding = stableValue(value);
  } catch {
    fail(
      "COMMAND_ADMISSION_BINDING_INVALID",
      "command admission binding must be canonical plain JSON",
    );
  }
  if (
    !isRecord(binding) ||
    Object.keys(binding).length !== 2 ||
    !Object.hasOwn(binding, "id") ||
    !Object.hasOwn(binding, "digest") ||
    typeof binding.id !== "string" ||
    binding.id.length > 160 ||
    !semanticIdPattern.test(binding.id) ||
    typeof binding.digest !== "string" ||
    !digestPattern.test(binding.digest)
  ) {
    fail(
      "COMMAND_ADMISSION_BINDING_INVALID",
      "command admission binding must be exactly one canonical {id,digest}",
    );
  }
  return Object.freeze(binding);
}

function dataFunction(value, key, label) {
  if (!isRecord(value)) {
    fail(
      "COMMAND_ADMISSION_PORT_INVALID",
      `${label} must be one non-proxy object`,
    );
  }
  const descriptor = Object.getOwnPropertyDescriptor(
    value,
    key,
  );
  if (
    descriptor?.enumerable !== true ||
    !Object.prototype.hasOwnProperty.call(
      descriptor,
      "value",
    ) ||
    typeof descriptor.value !== "function"
  ) {
    fail(
      "COMMAND_ADMISSION_PORT_INVALID",
      `${label}.${key} must be one enumerable data function`,
    );
  }
  return descriptor.value;
}

/**
 * Create a one-shot in-process command capability.
 *
 * The verifier enters the private coordinator. A bound port enters the
 * profile adapter. Neither the raw marker nor a reusable token is serialized
 * into the semantic command, journal, or workspace.
 */
export function createOneShotCommandAdmission(
  bindingInput,
) {
  const binding = exactBinding(bindingInput);
  const admitted = new WeakSet();
  const verifier = Object.freeze({
    binding,
    consume(command) {
      if (
        command === null ||
        (
          typeof command !== "object" &&
          typeof command !== "function"
        )
      ) {
        return false;
      }
      const accepted = admitted.has(command);
      if (accepted) admitted.delete(command);
      return accepted;
    },
  });
  return Object.freeze({
    verifier,
    bind(portInput) {
      const read = dataFunction(
        portInput,
        "read",
        "command admission port",
      );
      const execute = dataFunction(
        portInput,
        "execute",
        "command admission port",
      );
      return Object.freeze({
        read: (...args) =>
          Reflect.apply(read, portInput, args),
        execute(storeId, command) {
          if (
            command === null ||
            typeof command !== "object" ||
            types.isProxy(command)
          ) {
            fail(
              "COMMAND_ADMISSION_COMMAND_INVALID",
              "admitted command must be one non-proxy object",
            );
          }
          admitted.add(command);
          return Reflect.apply(
            execute,
            portInput,
            [storeId, command],
          );
        },
      });
    },
    matches(candidate) {
      try {
        return canonicalize(exactBinding(candidate)) ===
          canonicalize(binding);
      } catch {
        return false;
      }
    },
  });
}
