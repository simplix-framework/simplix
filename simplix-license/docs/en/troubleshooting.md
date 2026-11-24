# Troubleshooting simplix-license

Symptoms a deployment meets with its license, the cause of each and what to change.

## Starting and activating

| Symptom | Cause | What to do |
|---|---|---|
| The application does not start | the `ProductIdentity` bean is missing, the verification key file is missing, empty or has a faulty entry, or a store implements only one of the two store interfaces | declare the bean, correct the file, or implement `LicenseStore` and `CompromiseCeilingStore` together |
| Every activation is refused by the server | the build verifies with another key than the server signs with, the `product-key-prefix` differs from the key, or the address of `ContactIdentity` differs from the customer record | compare the key fingerprint of the start log with the server, then the prefix, then the contact address |
| Activation fails with `FINGERPRINT_UNAVAILABLE` | no stable identifier of the machine can be read, as in some containers and virtual machines | check `machineFingerprintAvailable` in the status, and give the container a fixed MAC address or machine id |
| An offline token is refused with `MACHINE_MISMATCH` | the token was issued for the request of another machine | create the request on the machine that will run the application |
| The license is gone after the container was replaced | the file store is in use and `state-path` is not on a volume | put the file on a volume, or add JPA so that the database store is chosen |
| The license is never renewed or re-verified while the application runs | the application lacks `@EnableScheduling` | add it |

## Enforcement

| Symptom | Cause | What to do |
|---|---|---|
| Even the license screen answers 403 | `api.version.prefix` differs from the prefix the API is served under, so the open paths are computed wrongly | set `api.version.prefix` to the real prefix |
| Reads work and saves fail with 403 during the grace period | `grace-period-mode` is `READ_ONLY` | this is intended; set `RESTRICTED` to allow writes, with only the feature gate applied |
| The status is `SIGNING_KEY_COMPROMISED` for a token that was issued properly | the key that signed it is marked as leaked in this build, and the token asks for more than the fixed ceiling | upgrade to a release that carries the current signing key and register a token signed with it; a new token signed with the leaked key gives the same result |
| The status is `CLOCK_TAMPERED` | the clock of the host went back behind a time that was observed before | synchronise the clock and verify again; registering a new token does not clear it |
| An endpoint with `@RequiresFeature` is reachable without the feature | Spring AOP is not on the classpath, or the method is called from inside its own bean | add the Spring AOP starter (`spring-boot-starter-aspectj` on the 2.x line, `spring-boot-starter-aop` on the 1.x line), and call `FeatureAccess` where no proxy is passed |
| A registration beyond the contracted number succeeds | no counter covers the code, the code of the counter differs from the code of the license, or `require` is not called | look for the warning about missing counters in the start log, compare the codes, and call `quotaGuard.require` where items are created |
| A refusal shows a message key instead of a text | the message bundles lack the key | add the keys of [Enforcing the license](./enforcing-the-license.md) in every language |

## Related documents

- [How simplix-license works](./how-it-works.md)
- [Activating a license](./activating-a-license.md)
