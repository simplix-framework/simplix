# 오류 코드 레퍼런스

`ErrorCode`의 모든 상수와, 예외 핸들러가 응답하는 HTTP 상태, 기본 메시지를 정리합니다. 사용 방법은 [API 응답과 오류](ko/core/api-responses-and-errors.md)에 있습니다.

## 일반

| 코드 | HTTP 상태 | 기본 메시지 |
|---|---|---|
| `GEN_INTERNAL_SERVER_ERROR` | 500 | Internal server error |
| `GEN_BAD_REQUEST` | 400 | Bad request |
| `GEN_NOT_FOUND` | 404 | Resource not found |
| `GEN_METHOD_NOT_ALLOWED` | 405 | Method not allowed |
| `GEN_CONFLICT` | 409 | Conflict |
| `GEN_GONE` | 410 | Resource is gone |
| `GEN_SERVICE_UNAVAILABLE` | 503 | Service unavailable |
| `GEN_TIMEOUT` | 408 | Request timeout |
| `INTERNAL_SERVER_ERROR` | 500 | Internal server error |
| `NOT_FOUND` | 404 | Resource not found |

## 인증

| 코드 | HTTP 상태 | 기본 메시지 |
|---|---|---|
| `AUTH_AUTHENTICATION_REQUIRED` | 401 | Authentication required |
| `AUTH_INVALID_CREDENTIALS` | 401 | Invalid credentials |
| `AUTH_TOKEN_EXPIRED` | 401 | Token expired |
| `AUTH_TOKEN_INVALID` | 401 | Invalid token |
| `AUTH_SESSION_EXPIRED` | 401 | Session expired |
| `AUTHENTICATION_FAILED` | 401 | Authentication failed |
| `TOKEN_EXPIRED` | 401 | Token expired |

## 인가

| 코드 | HTTP 상태 | 기본 메시지 |
|---|---|---|
| `AUTHZ_INSUFFICIENT_PERMISSIONS` | 403 | Insufficient permissions |
| `AUTHZ_ACCESS_DENIED` | 403 | Access denied |
| `AUTHZ_RESOURCE_FORBIDDEN` | 403 | Resource access forbidden |
| `INSUFFICIENT_PERMISSIONS` | 403 | Insufficient permissions |

## 검증

| 코드 | HTTP 상태 | 기본 메시지 |
|---|---|---|
| `VAL_VALIDATION_FAILED` | 400 | Validation failed |
| `VAL_INVALID_PARAMETER` | 400 | Invalid parameter |
| `VAL_MISSING_PARAMETER` | 400 | Missing required parameter |
| `VAL_INVALID_FORMAT` | 400 | Invalid format |
| `VAL_CONSTRAINT_VIOLATION` | 400 | Constraint violation |
| `VALIDATION_FAILED` | 400 | Validation failed |

## 검색

| 코드 | HTTP 상태 | 기본 메시지 |
|---|---|---|
| `SEARCH_INVALID_PARAMETER` | 400 | Invalid search parameter |
| `SEARCH_INVALID_SORT_FIELD` | 400 | Invalid sort field |
| `SEARCH_INVALID_FILTER_OPERATOR` | 400 | Invalid filter operator |
| `SEARCH_INVALID_QUERY_SYNTAX` | 400 | Invalid query syntax |
| `INVALID_SEARCH_PARAMETER` | 400 | Invalid search parameter |
| `INVALID_SORT_FIELD` | 400 | Invalid sort field |

## 비즈니스

| 코드 | HTTP 상태 | 기본 메시지 |
|---|---|---|
| `BIZ_BUSINESS_LOGIC_ERROR` | 422 | Business logic error |
| `BIZ_DUPLICATE_RESOURCE` | 409 | Duplicate resource |
| `BIZ_RESOURCE_LOCKED` | 423 | Resource is locked |
| `BIZ_INVALID_STATE` | 422 | Invalid state transition |
| `BIZ_QUOTA_EXCEEDED` | 429 | Quota exceeded |
| `BIZ_PAYMENT_REQUIRED` | 402 | Payment required |

## 데이터베이스

| 코드 | HTTP 상태 | 기본 메시지 |
|---|---|---|
| `DB_DATABASE_ERROR` | 500 | Database error |
| `DB_TRANSACTION_FAILED` | 500 | Transaction failed |
| `DB_CONNECTION_ERROR` | 500 | Database connection error |
| `DB_DEADLOCK_DETECTED` | 409 | Database deadlock detected |

## 외부 서비스

| 코드 | HTTP 상태 | 기본 메시지 |
|---|---|---|
| `EXT_SERVICE_ERROR` | 502 | External service error |
| `EXT_SERVICE_UNAVAILABLE` | 503 | External service unavailable |
| `EXT_SERVICE_TIMEOUT` | 504 | External service timeout |
