# Troubleshooting simplix-email

Symptoms an application meets when it sends mail, the cause of each and what to change.

| Symptom | Cause | What to do |
|---|---|---|
| The result is a success and no mail arrives; the log shows a box titled `EMAIL (Console Provider - Not Actually Sent)` | the console provider answered | switch a real provider on and set `provider` to it |
| `All email providers failed or unavailable` | no provider is available: none is enabled and `provider` is not `CONSOLE`, or a library is missing | check the `enabled` flags and the dependencies of the provider; the start log lists the providers the service found |
| `Validation failed: At least one recipient is required`, or `Subject is required` | the request lacks a recipient or a subject | set both; a template supplies its own subject |
| `Template not found: <code>` | no resolver knows the code: the folder is missing, or it has no `subject.txt` in the language of the request or in `en` | create `templates/email/<code>/en/subject.txt` and a body file |
| A template is sent in the wrong language | `sendTemplate(code, to, variables)` uses the default locale of the JVM | send with `TemplateEmailRequest` and the locale of the reader |
| `SMTP authentication failed` | wrong credentials, or the server wants an app password or has SMTP AUTH switched off | check the credentials with the provider of the mailbox |
| SES refuses the message because the address is not verified | the sender is not verified, or the account is in the sandbox | verify the sender domain and ask AWS for production access |
| Hangul in the subject or the body is unreadable | the template file is not saved as UTF-8 | save the files as UTF-8; they are read in that encoding |

## Related documents

- [How simplix-email works](./how-it-works.md)
- [Choosing a provider](./choosing-a-provider.md)
