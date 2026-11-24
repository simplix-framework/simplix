"""Figures for spring-boot-starter-simplix (README*.md and docs/{en,ko} of the module)."""
from common import CONTENT_W, STROKE, canvas, card, card_h, figure, note, row, save

LANGS = ("en", "ko")
X0 = 38

LABELS = {
    "starter-readme-what-it-configures": {
        "en": [("Web answers", ["SimpliXBaseController", "SimpliXExceptionHandler", "X-Trace-Id header"]),
               ("Persistence", ["SimpliXBaseService", "JPA auditing", "tree repositories"]),
               ("Messages and validation", ["application bundles", "module bundles", "translated constraints"]),
               ("Dates and time zones", ["application time zone", "UTC in the database", "X-Timezone header"]),
               ("API document", ["OpenAPI customizers", "Swagger UI", "Scalar"]),
               ("Client metadata", ["/dev/meta/dto", "/dev/i18n"])],
        "ko": [("웹 응답", ["SimpliXBaseController", "SimpliXExceptionHandler", "X-Trace-Id 헤더"]),
               ("영속성", ["SimpliXBaseService", "JPA 감사", "트리 저장소"]),
               ("메시지와 검증", ["애플리케이션 번들", "모듈 번들", "번역된 제약 메시지"]),
               ("날짜와 시간대", ["애플리케이션 시간대", "데이터베이스의 UTC 저장", "X-Timezone 헤더"]),
               ("API 문서", ["OpenAPI 커스터마이저", "Swagger UI", "Scalar"]),
               ("클라이언트 메타데이터", ["/dev/meta/dto", "/dev/i18n"])],
    },
    "starter-handling-errors-flow": {
        "en": {"stages": [("Controller or service", ["SimpliXGeneralException", "failed validation", "unexpected exception"]),
                          ("SimpliXExceptionHandler", ["error code and status", "message for the locale", "internal message hidden"]),
                          ("Response", ["SimpliXApiResponse of type ERROR", "HTTP status of the code", "X-Trace-Id header"])],
               "verdict": "Every error reaches the client in one shape, with an id that finds its log lines"},
        "ko": {"stages": [("컨트롤러 · 서비스", ["SimpliXGeneralException", "검증 실패", "예상하지 못한 예외"]),
                          ("SimpliXExceptionHandler", ["오류 코드와 상태 결정", "요청 언어의 메시지 조회", "내부 메시지는 로그에만 기록"]),
                          ("응답", ["ERROR 타입의 SimpliXApiResponse", "코드의 HTTP 상태", "X-Trace-Id 헤더"])],
               "verdict": "모든 오류를 같은 형태로 응답하고, 로그를 찾을 수 있는 ID를 함께 전달"},
    },
}


@figure()
def fig_what_it_configures(lang):
    """The starter configures six areas of an application."""
    fid = "starter-readme-what-it-configures"
    groups = LABELS[fid][lang]
    c = canvas(1200, 520)
    accents = [c.blue, c.teal, c.orange, c.purple, c.green, c.red]
    gap = 24
    xs, w = row(3, gap, width=CONTENT_W, x0=X0)
    h = max(card_h(w, title, lines) for title, lines in groups)
    y = 28
    for r in range(2):
        for k in range(3):
            title, lines = groups[3 * r + k]
            card(c, xs[k], y, w, accents[3 * r + k], title, lines, h=h)
        y += h + gap
    save(c, f"{fid}.{lang}")


@figure()
def fig_error_flow(lang):
    """An exception becomes a SimpliXApiResponse with a code, a status and a trace id."""
    fid = "starter-handling-errors-flow"
    t = LABELS[fid][lang]
    c = canvas(1200, 420)
    fg = c.t["fg_dim"]
    gap = 56
    xs, w = row(3, gap, width=CONTENT_W, x0=X0)
    accents = [c.orange, c.blue, c.green]
    h = max(card_h(w, name, lines) for name, lines in t["stages"])
    top = 28
    for x, acc, (name, lines) in zip(xs, accents, t["stages"]):
        card(c, x, top, w, acc, name, lines, h=h)
    for i in range(2):
        c.line(xs[i] + w, top + h / 2, xs[i + 1], top + h / 2, color=fg, sw=STROKE, marker=fg)
    note(c, X0, top + h + 26, CONTENT_W, t["verdict"], c.green)
    save(c, f"{fid}.{lang}")


for _lang in LANGS:
    fig_what_it_configures(_lang)
    fig_error_flow(_lang)
