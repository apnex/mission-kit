export class PackageIdentityError extends TypeError {
  constructor(message) {
    super(message);
    this.name = "PackageIdentityError";
    this.code = "PACKAGE_IDENTITY_MISMATCH";
  }
}

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function assertPackageIdentity({
  packageManifest,
  npmPackage,
  npmLock
}) {
  if (
    !record(packageManifest) ||
    !record(npmPackage) ||
    !record(npmLock) ||
    !record(npmLock.packages?.[""])
  ) {
    throw new PackageIdentityError(
      "package, npm, and supply-lock identities must be closed objects"
    );
  }
  const lockRoot = npmLock.packages[""];
  if (
    typeof npmPackage.name !== "string" ||
    npmPackage.name.length === 0 ||
    typeof npmPackage.version !== "string" ||
    npmPackage.version.length === 0 ||
    npmPackage.name !== npmLock.name ||
    npmPackage.name !== lockRoot.name ||
    npmPackage.version !== packageManifest.version ||
    npmPackage.version !== npmLock.version ||
    npmPackage.version !== lockRoot.version
  ) {
    throw new PackageIdentityError(
      "package.json, package-lock.json root, and survey-v2.package.json identities must agree"
    );
  }
  return Object.freeze({
    npmName: npmPackage.name,
    packageId: packageManifest.id,
    version: npmPackage.version
  });
}
