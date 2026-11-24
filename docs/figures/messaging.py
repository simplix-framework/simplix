"""Figures for simplix-messaging (README*.md and docs/{en,ko} of the module)."""
from common import CONTENT_W, STROKE, canvas, card, card_h, figure, row, save

LANGS = ("en", "ko")
X0 = 38

LABELS = {
    "messaging-readme-flow": {
        "en": {"publisher": ("Publisher", ["MessagePublisher", "publishes to a channel"]),
               "broker": ("Broker", ["keeps each message", "until every group", "acknowledged it"]),
               "groups": [("Group notifier", ["one instance handles", "each message"]), ("Group ledger", ["one instance handles", "each message"])]},
        "ko": {"publisher": ("발행자", ["MessagePublisher", "채널로 발행"]),
               "broker": ("브로커", ["모든 그룹이", "확인 응답할 때까지", "메시지 보관"]),
               "groups": [("notifier 그룹", ["메시지별 처리", "그룹 내 인스턴스 하나"]), ("ledger 그룹", ["메시지별 처리", "그룹 내 인스턴스 하나"])]},
    },
}


@figure(plain=True)
def fig_flow(lang):
    """A published message is kept by the broker and handled once by every consumer group."""
    fid = "messaging-readme-flow"
    t = LABELS[fid][lang]
    c = canvas(1200, 400)
    fg = c.t["fg_dim"]
    top, vgap, gap = 28, 20, 110
    xs, w = row(3, gap, width=CONTENT_W, x0=X0)
    accents = [c.green, c.purple]
    hg = max(card_h(w, name, lines, bullet=False) for name, lines in t["groups"])
    total = 2 * hg + vgap
    card(c, xs[0], top, w, c.blue, *t["publisher"], h=total, bullet=False, valign="middle")
    card(c, xs[1], top, w, fg, *t["broker"], h=total, bullet=False, valign="middle", wash=True)
    c.line(xs[0] + w, top + total / 2, xs[1], top + total / 2, color=c.blue, sw=STROKE, marker=c.blue)
    for k, (acc, (name, lines)) in enumerate(zip(accents, t["groups"])):
        y = top + k * (hg + vgap)
        card(c, xs[2], y, w, acc, name, lines, h=hg, bullet=False, valign="middle")
        c.line(xs[1] + w, y + hg / 2, xs[2], y + hg / 2, color=acc, sw=STROKE, marker=acc)
    save(c, f"{fid}.{lang}")


for _lang in LANGS:
    fig_flow(_lang)
