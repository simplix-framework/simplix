# How simplix-license works

How a verdict is reached and shared, how the verification keys and the ceiling for leaked keys work, where the registration is kept, and which statuses a license passes through.

## One verdict, read everywhere

1. `LicenseManager` owns what the deployment does about its license: it imports a token file at start, verifies the stored registration, and publishes the verdict. The verdict itself is computed by the license SDK.
2. The verdict is cached in the gate of the SDK and read through `LicenseState`.
3. `LicenseEnforcementFilter`, the feature aspects, `LicenseQuotaGuard`, the health indicator and the license endpoints all read that one state, so they cannot give different answers.
4. The first verification runs when the application is ready, not while beans are created: a database store is complete only then. Until it ran, the status is `NOT_ACTIVATED`.

## What cannot be configured

An on-premises deployment is run by the party the license restricts. These values are fixed in the build for that reason.

| Item | Fixed as | Why |
|---|---|---|
| whether the license is enforced | always | there is no switch a customer could flip |
| where the verification keys are | `classpath:license-verification-keys.json` | a deployment cannot verify tokens with a key it made itself |
| the name, the key and the leak mark of a verification key | one entry of that file | the name and the key cannot drift apart, and a configuration file cannot change them |
| the product code | the `ProductIdentity` bean | a deployment has to know which product it is |

Development uses the same path, with a license issued on the development channel.

## Verification keys

`VerificationKeys` holds every `VerificationKey` of the build. A token names the key that signed it, and the SDK verifies with that key. Several keys let the issuer replace its signing key while licenses signed with the earlier one stay valid.

## The ceiling for a leaked key

A key marked `compromised` still verifies, but a token signed with it cannot give more than the deployment already had. `CompromiseCeiling` is the record of what the deployment held when it first read the mark, and it stays fixed.

| Axis | A token is refused when it |
|---|---|
| features | asks for a feature that was not held |
| quantity limits | asks for a higher limit, or leaves a limit out |
| expiry | expires later |
| release ceiling | asks for a newer release, or leaves the ceiling out |

- One axis that rises refuses the whole token, and the status becomes `SIGNING_KEY_COMPROMISED`.
- A deployment with nothing registered fixes its ceiling at "holds nothing" before it reads a token file. A forged token signed with the leaked key therefore gives a fresh installation nothing.
- A key without the mark is not limited: a key that merely stopped signing keeps giving what it gave.

## Where the registration is kept

|  | `JpaLicenseStore` | `FileLicenseStore` |
|---|---|---|
| Chosen when | JPA is on the classpath | otherwise |
| Keeps the registration in | the table `license_registration`, mapped by `LicenseRegistration` | the file `state-path` names |
| Keeps the ceiling in | the column `compromise_ceiling` of the same row | the member `compromiseCeiling` of the same file |
| A replaced container | keeps its license without a volume | needs the file on a volume |

A store of your own implements `LicenseStore` of the SDK and `CompromiseCeilingStore` together. `LicenseStore` has `load()`, which returns the stored `RegistrationRecord` or an empty `Optional`, `save(record)` and `clear()`. `CompromiseCeilingStore` has `loadCeiling()`, which returns the stored ceiling or an empty `Optional` when none was fixed yet, and `saveCeiling(ceiling)`, which replaces what was stored. With only one of the two the application does not start: a deployment that cannot keep its ceiling would lose the limit without any error. The registration and the ceiling belong in the same place, so that a ceiling never outlives or predates its registration. `LicenseStorePackage` marks the package of the entity for applications that list their entity packages by hand.

## Statuses

| From | To | When |
|---|---|---|
| start | `NOT_ACTIVATED` | nothing is registered |
| `NOT_ACTIVATED` | `VALID` | an activation succeeds |
| `VALID` | `GRACE_PERIOD` | the expiry date passes |
| `GRACE_PERIOD` | `VALID` | a heartbeat brings a renewed token |
| `GRACE_PERIOD` | `EXPIRED` | the grace period passes |
| `VALID` | `HEARTBEAT_OVERDUE` | the heartbeat interval is exceeded |
| `VALID` | `REVOKED` | the server revokes the activation |
| `VALID` | `RELEASE_NOT_ENTITLED` | the application is upgraded past the release the contract covers |
| `VALID` | `SIGNING_KEY_COMPROMISED` | a token signed with a leaked key asks for more than the ceiling |
| any refused status | `VALID` | a valid token is registered, or the contract is renewed |

`RELEASE_NOT_ENTITLED` does not stop requests: the release ceiling controls what was sold, and cutting requests would stop the equipment the application controls. The list of paid features is empty instead, so the feature gate refuses them.

## What the module registers

| Part | Registered when |
|---|---|
| `LicenseAutoConfiguration`: the manager, the state, the stores, `FeatureAccess`, `FeatureGateAspect`, `LicenseQuotaGuard`, `LicenseAuditTrail`, `LicenseActivationService` with its `LicenseActivationClient`, the schedulers `LicenseReVerificationScheduler` and `LicenseHeartbeatScheduler`, and `DeploymentLicenseRestController` | always |
| `LicenseEnforcementFilter`, at order 50 | `application.license.enforcement.http-filter-enabled` is not `false` |
| `FeatureActivationAspect` | a `FeatureActivationChecker` bean exists |
| `LicenseSetupController`, `EnvSetupController` with `EnvProfileService`, and `InitializationGateFilter` at order 40 | a `SetupState` bean exists |
| `LicenseActuatorAutoConfiguration`: `LicenseHealthIndicator` and `LicenseMetrics` | Spring Boot Actuator, and Micrometer for the metrics, are on the classpath |

The installation gate runs before the license filter: a deployment that is not installed has no license to judge, and its wizard has to stay reachable. `LicenseRuntimeHints` declares the reflection the module needs in a native image, `RuntimeIntegrityChecker` compares the application binary with a known hash to detect patching, `ActivationServerProbe` asks a license server to identify itself before its address is saved and compares the fingerprint of its signing key, and `ActivationFailures` turns the errors of the server into message keys.

## Other public methods

The guides show the methods a task needs. The types they name also have these public methods.

| Type | Method | Does |
|---|---|---|
| `LicenseManager` | `initialize()` | called by the module at start: imports a token that was provisioned by hand when the store holds none, then judges the license |
| `LicenseManager` | `isFeatureAvailable(feature)` | says whether the current license grants the feature |
| `LicenseManager` | `availableFeatures()` | returns the modules the current license grants; a deployment that runs above its entitled release is granted none |
| `LicenseManager` | `isGracePeriodReadOnly()` | is `true` while the license is in its grace period and the grace period mode is `READ_ONLY` |
| `LicenseManager` | `getPublicKeyFingerprint()`, `verificationKeyFingerprints()` | return the fingerprint of the first verification key, and the fingerprints of every key a token is verified against |
| `LicenseManager` | `collectedIdentifiers()` | returns what the machine reported about itself, with the source of each value |
| `ContactIdentity` | `contactEmail()` | the method your bean implements: the address the license was sold to, which the license server compares with the customer record when a seat is claimed |
| `InstallationDiscriminator` | `installationDiscriminator()` | the method your bean implements: a value read from the running environment that tells two installations on one host apart |
| `CompromiseCeiling` | `pinnedAt()` | the time the ceiling was fixed |

## Related documents

- [Enforcing the license](./enforcing-the-license.md)
- [Configuration reference](./configuration-reference.md)
- [Troubleshooting](./troubleshooting.md)
