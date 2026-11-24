# Using templates

How to keep the text of a message in files, one set per language, and fill it with values when it is sent.

## Step 1. Write the files

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

A template is a folder named by its code, with a folder per language. `subject.txt` is required; a body is `body.html`, `body.txt` or both.

```text
Your loan is due on [[${dueDate}]]
```

```html
<p>Hello <span th:text="${name}">reader</span>,</p>
<p><b th:text="${title}">title</b> is due on <span th:text="${dueDate}">date</span>.</p>
```

The files are Thymeleaf templates. In a text file a value is written `[[${name}]]`; in HTML it is set with `th:text`, which also escapes the value.

### Template syntax

| In a text file (`subject.txt`, `body.txt`) | In `body.html` | Does |
|---|---|---|
| `[(${name})]` | `th:utext="${name}"` | writes the value as it is |
| `[[${name}]]` | `th:text="${name}"` | writes the value with HTML characters escaped |
| `[# th:if="${overdue}"]...[/]` | `th:if="${overdue}"` on an element | keeps the part only when the condition holds |
| `[# th:each="book : ${books}"]...[/]` | `th:each="book : ${books}"` on an element | repeats the part for every item |

```text
[(${memberName})], you have [(${books.size()})] books due.[# th:if="${overdue}"] Some are overdue.[/][# th:each="book : ${books}"] - [(${book})][/]
```

With `memberName` Ursula, the books Dune and Kindred and `overdue` true, this text renders as `Ursula, you have 2 books due. Some are overdue. - Dune - Kindred`. A variable that was not passed renders as nothing, without an error: check required values before sending.

## Step 2. Send it

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

| Field of `TemplateEmailRequest` | Default | Meaning |
|---|---|---|
| `templateCode` | required | the folder of the template |
| `to` | required | the recipients |
| `variables` | empty | the values the template refers to |
| `locale` | the default locale of the JVM | the language of the template |
| `subject` | that of the template | replaces the subject of the template |
| `from`, `cc`, `bcc`, `replyTo`, `attachments`, `priority`, `tenantId`, `correlationId`, `tags` | as in `EmailRequest` | the same fields as a plain message |

`sendTemplate(templateCode, to, variables)` is the short form for one recipient. It has no locale argument and uses the default locale of the JVM, which is seldom that of the reader: on a server whose default is Korean, every such call sends the Korean text. Pass the locale of the reader with `TemplateEmailRequest`.

## Which language is used

1. the folder of the language of the locale, such as `ko` for `ko_KR`
2. the `en` folder, file by file: a `ko` folder without `body.txt` takes the English text body
3. when no `subject.txt` is found either way, the send fails with `Template not found: <code>`

Always provide the `en` folder: it is what a reader in a language you have not written gets. A request in French for the template above is sent in English.

## Keep templates in a database

To let administrators edit the texts, register a `DatabaseEmailTemplateResolver` with a function that finds a template by code and language. It is asked before the files, so a template that exists in the database replaces the file of the same code.

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

The second argument is a supplier of the current tenant. The resolver does not pass its value to the function, so look the tenant up inside the function when templates differ per tenant. `simplix.email.template.database-enabled` has no effect; the resolver is active once the bean exists.

## A resolver of your own

Implement `EmailTemplateResolver` to read templates from anywhere else. `resolve(templateCode, locale)` returns an `EmailTemplateResolver.ResolvedTemplate` with the code, the subject, the HTML and text bodies and the locale, or empty; `exists(templateCode)` tells whether the code is known; `getPriority()` orders the resolvers, highest first. The file resolver has priority 0 and the database resolver 100.

## Render without sending

```java
emailTemplateService.templateExists("loan-due");   // true

EmailRequest preview = emailTemplateService.processTemplate(templateRequest);
preview.getSubject();
preview.getHtmlBody();
```

`EmailTemplateService.processTemplate` resolves and fills a template and returns the `EmailRequest` that would be sent, which is what a preview screen needs. A code no resolver knows throws `EmailTemplateService.TemplateNotFoundException`, and a template that cannot be rendered throws `EmailTemplateEngine.EmailTemplateException`.

| Property | Default | Meaning |
|---|---|---|
| `simplix.email.template.base-path` | `templates/email` | the classpath folder of the template files |

```java
String message = emailTemplateService.render(
    "[(${memberName})], your loan is due on [(${dueDate})].",
    Map.of("memberName", "Ursula", "dueDate", "2 March"),
    Locale.ENGLISH);
```

`render(template, variables, locale)` renders a text you pass, in the text syntax above, without a template file. Use it for short messages of other channels that share the variables of a mail.

## Related documents

- [Sending to many recipients](./sending-to-many-recipients.md)
- [Sending mail](./sending-mail.md)
