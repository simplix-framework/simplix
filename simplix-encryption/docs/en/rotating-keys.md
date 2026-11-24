# Rotating keys

How to replace an encryption key. Because every stored value names its key version, a rotation has no cut-over moment: new values use the new key at once, old values stay readable, and the old rows are re-encrypted at your pace.

## Step 1. Add the new key

With the configurable provider, add a version, make it current and mark the earlier one deprecated. Then restart the instances.

```yaml
simplix:
  encryption:
    provider: configurable
    configurable:
      current-version: v2
      keys:
        v1:
          key: ${ENCRYPTION_KEY_V1}
          deprecated: true
        v2:
          key: ${ENCRYPTION_KEY_V2}
```

The managed provider creates the new key itself when the current one is older than `rotation.days`, and the Vault provider follows the version named in Vault.

## Step 2. Re-encrypt the old rows

Find the values whose version prefix is not the current one, and write them back through `reencrypt`. Work in batches, outside peak hours.

```java
@Transactional
public int reencryptReaders(int batchSize) {
    String current = keyProvider.getCurrentVersion();
    List<Map<String, Object>> rows = jdbcTemplate.queryForList(
        "SELECT reader_id, email FROM readers WHERE email NOT LIKE ? LIMIT ?", current + ":%", batchSize);

    for (Map<String, Object> row : rows) {
        String renewed = encryptionService.reencrypt((String) row.get("email")).getData();
        jdbcTemplate.update("UPDATE readers SET email = ? WHERE reader_id = ?", renewed, row.get("reader_id"));
    }
    return rows.size();
}
```

The query reads the column directly, since the converter would hand the code the plain text. Repeat until it returns no rows.

## Step 3. Retire the old key

When no row carries the old prefix, remove the old version from the configuration or the store. Keep a copy of the key for as long as backups encrypted with it are kept: a restored backup needs it.

## Related documents

- [Choosing a key provider](./choosing-a-key-provider.md)
- [Encrypting values in code](./encrypting-values-in-code.md)
