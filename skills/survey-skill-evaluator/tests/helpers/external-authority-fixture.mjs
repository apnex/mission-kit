import {
  generateKeyPairSync,
  sign,
} from "node:crypto";
import {
  AuthorityReceiptVerifier,
  HASH_PROFILE_ID,
  authorityReceiptDigest,
  authorityReceiptSigningBytes,
  authorityCommandScope,
  authorityTrustRootDigest,
  hashCanonical,
  requestExternalAuthorityReceipts,
  requiredCommandAuthorityIds,
} from "../../source/executables/engine/index.mjs";

export function createExternalAuthorityFixture({
  authorityIds,
  schemaValidator = null,
  issuerId = "test-host-authority-issuer",
  trustRootId = "test-host-authority-root",
} = {}) {
  const admitted = [...new Set(authorityIds ?? [])].sort();
  if (admitted.length === 0) {
    throw new Error("external authority fixture requires admitted authorities");
  }
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const trustRootCore = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    trustRootId,
    sourceClass: "external_host_trust_root",
    issuers: [
      {
        issuerId,
        publicKeySpkiBase64: publicKey
          .export({ format: "der", type: "spki" })
          .toString("base64"),
        authorityIds: admitted,
      },
    ],
  };
  const trustRoot = {
    ...trustRootCore,
    trustRootDigest: authorityTrustRootDigest(trustRootCore),
  };
  schemaValidator?.assert("authority-trust-root", trustRoot);
  const provider = {
    issue({
      requiredAuthorityIds,
      commandScopeDigest,
      participantPolicyId,
    }) {
      return requiredAuthorityIds.map((authorityId) => {
        if (!admitted.includes(authorityId)) {
          throw new Error(`test host cannot issue ${authorityId}`);
        }
        const receiptCore = {
          schemaVersion: "1.0.0",
          hashProfileId: HASH_PROFILE_ID,
          receiptId: `receipt:${authorityId}:${commandScopeDigest.slice(0, 24)}`,
          trustRootId,
          issuerId,
          authorityId,
          commandScopeDigest,
          evidenceRoot: hashCanonical("test-host-authority-evidence/v1", {
            authorityId,
            commandScopeDigest,
            participantPolicyId,
          }),
        };
        const receipt = {
          ...receiptCore,
          receiptDigest: authorityReceiptDigest(receiptCore),
          signatureBase64url: sign(
            null,
            authorityReceiptSigningBytes(receiptCore),
            privateKey,
          ).toString("base64url"),
        };
        schemaValidator?.assert("authority-receipt", receipt);
        return receipt;
      });
    },
  };
  const verifier = new AuthorityReceiptVerifier({
    trustRoot,
    schemaValidator,
  });
  return {
    trustRoot,
    provider,
    verifier,
    async authorize({ policy, command, machineId, participantPolicyDigest }) {
      return {
        ...command,
        authorizationReceipts: await requestExternalAuthorityReceipts({
          provider,
          policy,
          command,
          machineId,
          participantPolicyDigest,
        }),
      };
    },
    authorizeSync({ policy, command, machineId, participantPolicyDigest }) {
      const scope = authorityCommandScope({
        command,
        machineId,
        participantPolicyId: policy.participantPolicyId,
        participantPolicyDigest,
      });
      return {
        ...command,
        authorizationReceipts: provider.issue({
          requiredAuthorityIds: requiredCommandAuthorityIds(policy),
          commandScope: scope.core,
          commandScopeDigest: scope.commandScopeDigest,
          participantPolicyId: policy.participantPolicyId,
          participantPolicyDigest,
        }),
      };
    },
  };
}
