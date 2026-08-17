import {
  createPublicKey,
  verify as verifySignature,
} from "node:crypto";
import {
  canonicalBytes,
  deepCloneCanonical,
  deepFreeze,
} from "./canonical-json.mjs";
import { AuthorizationError, ValidationError } from "./errors.mjs";
import { HASH_PROFILE_ID, hashCanonical } from "./hash.mjs";

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/u;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/u;
const BASE64URL = /^[A-Za-z0-9_-]+$/u;

function assertIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) {
    throw new ValidationError(`${label} is invalid`, { value });
  }
}

function authorizationExpression(policy) {
  return (
    policy.commandAuthority ??
    policy.commandAuthorization ??
    policy.authorization ??
    policy.authorityExpression ??
    (policy.authorityId ? { single: policy.authorityId } : null)
  );
}

export function requiredCommandAuthorityIds(policy) {
  const expression = authorizationExpression(policy);
  if (!expression) {
    throw new AuthorizationError(
      "Participant policy has no authorization expression",
      { participantPolicyId: policy.participantPolicyId },
    );
  }
  let commandAuthorities;
  if (typeof expression === "string") {
    commandAuthorities = [expression];
  } else if (expression.kind === "single" || expression.single) {
    commandAuthorities = [expression.authorityId ?? expression.single];
  } else if (expression.kind === "allOf" || expression.allOf) {
    commandAuthorities = expression.authorityIds ?? expression.allOf;
  } else if (expression.kind === "anyOf" || expression.anyOf) {
    throw new AuthorizationError(
      "Externally receipted commands require a resolved any-of authority",
      {
        participantPolicyId: policy.participantPolicyId,
        alternatives: expression.authorityIds ?? expression.anyOf,
      },
    );
  } else {
    throw new AuthorizationError(
      "Participant policy authorization expression is unsupported",
      { participantPolicyId: policy.participantPolicyId },
    );
  }
  const required = [
    ...commandAuthorities,
    ...(policy.requiredAttestationAuthorityIds ?? []),
  ];
  for (const authorityId of required) {
    assertIdentifier(authorityId, "required authority ID");
  }
  return [...new Set(required)].sort();
}

export function authorityCommandScope({
  command,
  machineId,
  participantPolicyId,
  participantPolicyDigest,
}) {
  const core = {
    hashProfileId: HASH_PROFILE_ID,
    machineId,
    objectId: command.objectId,
    transitionId: command.transitionId,
    expectedRevision: deepCloneCanonical(command.expectedRevision),
    idempotencyKey: command.idempotencyKey,
    inputDigest: command.inputDigest,
    participantPolicyId,
    participantPolicyDigest,
    parentOrderId: command.parentOrderId ?? null,
    parentFence: command.parentFence ?? null,
  };
  return {
    core,
    commandScopeDigest: hashCanonical(
      "external-authority-command-scope/v1",
      core,
    ),
  };
}

export function authorityReceiptDigest(receiptCore) {
  return hashCanonical("external-authority-receipt/v1", receiptCore);
}

export function authorityReceiptSigningBytes(receiptCore) {
  return canonicalBytes({
    domain: "survey-skill-evaluator/external-authority-receipt-signature/v1",
    receiptCore,
  });
}

export function authorityTrustRootDigest(trustRootCore) {
  return hashCanonical("external-authority-trust-root/v1", trustRootCore);
}

function trustRootCore(trustRoot) {
  const core = deepCloneCanonical(trustRoot);
  delete core.trustRootDigest;
  return core;
}

function receiptCore(receipt) {
  const core = deepCloneCanonical(receipt);
  delete core.receiptDigest;
  delete core.signatureBase64url;
  return core;
}

function assertNoCallerAuthorityAssertions(command) {
  for (const field of [
    "commandActorContexts",
    "authorizationAttestations",
    "authorizationEvidenceRefs",
  ]) {
    if (
      Object.hasOwn(command, field) &&
      (!Array.isArray(command[field]) || command[field].length > 0)
    ) {
      throw new AuthorizationError(
        "Caller-authored authority assertions are forbidden",
        { field },
      );
    }
  }
}

export class AuthorityReceiptVerifier {
  constructor({ trustRoot, schemaValidator = null }) {
    if (!trustRoot || typeof trustRoot !== "object") {
      throw new ValidationError(
        "AuthorityReceiptVerifier requires an externally supplied trust root",
      );
    }
    const inert = deepCloneCanonical(trustRoot);
    schemaValidator?.assert("authority-trust-root", inert);
    if (
      inert.schemaVersion !== "1.0.0" ||
      inert.hashProfileId !== HASH_PROFILE_ID ||
      inert.sourceClass !== "external_host_trust_root" ||
      !Array.isArray(inert.issuers) ||
      inert.issuers.length === 0
    ) {
      throw new ValidationError("External authority trust root is malformed");
    }
    const expectedRoot = authorityTrustRootDigest(trustRootCore(inert));
    if (inert.trustRootDigest !== expectedRoot) {
      throw new ValidationError("External authority trust-root digest mismatch", {
        expected: expectedRoot,
        actual: inert.trustRootDigest,
      });
    }
    this.trustRoot = deepFreeze(inert);
    this.schemaValidator = schemaValidator;
    this.issuers = new Map();
    for (const issuer of inert.issuers) {
      assertIdentifier(issuer.issuerId, "authority issuer ID");
      if (
        !Array.isArray(issuer.authorityIds) ||
        issuer.authorityIds.length === 0 ||
        typeof issuer.publicKeySpkiBase64 !== "string" ||
        !BASE64.test(issuer.publicKeySpkiBase64)
      ) {
        throw new ValidationError("Authority trust-root issuer is malformed", {
          issuerId: issuer.issuerId,
        });
      }
      if (this.issuers.has(issuer.issuerId)) {
        throw new ValidationError("Authority trust root repeats an issuer", {
          issuerId: issuer.issuerId,
        });
      }
      const authorityIds = new Set(issuer.authorityIds);
      if (authorityIds.size !== issuer.authorityIds.length) {
        throw new ValidationError("Authority issuer repeats an authority ID", {
          issuerId: issuer.issuerId,
        });
      }
      for (const authorityId of authorityIds) {
        assertIdentifier(authorityId, "admitted authority ID");
      }
      let publicKey;
      try {
        publicKey = createPublicKey({
          key: Buffer.from(issuer.publicKeySpkiBase64, "base64"),
          format: "der",
          type: "spki",
        });
      } catch (error) {
        throw new ValidationError("Authority issuer public key is invalid", {
          issuerId: issuer.issuerId,
          cause: error.message,
        });
      }
      if (publicKey.asymmetricKeyType !== "ed25519") {
        throw new ValidationError("Authority issuer key must be Ed25519", {
          issuerId: issuer.issuerId,
          keyType: publicKey.asymmetricKeyType,
        });
      }
      this.issuers.set(issuer.issuerId, {
        authorityIds,
        publicKey,
      });
    }
  }

  verifyScope({
    requiredAuthorityIds,
    commandScopeDigest,
    receipts,
  }) {
    if (
      !Array.isArray(requiredAuthorityIds) ||
      requiredAuthorityIds.length === 0
    ) {
      throw new AuthorizationError(
        "Externally receipted authority scope requires at least one authority",
      );
    }
    const normalizedAuthorityIds = [...new Set(requiredAuthorityIds)].sort();
    if (normalizedAuthorityIds.length !== requiredAuthorityIds.length) {
      throw new AuthorizationError(
        "Externally receipted authority scope repeats an authority",
        { requiredAuthorityIds },
      );
    }
    for (const authorityId of normalizedAuthorityIds) {
      assertIdentifier(authorityId, "required authority ID");
    }
    if (
      typeof commandScopeDigest !== "string" ||
      !/^[a-f0-9]{64}$/u.test(commandScopeDigest)
    ) {
      throw new AuthorizationError(
        "Externally receipted authority scope digest is invalid",
        { commandScopeDigest },
      );
    }
    if (!Array.isArray(receipts) || receipts.length === 0) {
      throw new AuthorizationError(
        "Externally issued authority receipts are required",
        { requiredAuthorityIds: normalizedAuthorityIds },
      );
    }
    const verified = new Map();
    for (const receipt of receipts) {
      this.schemaValidator?.assert("authority-receipt", receipt);
      const core = receiptCore(receipt);
      const expectedDigest = authorityReceiptDigest(core);
      if (receipt.receiptDigest !== expectedDigest) {
        throw new AuthorizationError("Authority receipt digest mismatch", {
          receiptId: receipt.receiptId,
        });
      }
      if (
        receipt.trustRootId !== this.trustRoot.trustRootId ||
        receipt.commandScopeDigest !== commandScopeDigest
      ) {
        throw new AuthorizationError(
          "Authority receipt is outside the configured trust root or command scope",
          { receiptId: receipt.receiptId },
        );
      }
      const issuer = this.issuers.get(receipt.issuerId);
      if (!issuer || !issuer.authorityIds.has(receipt.authorityId)) {
        throw new AuthorizationError(
          "Authority receipt issuer is not trusted for the claimed authority",
          {
            receiptId: receipt.receiptId,
            issuerId: receipt.issuerId,
            authorityId: receipt.authorityId,
          },
        );
      }
      if (
        typeof receipt.signatureBase64url !== "string" ||
        !BASE64URL.test(receipt.signatureBase64url) ||
        !verifySignature(
          null,
          authorityReceiptSigningBytes(core),
          issuer.publicKey,
          Buffer.from(receipt.signatureBase64url, "base64url"),
        )
      ) {
        throw new AuthorizationError(
          "Authority receipt signature verification failed",
          { receiptId: receipt.receiptId },
        );
      }
      if (verified.has(receipt.authorityId)) {
        throw new AuthorizationError(
          "Command repeats an authority receipt identity",
          { authorityId: receipt.authorityId },
        );
      }
      verified.set(receipt.authorityId, receipt);
    }
    const missing = normalizedAuthorityIds.filter(
      (authorityId) => !verified.has(authorityId),
    );
    const unexpected = [...verified.keys()].filter(
      (authorityId) => !normalizedAuthorityIds.includes(authorityId),
    );
    if (missing.length > 0 || unexpected.length > 0) {
      throw new AuthorizationError(
        "Authority receipts do not exactly satisfy participant policy",
        { missing, unexpected },
      );
    }
    return {
      trustRootDigest: this.trustRoot.trustRootDigest,
      commandScopeDigest,
      receiptDigests: normalizedAuthorityIds.map(
        (authorityId) => verified.get(authorityId).receiptDigest,
      ),
    };
  }

  verify({ policy, command, machineId, participantPolicyDigest }) {
    assertNoCallerAuthorityAssertions(command);
    const requiredAuthorityIds = requiredCommandAuthorityIds(policy);
    const { commandScopeDigest } = authorityCommandScope({
      command,
      machineId,
      participantPolicyId: policy.participantPolicyId,
      participantPolicyDigest,
    });
    return this.verifyScope({
      requiredAuthorityIds,
      commandScopeDigest,
      receipts: command.authorizationReceipts,
    });
  }
}

export async function requestExternalAuthorityReceipts({
  provider,
  policy,
  command,
  machineId,
  participantPolicyDigest,
}) {
  if (!provider || typeof provider.issue !== "function") {
    throw new AuthorizationError(
      "Embedding host did not supply an external authority-receipt provider",
    );
  }
  const requiredAuthorityIds = requiredCommandAuthorityIds(policy);
  const scope = authorityCommandScope({
    command,
    machineId,
    participantPolicyId: policy.participantPolicyId,
    participantPolicyDigest,
  });
  const receipts = await provider.issue({
    requiredAuthorityIds: [...requiredAuthorityIds],
    commandScope: deepCloneCanonical(scope.core),
    commandScopeDigest: scope.commandScopeDigest,
    participantPolicyId: policy.participantPolicyId,
    participantPolicyDigest,
  });
  if (!Array.isArray(receipts)) {
    throw new AuthorizationError(
      "External authority-receipt provider returned no receipt set",
    );
  }
  return deepCloneCanonical(receipts);
}
