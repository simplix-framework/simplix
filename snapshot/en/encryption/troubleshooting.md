# Troubleshooting simplix-encryption

Symptoms an application meets with encryption, the cause of each and what to change.

| Symptom | Cause | What to do |
|---|---|---|
| Reading a row fails with `DecryptionException: Failed to decrypt data` | the stored value was changed, or it was encrypted with a key the provider no longer has under that version | restore the key of that version; with the configurable provider keep every version that still has rows |
| Every stored value became unreadable after a configuration change | the `static-key` of the simple provider was changed; it keeps one key | put the earlier text back, and move to a provider with versions before changing keys |
| The application does not start in a profile such as `prod` | no key provider matches the profile and the properties | set `simplix.encryption.provider` explicitly, and add Spring Vault for `vault` |
| The application refuses to start with the configurable provider | `current-version` is missing, is not among the keys or is deprecated, or a key is not 32 bytes | correct the configuration; create keys with `openssl rand -base64 32` |
| A save fails because the value is too long for the column | an encrypted value is longer than its text | size the column with the table in [Encrypting columns](en/encryption/encrypting-columns.md) |
| A query by an encrypted column finds nothing | every encryption of the same text gives a different value | search by a hash column |
| Some rows show plain text in the table | they were written before the converter was added and not saved since | read and save them in batches |
| The log shows `SimpleKeyProvider initialized - DO NOT USE IN PRODUCTION` | the simple provider is active | choose `configurable`, `managed` or `vault` outside development |
| `simplix.encryption.vault.namespace` has no effect | no code reads the property | set the namespace with `spring.cloud.vault.namespace` |

## Related documents

- [How simplix-encryption works](en/encryption/how-it-works.md)
- [Choosing a key provider](en/encryption/choosing-a-key-provider.md)
