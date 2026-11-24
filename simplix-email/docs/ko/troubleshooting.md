# simplix-email 문제 해결

메일을 발송할 때 발생하는 증상과 원인, 조치를 정리합니다.

| 증상 | 원인 | 조치 |
|---|---|---|
| 결과는 성공인데 메일이 도착하지 않고, 로그에 `EMAIL (Console Provider - Not Actually Sent)` 상자가 출력됨 | 콘솔 프로바이더가 응답했습니다 | 실제 프로바이더를 켜고 `provider`를 해당 값으로 지정하세요 |
| `All email providers failed or unavailable` | 사용할 수 있는 프로바이더가 없습니다. 활성화된 프로바이더가 없고 `provider`가 `CONSOLE`이 아니거나, 라이브러리가 없습니다 | `enabled` 값과 프로바이더의 의존성을 확인하세요. 시작 로그에 서비스가 찾은 프로바이더 목록이 기록됩니다 |
| `Validation failed: At least one recipient is required` 또는 `Subject is required` | 요청에 수신자나 제목이 없습니다 | 모두 지정하세요. 템플릿 발송에서는 템플릿의 제목을 사용합니다 |
| `Template not found: <code>` | 코드에 해당하는 템플릿이 없습니다. 폴더가 없거나, 요청한 언어와 `en` 모두에 `subject.txt`가 없습니다 | `templates/email/<code>/en/subject.txt`와 본문 파일을 작성하세요 |
| 템플릿이 다른 언어로 발송됨 | `sendTemplate(code, to, variables)`는 JVM의 기본 로케일을 사용합니다 | `TemplateEmailRequest`에 수신자의 로케일을 지정해 발송하세요 |
| `SMTP authentication failed` | 인증 정보가 올바르지 않거나, 서버가 앱 비밀번호를 요구하거나 SMTP AUTH가 꺼져 있습니다 | 사서함 제공자의 설정으로 인증 정보를 확인하세요 |
| SES가 인증되지 않은 주소라는 이유로 메시지를 거부함 | 발신자가 인증되지 않았거나 계정이 샌드박스 상태입니다 | 발신 도메인을 인증하고 AWS에 프로덕션 액세스를 요청하세요 |
| 제목이나 본문의 한글이 깨짐 | 템플릿 파일이 UTF-8로 저장되어 있지 않습니다 | 파일을 UTF-8로 저장하세요. 템플릿은 UTF-8로 읽습니다 |

## 관련 문서

- [simplix-email 동작 방식](./how-it-works.md)
- [프로바이더 선택](./choosing-a-provider.md)
