import {
  IN_MEMORY_STORE_FAULT_POINTS,
  createInMemoryAuthoringStore,
  createInMemoryJournalIdentityConfiguration,
  createInMemoryStoreBacking,
} from "../../../../../source/authoring/adapters/in-memory-store.mjs";
import {
  assertCoordinatorContractDriver,
} from "./driver-contract.mjs";

export const inMemoryJournalAuthenticationKey = Uint8Array.from(
  { length: 32 },
  (_, index) => 129 + index,
);

export const inMemoryCoordinatorContractDriver =
  Object.freeze(assertCoordinatorContractDriver({
    id: "in-memory",
    capabilities: Object.freeze({
      logicalFaultInjection: Object.freeze({
        points: Object.freeze({
          beforeAssembly:
            IN_MEMORY_STORE_FAULT_POINTS.BEFORE_ASSEMBLY,
          duringAssembly:
            IN_MEMORY_STORE_FAULT_POINTS.DURING_ASSEMBLY,
          afterPreparationBeforePublish:
            IN_MEMORY_STORE_FAULT_POINTS
              .AFTER_PREPARATION_BEFORE_PUBLISH,
          afterPublishBeforeAcknowledgement:
            IN_MEMORY_STORE_FAULT_POINTS
              .AFTER_PUBLISH_BEFORE_ACKNOWLEDGEMENT,
        }),
      }),
    }),
    createPersistence() {
      return createInMemoryStoreBacking();
    },
    createAdapterScope({ storeId }) {
      return {
        adapter: "in-memory",
        storeId,
      };
    },
    createIdentityConfiguration(
      options,
      authenticationKey =
        inMemoryJournalAuthenticationKey,
    ) {
      return createInMemoryJournalIdentityConfiguration(
        options,
        authenticationKey,
      );
    },
    createStore({
      persistence,
      initialSnapshots,
      identityAuthority,
      authoringMachineId,
      faultInjector,
    }) {
      return createInMemoryAuthoringStore({
        backing: persistence,
        initialSnapshots,
        identityAuthority,
        authoringMachineId,
        faultInjector,
      });
    },
  }));
