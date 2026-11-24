# 키 교체

암호화 키를 교체하는 방법을 설명합니다. 저장된 값마다 키 버전이 기록되어 있으므로 일괄 전환 시점이 필요 없습니다. 새 값은 즉시 새 키를 사용하고, 기존 값은 계속 읽을 수 있으며, 기존 행은 원하는 속도로 재암호화합니다.

## 1단계. 새 키 추가

configurable 프로바이더에서는 버전을 추가해 현재 버전으로 지정하고, 이전 버전을 deprecated로 표시합니다. 그다음 인스턴스를 재시작합니다.

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

managed 프로바이더는 현재 키가 `rotation.days`보다 오래되면 새 키를 직접 생성하고, vault 프로바이더는 Vault에 지정된 버전을 따릅니다.

## 2단계. 기존 행 재암호화

버전 접두어가 현재 버전이 아닌 값을 찾아 `reencrypt`로 다시 저장하세요. 사용량이 적은 시간에 배치 단위로 처리합니다.

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

변환기를 거치면 평문이 반환되므로 쿼리로 컬럼을 직접 조회합니다. 반환되는 행이 없을 때까지 반복하세요.

## 3단계. 이전 키 제거

이전 접두어를 사용하는 행이 없으면 설정이나 저장소에서 이전 버전을 제거합니다. 이 키로 암호화한 백업을 보관하는 동안에는 키 사본을 보관하세요. 백업을 복원할 때 필요합니다.

## 관련 문서

- [키 프로바이더 선택](./choosing-a-key-provider.md)
- [코드에서 값 암호화](./encrypting-values-in-code.md)
