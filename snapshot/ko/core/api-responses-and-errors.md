# API 응답과 오류

엔드포인트가 모든 SimpliX 클라이언트가 기대하는 형태로 응답하는 방법과, 서비스가 클라이언트에서 처리할 수 있는 코드로 오류를 보고하는 방법을 설명합니다.

## 응답

`SimpliXApiResponse<T>`는 모든 응답의 형식입니다. 팩토리 메서드로 생성하며, `type`은 `SimpliXApiResponse.ResponseType`의 `SUCCESS`, `FAILURE`, `ERROR` 중 하나입니다.

| 필드 | 내용 |
|---|---|
| `type` | `SUCCESS`, `FAILURE`, `ERROR` 중 하나 |
| `message` | 사용자에게 표시하는 문구 |
| `body` | 데이터 |
| `timestamp` | 시간대를 포함한 응답 시각 |
| `errorCode` | `GEN_NOT_FOUND` 같은 오류 코드 |
| `errorDetail` | 오류의 상세 정보: 객체, 목록 또는 문자열 |

값이 없는 필드는 JSON에서 제외합니다.

### 성공

```java
return ResponseEntity.ok(SimpliXApiResponse.success(author));
```

```json
{
  "type" : "SUCCESS",
  "body" : {
    "id" : "a1"
  },
  "timestamp" : "<time with zone>"
}
```

`success(body, message)`도 있지만 성공 응답은 메시지를 유지하지 않으므로, 두 호출의 JSON은 같습니다. 클라이언트가 표시해야 하는 문구는 body에 포함하세요.

### 실패

실패는 요청을 이해했지만 처리할 수 없고, 클라이언트가 직접 처리해야 하는 상황입니다. 소진된 할당량이나 결과가 없는 검색이 여기에 해당합니다. `failure(message)`는 문구를, `failure(data, message)`는 데이터도 함께 전달합니다.

```java
SimpliXApiResponse.failure(Map.of("left", 0), "Quota used up");
```

```json
{
  "type" : "FAILURE",
  "message" : "Quota used up",
  "body" : {
    "left" : 0
  },
  "timestamp" : "<time with zone>"
}
```

### 오류

`error(message)`, `error(message, errorCode)`, `error(message, errorCode, errorDetail)`은 오류 응답을 생성합니다. 애플리케이션에서 직접 호출하는 경우는 드뭅니다. 예외를 발생시키면 [스타터](ko/starter/readme.md)의 예외 핸들러가 응답을 생성합니다.

```java
SimpliXApiResponse.error("Author not found", ErrorCode.GEN_NOT_FOUND.getCode(), Map.of("authorId", "a1"));
```

```json
{
  "type" : "ERROR",
  "message" : "Author not found",
  "timestamp" : "<time with zone>",
  "errorCode" : "GEN_NOT_FOUND",
  "errorDetail" : {
    "authorId" : "a1"
  }
}
```

## 오류 보고

서비스는 `ErrorCode`를 지정한 `SimpliXGeneralException`을 발생시킵니다. 예외 핸들러가 이 예외를 `ERROR` 응답으로 변환하고 HTTP 상태를 해당 코드의 값으로 지정하므로, 서비스는 웹 계층의 코드 없이 상태를 결정합니다.

```java
public Author get(String authorId) {
    return repository.findById(authorId)
        .orElseThrow(() -> new SimpliXGeneralException(
            ErrorCode.GEN_NOT_FOUND,
            "Author not found",
            Map.of("authorId", authorId)
        ));
}
```

| 생성자 | 용도 |
|---|---|
| `(ErrorCode, message, detail)` | 코드를 지정한 오류. 메시지가 `null`이면 코드의 기본 메시지를 사용합니다 |
| `(ErrorCode, message, cause, detail)` | 위와 같으며, 원인 예외를 함께 보관합니다 |
| `(message, errorType)` | 코드를 문자열로 지정합니다. `ErrorCode`에 없는 문자열은 `GEN_INTERNAL_SERVER_ERROR`로 처리합니다 |

| getter | 반환 |
|---|---|
| `getErrorCode()` | `ErrorCode` |
| `getErrorType()` | `GEN_NOT_FOUND` 같은 코드 문자열 |
| `getStatusCode()` | `404 NOT_FOUND` 같은 HTTP 상태 |
| `getDetail()` | 상세 정보 객체. 응답의 `errorDetail`로 전달됩니다 |

> ℹ 코드는 `ErrorCode`의 상수로 정해져 있으며 애플리케이션에서 추가할 수 없습니다. 애플리케이션의 업무 규칙에는 알맞은 `BIZ_` 코드를 사용하고, 애플리케이션 고유의 사유는 `Map.of("reason", "SHELF_FULL")`처럼 상세 정보에 포함하세요.

## 오류 코드

`ErrorCode`에는 코드, 기본 메시지, HTTP 상태, 카테고리(`ErrorCode.ErrorCategory`)가 있습니다. 코드의 접두어가 카테고리입니다.

| 접두어 | 범주 | 대상 |
|---|---|---|
| `GEN_` | `GENERAL` | 리소스 없음, 잘못된 요청, 충돌, 서버 오류 |
| `AUTH_` | `AUTHENTICATION` | 자격 증명이나 토큰이 없거나 유효하지 않음 |
| `AUTHZ_` | `AUTHORIZATION` | 인증은 되었으나 권한이 없는 호출자 |
| `VAL_` | `VALIDATION` | 검증에 실패한 입력 |
| `SEARCH_` | `SEARCH` | 유효하지 않은 검색 조건 |
| `BIZ_` | `BUSINESS` | 애플리케이션 규칙에 따른 요청 거부 |
| `DB_` | `DATABASE` | 데이터베이스 장애 |
| `EXT_` | `EXTERNAL` | 애플리케이션이 호출하는 서비스의 장애 |

```java
ErrorCode code = ErrorCode.fromCode("GEN_NOT_FOUND");

code.getCode();            // GEN_NOT_FOUND
code.getDefaultMessage();  // Resource not found
code.getHttpStatus();      // 404 NOT_FOUND
code.getCategory();        // GENERAL
code.isClientError();      // true
code.isServerError();      // false

ErrorCode.fromCode("NOPE");  // GEN_INTERNAL_SERVER_ERROR
```

`isAuthenticationError()`와 `isAuthorizationError()`는 코드가 해당 카테고리에 속하는지 판정합니다. 모든 코드는 [오류 코드 레퍼런스](ko/core/error-code-reference.md)에 있습니다.

## 재시도 시점 안내

`RetryAfterHint`를 구현한 예외는 클라이언트가 기다릴 시간을 초 단위로 알려 줍니다. 값이 0보다 크면 예외 핸들러가 이 값을 `Retry-After` 헤더에 기록합니다.

## 관련 문서

- [오류 코드 레퍼런스](ko/core/error-code-reference.md)
- [입력 검증](ko/core/validating-input.md)
- [CRUD API 만들기](ko/building-a-crud-api.md)
