import {
  assertCoordinatorContractDriver,
} from "./drivers/driver-contract.mjs";

export const DEFAULT_COORDINATOR_CONTRACT_DRIVER =
  "in-memory";
export const AVAILABLE_COORDINATOR_CONTRACT_DRIVERS =
  Object.freeze([DEFAULT_COORDINATOR_CONTRACT_DRIVER]);

const driverLoaders = Object.freeze({
  "in-memory": async () => {
    const module = await import("./drivers/in-memory-driver.mjs");
    return module.inMemoryCoordinatorContractDriver;
  },
});

export async function resolveCoordinatorContractDriver({
  driver,
  driverName,
} = {}) {
  if (driver !== undefined && driverName !== undefined) {
    throw new TypeError(
      "provide a coordinator contract driver or driverName, not both",
    );
  }
  if (driver !== undefined) {
    return assertCoordinatorContractDriver(driver);
  }
  const selectedName =
    driverName ??
    process.env.MISSION_KIT_COORDINATOR_CONTRACT_DRIVER ??
    DEFAULT_COORDINATOR_CONTRACT_DRIVER;
  const load = driverLoaders[selectedName];
  if (load === undefined) {
    throw new TypeError(
      `unknown coordinator contract driver ${selectedName}; available: ${AVAILABLE_COORDINATOR_CONTRACT_DRIVERS.join(", ")}`,
    );
  }
  return assertCoordinatorContractDriver(await load());
}
