const driverIdPattern =
  /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u;

export class CoordinatorContractDriverError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "CoordinatorContractDriverError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new CoordinatorContractDriverError(code, message);
}

function isRecord(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

export function assertCoordinatorContractDriver(driver) {
  if (
    !isRecord(driver) ||
    typeof driver.id !== "string" ||
    driver.id.length > 80 ||
    !driverIdPattern.test(driver.id)
  ) {
    fail(
      "COORDINATOR_DRIVER_INVALID",
      "coordinator contract driver requires one bounded driver id",
    );
  }
  for (const operation of [
    "createPersistence",
    "createAdapterScope",
    "createIdentityConfiguration",
    "createStore",
  ]) {
    if (typeof driver[operation] !== "function") {
      fail(
        "COORDINATOR_DRIVER_INVALID",
        `coordinator contract driver lacks ${operation}`,
      );
    }
  }
  if (!isRecord(driver.capabilities)) {
    fail(
      "COORDINATOR_DRIVER_INVALID",
      "coordinator contract driver capabilities must be one object",
    );
  }
  const faultInjection =
    driver.capabilities.logicalFaultInjection;
  if (
    faultInjection !== undefined &&
    (
      !isRecord(faultInjection) ||
      !isRecord(faultInjection.points) ||
      Object.values(faultInjection.points).some(
        (point) =>
          typeof point !== "string" ||
          point.length === 0,
      )
    )
  ) {
    fail(
      "COORDINATOR_DRIVER_INVALID",
      "logical fault-injection capability has invalid point bindings",
    );
  }
  return driver;
}

export function optionalDriverFaultPoint(driver, pointName) {
  const stable = assertCoordinatorContractDriver(driver);
  const point =
    stable.capabilities.logicalFaultInjection
      ?.points?.[pointName];
  return typeof point === "string" ? point : null;
}
