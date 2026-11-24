# simplix-email 동작 방식

발송을 처리하는 클래스, 모듈이 등록하는 구성, 메시지가 처리 과정에서 중단될 수 있는 지점을 설명합니다.

## 메시지 처리 과정

1. 애플리케이션이 `EmailService`를 호출합니다. 이 빈은 `DefaultEmailService`입니다.
2. 템플릿 발송이면 `EmailTemplateService`가 우선순위가 높은 순서로 `EmailTemplateResolver` 빈에 템플릿을 요청하고, `EmailTemplateEngine`이 Thymeleaf로 변수를 채웁니다. 어느 리졸버에도 없는 코드는 이 단계에서 실패 결과로 종료됩니다.
3. 발신자가 없는 메시지에는 `simplix.email.from`의 주소를 적용합니다.
4. 서비스는 `EmailProvider` 빈을 우선순위 순서로 시도하며, `isAvailable()`이 false인 프로바이더는 건너뜁니다.
5. 프로바이더는 요청을 검사하고(수신자와 제목은 필수), 메일 서비스에 전달한 뒤 `EmailResult`를 반환합니다.
6. 성공했거나 재시도할 수 없는 실패이면 결과를 반환합니다. 재시도 가능한 실패이면 다음 프로바이더를 시도합니다.

## 모듈이 등록하는 구성

`EmailAutoConfiguration`이 `simplix.email`을 `EmailProperties`에 바인딩하고 아래 빈을 등록합니다. `simplix.email.enabled`가 `false`이면 등록하지 않습니다. 애플리케이션에 같은 타입의 빈이 있으면 해당 빈은 등록하지 않습니다.

| 빈 | 등록 조건 | 역할 |
|---|---|---|
| `EmailService` | 항상 | 애플리케이션이 호출하는 서비스 |
| `ConsoleEmailProvider` | 항상. `provider: CONSOLE`일 때만 사용할 수 있습니다 | 메시지를 로그에 출력합니다 |
| `SmtpEmailProvider`와 `JavaMailSender` | `smtp.enabled: true` | SMTP 서버로 발송합니다 |
| `AwsSesConfiguration`의 `AwsSesEmailProvider` | `aws-ses.enabled: true`이고 SES SDK가 클래스패스에 있을 때 | Amazon SES로 발송합니다 |
| `SendGridConfiguration`의 `SendGridEmailProvider` | `sendgrid.enabled: true`이고 SendGrid 라이브러리가 클래스패스에 있을 때 | SendGrid로 발송합니다 |
| `ResendConfiguration`의 `ResendEmailProvider` | `resend.enabled: true`이고 Resend 라이브러리가 클래스패스에 있을 때 | Resend로 발송합니다 |
| `ClasspathEmailTemplateResolver` | 항상 | `template.base-path`에서 템플릿을 읽습니다 |
| `EmailTemplateService`, `EmailTemplateEngine` | 항상 | 템플릿을 조회하고 렌더링합니다. 텍스트용과 HTML용 Thymeleaf 엔진을 따로 사용합니다 |
| `emailAsyncExecutor` | 항상 | 비동기 발송에 사용하는 스레드 풀 |

## 모듈이 처리하지 않는 범위

- 실패한 메시지를 큐에 넣거나 다시 발송하지 않습니다. 결과에는 재시도 가능 여부만 포함되며, 재시도는 애플리케이션에서 처리합니다.
- 프로바이더가 메시지를 접수한 이후의 상태를 추적하지 않습니다. 전달, 반송, 수신 거부 신고는 프로바이더의 웹훅이나 이벤트 스트림으로 확인합니다.
- 주소 형식을 검사하지 않으며 발송 금지 주소 목록을 관리하지 않습니다.
- 발송 속도를 제한하지 않습니다. 대량으로 발송하는 코드에서 프로바이더의 한도를 넘지 않도록 조절하세요.

`EmailTemplateEngine`도 빈입니다. `processText(template, variables, locale)`와 `processHtml(template, variables, locale)`은 텍스트 하나를 텍스트 문법 또는 HTML 문법으로 렌더링합니다. `process(resolvedTemplate, variables, locale)`는 조회된 템플릿의 제목과 본문을 렌더링하며, 본문의 존재 여부는 템플릿의 `hasHtmlBody()`와 `hasTextBody()`로 확인합니다.

## 관련 문서

- [프로바이더 선택](./choosing-a-provider.md)
- [설정 레퍼런스](./configuration-reference.md)
- [문제 해결](./troubleshooting.md)
