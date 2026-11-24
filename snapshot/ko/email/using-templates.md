# 템플릿 사용

메시지 문구를 언어별 파일로 관리하고, 발송할 때 값을 채우는 방법을 설명합니다.

## 1단계. 파일 작성

```text
src/main/resources/templates/email
└── loan-due
    ├── en
    │   ├── subject.txt
    │   ├── body.html
    │   └── body.txt
    └── ko
        ├── subject.txt
        └── body.html
```

템플릿은 코드 이름의 폴더이며 언어별 폴더로 구성합니다. `subject.txt`는 필수이고, 본문은 `body.html`, `body.txt` 중 하나 또는 모두를 작성합니다.

```text
Your loan is due on [[${dueDate}]]
```

```html
<p>Hello <span th:text="${name}">reader</span>,</p>
<p><b th:text="${title}">title</b> is due on <span th:text="${dueDate}">date</span>.</p>
```

파일은 Thymeleaf 템플릿입니다. 텍스트 파일에서는 값을 `[[${name}]]`으로 작성하고, HTML에서는 `th:text`로 지정합니다. `th:text`는 값을 이스케이프합니다.

## 2단계. 발송

```java
emailService.sendTemplate(TemplateEmailRequest.builder()
    .templateCode("loan-due")
    .to(List.of(EmailAddress.of("ursula@example.com")))
    .locale(Locale.KOREAN)
    .variables(Map.of("name", "Ursula", "title", "On dragons", "dueDate", "2026-03-09"))
    .build());
```

```text
╠════════════════════════════════════════════════════════════════════════════════╣
║ To: ursula@example.com                                                         ║
║ Subject: 대출 도서 반납일은 2026-03-09입니다                                              ║
║ Priority: NORMAL                                                               ║
╠════════════════════════════════════════════════════════════════════════════════╣
║ HTML Body Preview:                                                             ║
║   Ursula 님, On dragons의 반납일은 2026-03-09입니다.                                    ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

| `TemplateEmailRequest`의 필드 | 기본값 | 의미 |
|---|---|---|
| `templateCode` | 필수 | 템플릿 폴더 |
| `to` | 필수 | 수신자 |
| `variables` | 빈 값 | 템플릿에서 참조하는 값 |
| `locale` | JVM의 기본 로케일 | 템플릿의 언어 |
| `subject` | 템플릿의 제목 | 템플릿의 제목을 대체합니다 |
| `from`, `cc`, `bcc`, `replyTo`, `attachments`, `priority`, `tenantId`, `correlationId`, `tags` | `EmailRequest`와 같음 | 일반 메시지와 같은 필드 |

`sendTemplate(templateCode, to, variables)`는 수신자가 한 명일 때 사용하는 간단한 형태입니다. 로케일 인자가 없어 JVM의 기본 로케일을 사용하며, 이 값은 수신자의 로케일과 다른 경우가 많습니다. 기본 로케일이 한국어인 서버에서는 이 호출이 항상 한국어 문구를 발송합니다. 수신자의 로케일은 `TemplateEmailRequest`로 전달하세요.

## 언어 선택 규칙

1. 로케일의 언어 폴더. `ko_KR`이면 `ko`
2. `en` 폴더. 파일 단위로 적용하므로, `body.txt`가 없는 `ko` 폴더는 영어 텍스트 본문을 사용합니다
3. 어느 쪽에도 `subject.txt`가 없으면 `Template not found: <code>`로 발송에 실패합니다

`en` 폴더는 항상 작성하세요. 작성하지 않은 언어의 수신자에게는 이 폴더의 내용을 발송합니다. 위 템플릿을 프랑스어로 요청하면 영어로 발송됩니다.

## 데이터베이스에 템플릿 보관

관리자가 문구를 수정할 수 있게 하려면, 코드와 언어로 템플릿을 조회하는 함수를 지정해 `DatabaseEmailTemplateResolver`를 등록하세요. 파일보다 먼저 조회하므로, 데이터베이스에 있는 템플릿이 같은 코드의 파일을 대체합니다.

```java
@Bean
public DatabaseEmailTemplateResolver databaseEmailTemplateResolver(MailTemplateRepository repository) {
    return new DatabaseEmailTemplateResolver(
        (code, language) -> repository.findByCodeAndLanguage(code, language)
            .map(row -> new DatabaseEmailTemplateResolver.TemplateData(
                row.getCode(), row.getSubject(), row.getBodyHtml(), row.getBodyText())),
        () -> null
    );
}
```

두 번째 인자는 현재 테넌트를 제공하는 공급자입니다. 리졸버는 이 값을 함수에 전달하지 않으므로, 테넌트별로 템플릿이 다르다면 함수 안에서 테넌트를 직접 조회하세요. `simplix.email.template.database-enabled`는 효과가 없으며, 빈을 등록하면 리졸버가 활성화됩니다.

## 리졸버 직접 작성

다른 위치에서 템플릿을 읽으려면 `EmailTemplateResolver`를 구현하세요. `resolve(templateCode, locale)`은 코드, 제목, HTML 본문, 텍스트 본문, 로케일로 구성된 `EmailTemplateResolver.ResolvedTemplate`을 반환하거나 빈 값을 반환합니다. `exists(templateCode)`는 코드의 존재 여부를 반환하고, `getPriority()`는 리졸버의 순서를 결정하며 값이 클수록 먼저 조회합니다. 파일 리졸버의 우선순위는 0, 데이터베이스 리졸버는 100입니다.

## 발송 없이 렌더링

```java
emailTemplateService.templateExists("loan-due");   // true

EmailRequest preview = emailTemplateService.processTemplate(templateRequest);
preview.getSubject();
preview.getHtmlBody();
```

`EmailTemplateService.processTemplate`은 템플릿을 조회하고 값을 채워, 발송될 `EmailRequest`를 반환합니다. 미리보기 화면에 사용할 수 있습니다. 어느 리졸버에도 없는 코드는 `EmailTemplateService.TemplateNotFoundException`을, 렌더링할 수 없는 템플릿은 `EmailTemplateEngine.EmailTemplateException`을 발생시킵니다.

| 속성 | 기본값 | 의미 |
|---|---|---|
| `simplix.email.template.base-path` | `templates/email` | 템플릿 파일의 클래스패스 폴더 |

## 관련 문서

- [여러 수신자에게 발송](ko/email/sending-to-many-recipients.md)
- [메일 발송](ko/email/sending-mail.md)
