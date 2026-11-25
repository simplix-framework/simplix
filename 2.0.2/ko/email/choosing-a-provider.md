# 프로바이더 선택

메일을 전달하는 서비스의 선택 기준, 프로바이더별 설정 방법, 프로바이더에 장애가 발생했을 때 다른 프로바이더로 전환되는 방식을 설명합니다.

| 프로바이더 | 전달 경로 | 필요 사항 | 적합한 경우 |
|---|---|---|---|
| `CONSOLE` | 로그. 실제로 발송하지 않습니다 | 없음 | 개발과 테스트 |
| `SMTP` | SMTP 서버 | 호스트와 인증 정보 | 이미 보유한 메일 서버: 사내 서버, Google Workspace, Microsoft 365 |
| `AWS_SES` | Amazon SES API | `software.amazon.awssdk:sesv2`, 리전과 인증 정보 | AWS에서 운영하는 애플리케이션과 대량 발송 |
| `SENDGRID` | SendGrid API | `com.sendgrid:sendgrid-java`와 API 키 | 카테고리별 전달 통계 |
| `RESEND` | Resend API | `com.resend:resend-java`와 API 키 | API 키만으로 구성하는 간단한 환경 |

## 프로바이더 활성화 방식

- 실제 프로바이더는 각각의 속성(`smtp.enabled`, `aws-ses.enabled`, `sendgrid.enabled`, `resend.enabled`)으로 등록합니다. 여러 개를 동시에 켤 수 있습니다.
- `simplix.email.provider`는 콘솔 프로바이더의 사용 여부만 결정합니다. 기본값인 `CONSOLE`이면 콘솔 프로바이더를 사용할 수 있고, 다른 값이면 사용할 수 없습니다.
- `provider`에는 사용하는 프로바이더를 지정하세요. 실제 프로바이더에 장애가 발생했을 때 메시지가 로그에만 출력되고 끝나는 일을 막을 수 있습니다.

## SMTP

```yaml
simplix:
  email:
    provider: SMTP
    from:
      address: library@example.com
      name: Library
    smtp:
      enabled: true
      host: smtp.example.com
      port: 587
      username: ${SMTP_USERNAME}
      password: ${SMTP_PASSWORD}
      starttls: true
      ssl: false
      connection-timeout: 10000
      timeout: 10000
```

| 서버 | 호스트 | 포트 | 참고 |
|---|---|---|---|
| STARTTLS를 사용하는 서버 | 보유한 호스트 | `587` | 기본값인 `starttls: true` |
| 암시적 TLS를 사용하는 서버 | 보유한 호스트 | `465` | `ssl: true`, `starttls: false` |
| Gmail과 Google Workspace | `smtp.gmail.com` | `587` | 계정 비밀번호가 아닌 앱 비밀번호를 사용합니다 |
| Microsoft 365 | `smtp.office365.com` | `587` | 사서함에 SMTP AUTH가 허용되어 있어야 합니다 |
| SMTP 방식의 Amazon SES | `email-smtp.<region>.amazonaws.com` | `587` | 액세스 키와 다른 SES 전용 SMTP 인증 정보를 사용합니다 |

## AWS SES

```groovy
dependencies {
    implementation platform("software.amazon.awssdk:bom:${awsSdkVersion}")
    implementation "software.amazon.awssdk:sesv2"
}
```

```yaml
simplix:
  email:
    provider: AWS_SES
    aws-ses:
      enabled: true
      region: ap-northeast-2
      configuration-set: library-mail
      access-key: ${AWS_ACCESS_KEY_ID}
      secret-key: ${AWS_SECRET_ACCESS_KEY}
```

`access-key`와 `secret-key`를 지정하지 않으면 인스턴스 역할 같은 AWS SDK의 기본 인증 체인을 사용합니다. 발신 주소나 도메인은 SES에서 인증되어 있어야 하며, SES 샌드박스 상태의 계정은 인증된 주소로만 발송할 수 있습니다. `configuration-set`에는 전달 이벤트를 수집하는 SES 구성 세트 이름을 지정합니다.

## SendGrid

```groovy
dependencies {
    implementation "com.sendgrid:sendgrid-java:${sendGridVersion}"
}
```

```yaml
simplix:
  email:
    provider: SENDGRID
    sendgrid:
      enabled: true
      api-key: ${SENDGRID_API_KEY}
```

API 키에는 메일 발송 권한이 있어야 하고, 발신자는 SendGrid에서 인증되어 있어야 합니다. 메시지의 `tags`는 SendGrid 카테고리로 전달됩니다.

## Resend

```groovy
dependencies {
    implementation "com.resend:resend-java:${resendVersion}"
}
```

```yaml
simplix:
  email:
    provider: RESEND
    resend:
      enabled: true
      api-key: ${RESEND_API_KEY}
```

발신자의 도메인은 Resend에서 인증되어 있어야 합니다.

## 프로바이더별 메시지 반영 범위

| 필드 | SMTP | AWS SES | SendGrid | Resend |
|---|---|---|---|---|
| `priority` | ✔ 메일 헤더로 전달 | ✖ | ✖ | ✖ |
| `tags` | ✖ | ✔ | ✔ 카테고리로 전달 | ✔ |
| `headers` | ✖ | ✔ | ✔ | ✖ |

## 다른 프로바이더로 장애 전환

```yaml
simplix:
  email:
    provider: AWS_SES
    aws-ses:
      enabled: true
      region: ap-northeast-2
    smtp:
      enabled: true
      host: smtp.example.com
      username: ${SMTP_USERNAME}
      password: ${SMTP_PASSWORD}
```

프로바이더를 여러 개 켜면 서비스는 정해진 순서로 시도하고, 메시지를 처음 접수한 프로바이더에서 멈춥니다.

| 순서 | 프로바이더 | 우선순위 |
|---|---|---|
| 1 | `AWS_SES` | 100 |
| 2 | `RESEND` | 55 |
| 3 | `SENDGRID` | 50 |
| 4 | `SMTP` | 10 |
| 5 | `CONSOLE` | -100 |

- 타임아웃, 속도 제한, 서버 오류처럼 프로바이더가 재시도 가능으로 표시한 실패가 발생하면 서비스가 다음 프로바이더를 시도합니다.
- 거부된 주소나 잘못된 인증 정보처럼 재시도할 수 없는 실패는 즉시 반환합니다. 다른 프로바이더도 같은 요청을 거부하기 때문입니다.
- 모든 프로바이더가 실패했거나 사용할 수 있는 프로바이더가 없으면 `All email providers failed or unavailable` 실패 결과를 반환합니다.
- 서비스는 자체적으로 다시 발송하지 않습니다. `retryable`이 true인 결과는 애플리케이션에서 큐에 넣어 다시 발송하세요.

## 프로바이더 직접 작성

다른 서비스로 발송하려면 `EmailProvider`를 구현한 빈을 선언하세요. `send(request)`는 `EmailResult`를 반환하고, `getType()`은 `MailProviderType`을, `isAvailable()`은 현재 발송 가능 여부를 반환하며, `getPriority()`로 위 순서의 위치가 결정됩니다. `AbstractEmailProvider`는 요청을 검사하고 발송을 로그에 기록하는 기반 클래스이며, 전달 부분만 직접 구현하면 됩니다. `supportsBulkSend()`는 프로바이더가 대량 요청을 한 번의 호출로 발송하는지 반환하며, 재정의하지 않으면 `false`입니다. 나중에 성공할 수 있는 실패는 `EmailResult.retryableFailure(message, code, type)`로 보고하고, 메시지 형식은 `EmailRequest.hasAttachments()`로 판단해 선택합니다.

## 관련 문서

- [설정 레퍼런스](ko/email/configuration-reference.md)
- [문제 해결](ko/email/troubleshooting.md)
