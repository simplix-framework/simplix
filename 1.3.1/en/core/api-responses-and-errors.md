# API responses and errors

How an endpoint answers in the shape every SimpliX client expects, and how a service reports an error with a code a client can act on.

## The response

`SimpliXApiResponse<T>` is the body of every answer. It is created with a factory method, and its `type` is a `SimpliXApiResponse.ResponseType`: `SUCCESS`, `FAILURE` or `ERROR`.

| Field | Holds |
|---|---|
| `type` | `SUCCESS`, `FAILURE` or `ERROR` |
| `message` | a text for the reader |
| `body` | the data |
| `timestamp` | the time of the answer, with its zone |
| `errorCode` | the code of the error, such as `GEN_NOT_FOUND` |
| `errorDetail` | details of the error: an object, a list or a text |

A field without a value is left out of the JSON.

### Success

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

`success(body, message)` exists as well, and a success response keeps no message: the JSON of both calls is the same. Put a text the client has to show into the body.

### Failure

A failure is a request that was understood and could not be fulfilled, and that the client is expected to handle: a quota that is used up, a search with nothing to return. `failure(message)` carries a text, and `failure(data, message)` data as well.

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

### Error

`error(message)`, `error(message, errorCode)` and `error(message, errorCode, errorDetail)` build an error response. An application seldom calls them: it throws an exception, and the exception handler of the [starter](en/starter/readme.md) builds the response.

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

## Report an error

A service throws `SimpliXGeneralException` with an `ErrorCode`. The exception handler turns it into an `ERROR` response with the HTTP status of the code, so the service decides the status without touching the web layer.

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

| Constructor | Use it for |
|---|---|
| `(ErrorCode, message, detail)` | an error with a code; a `null` message takes the default message of the code |
| `(ErrorCode, message, cause, detail)` | the same, keeping the exception that caused it |
| `(message, errorType)` | the code given as text; a text that is not the code of an `ErrorCode` becomes `GEN_INTERNAL_SERVER_ERROR` |

| Getter | Returns |
|---|---|
| `getErrorCode()` | the `ErrorCode` |
| `getErrorType()` | the code as text, such as `GEN_NOT_FOUND` |
| `getStatusCode()` | the HTTP status, such as `404 NOT_FOUND` |
| `getDetail()` | the detail object, which becomes `errorDetail` |

> ℹ The codes are the constants of `ErrorCode`; an application cannot add one. For a rule of the application, throw the `BIZ_` code that fits and put the application's own reason into the detail, for example `Map.of("reason", "SHELF_FULL")`.

## Error codes

An `ErrorCode` carries a code, a default message, an HTTP status and a category, an `ErrorCode.ErrorCategory`. The prefix of the code is its category.

| Prefix | Category | Covers |
|---|---|---|
| `GEN_` | `GENERAL` | not found, bad request, conflict, server errors |
| `AUTH_` | `AUTHENTICATION` | missing or invalid credentials and tokens |
| `AUTHZ_` | `AUTHORIZATION` | a caller who is known and not allowed |
| `VAL_` | `VALIDATION` | input that fails validation |
| `SEARCH_` | `SEARCH` | invalid search conditions |
| `BIZ_` | `BUSINESS` | a rule of the application that refuses the request |
| `DB_` | `DATABASE` | failures of the database |
| `EXT_` | `EXTERNAL` | failures of a service the application calls |

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

`isAuthenticationError()` and `isAuthorizationError()` tell whether a code belongs to those categories. Every code is in the [error code reference](en/core/error-code-reference.md).

## Tell the client when to retry

An exception that implements `RetryAfterHint` says how many seconds the client should wait. The exception handler writes the value to the `Retry-After` header when it is above zero.

## Related documents

- [Error code reference](en/core/error-code-reference.md)
- [Validating input](en/core/validating-input.md)
- [Building a CRUD API](en/building-a-crud-api.md)
