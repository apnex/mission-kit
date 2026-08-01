export class EvaluatorError extends Error {
  constructor(code, message, details = {}, options = {}) {
    super(message, options);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends EvaluatorError {
  constructor(message, details = {}, options = {}) {
    super("validation_error", message, details, options);
  }
}

export class IntegrityError extends EvaluatorError {
  constructor(message, details = {}, options = {}) {
    super("integrity_error", message, details, options);
  }
}

export class ConflictError extends EvaluatorError {
  constructor(message, details = {}, options = {}) {
    super("conflict", message, details, options);
  }
}

export class AuthorizationError extends EvaluatorError {
  constructor(message, details = {}, options = {}) {
    super("authorization_error", message, details, options);
  }
}

export class NotFoundError extends EvaluatorError {
  constructor(message, details = {}, options = {}) {
    super("not_found", message, details, options);
  }
}

export class QuarantinedError extends EvaluatorError {
  constructor(message, details = {}, options = {}) {
    super("quarantined", message, details, options);
  }
}

export function asResult(error) {
  if (error instanceof EvaluatorError) {
    return {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
  }
  return {
    ok: false,
    error: {
      code: "internal_error",
      message: error instanceof Error ? error.message : String(error),
      details: {},
    },
  };
}
