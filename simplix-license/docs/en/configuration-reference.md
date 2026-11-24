# Configuration reference

The properties of the module, under `application.license`, and the beans an application contributes.

## Properties

| Property | Default | Meaning |
|---|---|---|
| `token-path` | `./license.key` | the token file read at start when nothing is registered |
| `state-path` | `./license-state.json` | the file of the file store |
| `re-verification-interval-minutes` | `30` | minutes between two verifications of the stored registration |
| `grace-period-mode` | `READ_ONLY` | a `LicenseProperties.GracePeriodMode`: `READ_ONLY` allows reads only during the grace period, `RESTRICTED` allows every request |
| `product-key-prefix` | none | the first part of the product keys; it is part of their checksum |
| `activation.server-url` | none | the license server; empty leaves only file and offline registration |
| `activation.heartbeat-enabled` | `true` | sends heartbeats for licenses that require them |
| `activation.heartbeat-check-interval` | 5 minutes | how often the job looks whether a heartbeat is due |
| `activation.heartbeat-retry-interval` | 10 minutes | the wait after a failed heartbeat |
| `enforcement.http-filter-enabled` | `true` | `false` leaves the request filter out |

The nested class of the activation settings is `LicenseProperties.Activation`.

### Outside `application.license`

| Property | Default | Meaning |
|---|---|---|
| `api.version.prefix` | `/api/v1` | the prefix of the API, from which the open paths of the filters are computed |
| `simplix.license.setup.token` | none | the token a state-changing request of the first-run wizard has to carry when it does not come from loopback |

## Beans of the application

| Bean | Required | Without it |
|---|---|---|
| `ProductIdentity` | yes | the application does not start |
| `QuotaCounter` | no | no quota is enforced; a warning at start |
| `FeatureCatalogue` | no | the gated features are not reported to the server |
| `FeatureActivationChecker` | no | administrators cannot switch features off |
| `AuditRecorder` | no | nothing is recorded |
| `ActivationServerDirectory` | no | `activation.server-url` is used |
| `ContactIdentity` | no | no contact address is reported at activation; with it the server compares the address with the customer record |
| `InstallationDiscriminator` | no | two installations on one host cannot be told apart by the server |
| `SetupState` | no | no first-run wizard endpoints and no installation gate |
| `LicenseStore` with `CompromiseCeilingStore` | no | the JPA store or the file store is chosen |

The resource `src/main/resources/license-verification-keys.json` is required as well; see [Getting started](./getting-started.md).

## Examples

```yaml
# Online
application:
  license:
    product-key-prefix: ACPS
    activation:
      server-url: https://license.example.com
      heartbeat-enabled: true
```

```yaml
# Closed network
application:
  license:
    token-path: /opt/app/license.key
    state-path: /opt/app/data/license-state.json
    activation:
      server-url: ""
      heartbeat-enabled: false
```

## Related documents

- [Getting started](./getting-started.md)
- [How simplix-license works](./how-it-works.md)
