# Activating a license

How a deployment gets its license: online against the license server, offline through a request file, or from a token file placed beside the application. The paths below are those of an application that serves its controllers under `/api`.

## Choose a way

|  | Online | Offline | Token file |
|---|---|---|---|
| Reaches the license server | the deployment | an operator, on its behalf | nobody |
| The seat is taken | automatically | when the server issues the token | when the token was issued |
| Heartbeat | yes | no | no |
| A revocation takes effect | with the next heartbeat | when a new token is registered | when a new token is registered |
| Fits | ordinary operation | closed networks | development and preconfigured installs |

Choose online activation wherever the network allows it: the heartbeat brings revocations, expiry and contract changes to the deployment without anyone touching it.

## Activate online

```bash
curl -X POST "http://localhost:8080/api/deployment-license/activate" \
  -H "Authorization: Bearer <access token>" \
  -H "Content-Type: application/json" \
  -d '{"productKey": "ACPS-XXXX-XXXX-XXXX-XXXX", "replaceExisting": false}'
```

1. The product key is checked against its own checksum before anything is sent, so a typing error is answered at once.
2. The deployment sends the key and the fingerprint of the machine to the license server.
3. The server answers with a signed license token.
4. The token is stored and verified: signature, machine and expiry.
5. The answer is the license status.

| Field of the request | Required | Meaning |
|---|---|---|
| `productKey` | yes | the key issued to the customer |
| `replaceExisting` | no | `true` replaces a valid license that was registered with another key; without it such an activation is refused |

### The license status

Activation, the heartbeat, deactivation and `GET /api/deployment-license/status` all answer with the same body, a `LicenseDTOs.LicenseStatusDTO`.

| Field | Holds |
|---|---|
| `status`, `usable` | the verdict and whether the application may be used |
| `licenseId`, `activationId`, `customer`, `channel` | which license this is, for whom, and how it was registered |
| `productCode`, `tierLabel`, `maxRelease` | the product, the edition and the newest release the license covers |
| `issuedAt`, `activatedAt`, `expiresAt`, `graceExpiresAt`, `gracePeriodDays` | the dates of the license and of its grace period |
| `features` | the features the license grants |
| `limits`, `usage` | the quota of each counted item and how much is in use |
| `heartbeatRequired`, `lastHeartbeatAt`, `lastChecked` | whether the license needs a heartbeat, and when it was last renewed and verified |
| `maskedProductKey` | the product key with its middle hidden |
| `onlineActivationAvailable` | whether a license server is configured |
| `machineFingerprints`, `machineFingerprintAvailable`, `machineIdentifierSources`, `machineIdentifierSourcesUnavailable` | what identifies this machine, and which sources could not be read |
| `publicKeyFingerprint` | the fingerprint of the key this build verifies tokens with |

## Activate offline

For a deployment that cannot reach the license server, an operator carries a request file out and a signed token back.

```bash
# 1. Create the request
curl "http://localhost:8080/api/deployment-license/activation-request?productKey=ACPS-XXXX-XXXX-XXXX-XXXX" \
  -H "Authorization: Bearer <access token>"

# 2. Register the token the license server issued for it
curl -X POST "http://localhost:8080/api/deployment-license/activation-response" \
  -H "Authorization: Bearer <access token>" \
  -H "Content-Type: application/json" \
  -d '{"productKey": "ACPS-XXXX-XXXX-XXXX-XXXX", "licenseToken": "<signed token>", "replaceExisting": false}'
```

- Step 1 answers with a `LicenseDTOs.ActivationRequestFileDTO`: `body`, `nonce` and `requestedAt`. Save `body` as a file and submit it to the license server. The format of the key and the fingerprint of the machine are checked first, so a mistake shows before the file leaves the network.
- The `nonce` ties the answer to this request: only a token issued for it is accepted.
- Step 2 registers the token after its signature and its machine binding were verified. A token issued for another machine is refused with `MACHINE_MISMATCH`.
- An activation that was revoked cannot be brought back by an offline registration. Ask for a new activation.

## Provide a token file

```yaml
application:
  license:
    token-path: ./license.key
```

Put an issued token into the file `token-path` names. The application reads it at start when it has no registration yet.

| Stored registration | The file is |
|---|---|
| none | read and registered |
| valid | ignored |
| refused, and the file holds another token | registered in its place |
| revoked | ignored |

## Heartbeat and re-verification

| Job | Runs | Does |
|---|---|---|
| re-verification | every `re-verification-interval-minutes`, 30 by default, on every deployment | judges the stored registration again, so an expiry takes effect without a restart |
| heartbeat | at the interval the license states, for licenses that require one | fetches a freshly signed token from the license server |

Every `activation.heartbeat-check-interval`, 5 minutes by default, the heartbeat job looks whether the interval of the license has passed, and calls the server only then. The interval is signed into the token in hours; without a value it is one hour. After a failure the job tries again once `activation.heartbeat-retry-interval`, 10 minutes by default, has passed. Both jobs use Spring scheduling, so the application needs `@EnableScheduling`.

```bash
# Renew now, for example right after the contract changed
curl -X POST "http://localhost:8080/api/deployment-license/heartbeat" -H "Authorization: Bearer <access token>"
```

## Move a license to another machine

```bash
curl -X POST "http://localhost:8080/api/deployment-license/deactivate" -H "Authorization: Bearer <access token>"
```

Deactivating gives the seat back to the license server and deletes the local registration. Activate with the same key on the new machine afterwards. An activation on the new machine without that step is refused because the seat is taken; when the old machine cannot be reached, release the seat on the license server.

## Who may call these endpoints

| Endpoint | Needs |
|---|---|
| `GET /deployment-license/status` | `hasPermission('LICENSE', 'view')` |
| `GET /deployment-license/features` | any signed-in user |
| `POST /deployment-license/activate`, `GET /activation-request`, `POST /activation-response`, `POST /heartbeat`, `POST /deactivate` | `hasPermission('LICENSE', 'manage')` |

The `PermissionEvaluator` of the application answers these checks, as for every generated controller.

## During the first installation

An application with a first-run wizard declares a `SetupState` bean. The module then offers the same registration under `/system/setup/license`, reachable without a login until the installation is finished and closed afterwards.

```java
@Component
@RequiredArgsConstructor
public class ApplicationSetupState implements SetupState {

    private final SystemSettingRepository settingRepository;

    @Override
    public boolean isInitialized() {
        return settingRepository.findSetting().map(SystemSetting::isInitialized).orElse(false);
    }

    @Override
    public Optional<String> licenseServerUrl() {
        return settingRepository.findSetting().map(SystemSetting::getLicenseServerUrl);
    }

    @Override
    public void saveLicenseServerUrl(String serverUrl) {
        settingRepository.updateLicenseServerUrl(serverUrl);
    }
}
```

| In operation | During installation |
|---|---|
| `POST /deployment-license/activate` | `POST /system/setup/license/activate` |
| `GET /deployment-license/activation-request` | `GET /system/setup/license/activation-request` |
| `POST /deployment-license/activation-response` | `POST /system/setup/license/activation-response` |
| set in configuration | `POST /system/setup/license/server` stores the address of the license server |

```yaml
simplix:
  license:
    setup:
      token: ${SETUP_TOKEN}
```

> ⚠ The endpoints that change state during installation accept a request that carries this token, or one that comes from the loopback address. Behind a reverse proxy on the same host every request looks like loopback, so set the token for any deployment behind a proxy.

## Related documents

- [Enforcing the license](en/license/enforcing-the-license.md)
- [Configuration reference](en/license/configuration-reference.md)
- [Troubleshooting](en/license/troubleshooting.md)
