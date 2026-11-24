"""Figures for simplix-email (README*.md and docs/{en,ko} of the module)."""
from common import CONTENT_W, STROKE, canvas, card, card_h, figure, row, save

LANGS = ("en", "ko")
X0 = 38

LABELS = {
    "email-readme-send-path": {
        "en": {"request": ("Request", ["a message", "a template", "a list of recipients"]),
               "service": ("EmailService", ["fills the template", "sets the sender", "tries each provider"]),
               "providers": [("AWS SES", ["priority 100"]), ("Resend · SendGrid", ["priority 55 · 50"]), ("SMTP", ["priority 10"]), ("Console", ["development only"])],
               "result": ("EmailResult", ["success or failure", "message id", "provider · retryable"])},
        "ko": {"request": ("요청", ["메시지", "템플릿", "수신자 목록"]),
               "service": ("EmailService", ["템플릿에 값 적용", "기본 발신자 지정", "우선순위 순서로 시도"]),
               "providers": [("AWS SES", ["우선순위 100"]), ("Resend · SendGrid", ["우선순위 55 · 50"]), ("SMTP", ["우선순위 10"]), ("콘솔", ["개발 환경 전용"])],
               "result": ("EmailResult", ["성공 또는 실패", "메시지 ID", "프로바이더 · 재시도 가능 여부"])},
    },
}


@figure(plain=True)
def fig_send_path(lang):
    """A request passes the service, which tries the providers in order and returns one result."""
    fid = "email-readme-send-path"
    t = LABELS[fid][lang]
    c = canvas(1200, 520)
    fg = c.t["fg_dim"]
    top, vgap, gap = 28, 14, 56
    xs, w = row(4, gap, width=CONTENT_W, x0=X0)
    accents = [c.orange, c.purple, c.green, fg]
    hp = max(card_h(w, name, lines, bullet=False) for name, lines in t["providers"])
    total = len(t["providers"]) * hp + (len(t["providers"]) - 1) * vgap
    mid = top + total / 2
    card(c, xs[0], top, w, c.blue, *t["request"], h=total, bullet=False, valign="middle")
    card(c, xs[1], top, w, c.blue, *t["service"], h=total, bullet=False, valign="middle")
    card(c, xs[3], top, w, c.green, *t["result"], h=total, bullet=False, valign="middle")
    c.line(xs[0] + w, mid, xs[1], mid, color=c.blue, sw=STROKE, marker=c.blue)
    for k, (acc, (name, lines)) in enumerate(zip(accents, t["providers"])):
        y = top + k * (hp + vgap)
        card(c, xs[2], y, w, acc, name, lines, h=hp, bullet=False, valign="middle", wash=(k == 3))
        c.line(xs[1] + w, y + hp / 2, xs[2], y + hp / 2, color=acc, sw=STROKE, marker=acc)
        c.line(xs[2] + w, y + hp / 2, xs[3], y + hp / 2, color=acc, sw=STROKE, marker=acc)
    save(c, f"{fid}.{lang}")


for _lang in LANGS:
    fig_send_path(_lang)
