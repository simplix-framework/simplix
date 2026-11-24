# 설정 레퍼런스

`simplix.email` 아래에 있는 모듈의 모든 속성을 정리합니다.

## 모듈과 발신자

| 속성 | 기본값 | 의미 |
|---|---|---|
| `enabled` | `true` | 모듈 사용 여부 |
| `provider` | `CONSOLE` | `CONSOLE`이면 콘솔 프로바이더를 사용할 수 있고, 다른 값(`SMTP`, `AWS_SES`, `SENDGRID`, `RESEND`)이면 사용할 수 없습니다 |
| `from.address` | 없음 | 발신자를 지정하지 않은 메시지의 발신자 |
| `from.name` | 없음 | 해당 발신자의 표시 이름 |

## SMTP

| 속성 | 기본값 | 의미 |
|---|---|---|
| `smtp.enabled` | `false` | SMTP 프로바이더 등록 |
| `smtp.host` | 없음 | 서버 |
| `smtp.port` | `587` | 포트 |
| `smtp.username`, `smtp.password` | 없음 | 인증 정보 |
| `smtp.starttls` | `true` | STARTTLS로 연결을 암호화 |
| `smtp.ssl` | `false` | 처음부터 TLS로 연결 |
| `smtp.connection-timeout` | `10000` | 연결 대기 시간(밀리초) |
| `smtp.timeout` | `10000` | 응답 대기 시간(밀리초) |

## AWS SES, SendGrid, Resend

| 속성 | 기본값 | 의미 |
|---|---|---|
| `aws-ses.enabled` | `false` | SES 프로바이더 등록 |
| `aws-ses.region` | 없음 | AWS 리전 |
| `aws-ses.access-key`, `aws-ses.secret-key` | 없음 | 고정 인증 정보. 지정하지 않으면 기본 인증 체인을 사용합니다 |
| `aws-ses.configuration-set` | 없음 | SES 구성 세트 |
| `sendgrid.enabled` | `false` | SendGrid 프로바이더 등록 |
| `sendgrid.api-key` | 없음 | API 키 |
| `resend.enabled` | `false` | Resend 프로바이더 등록 |
| `resend.api-key` | 없음 | API 키 |

## 템플릿과 비동기 발송

| 속성 | 기본값 | 의미 |
|---|---|---|
| `template.base-path` | `templates/email` | 템플릿 파일의 클래스패스 폴더 |
| `template.database-enabled` | `false` | 효과가 없습니다. 이 값을 읽는 코드가 없으므로 `DatabaseEmailTemplateResolver` 빈을 선언하세요 |
| `async.core-pool-size` | `2` | 대기 상태로 유지하는 스레드 수 |
| `async.max-pool-size` | `10` | 최대 스레드 수 |
| `async.queue-capacity` | `100` | 스레드를 기다리는 메시지 수 |
| `async.thread-name-prefix` | `email-async-` | 스레드 이름 |

## 전체 예시

```yaml
simplix:
  email:
    provider: AWS_SES
    from:
      address: library@example.com
      name: Library
    aws-ses:
      enabled: true
      region: ap-northeast-2
    smtp:
      enabled: true
      host: smtp.example.com
      port: 587
      username: ${SMTP_USERNAME}
      password: ${SMTP_PASSWORD}
    template:
      base-path: templates/email
    async:
      core-pool-size: 2
      max-pool-size: 10
      queue-capacity: 100
```

## 관련 문서

- [프로바이더 선택](./choosing-a-provider.md)
- [simplix-email 동작 방식](./how-it-works.md)
