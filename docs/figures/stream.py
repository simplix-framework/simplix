"""Figures for simplix-stream (README*.md and docs/{en,ko} of the module)."""
from common import CONTENT_W, STROKE, canvas, card, card_h, figure, row, save

LANGS = ("en", "ko")
X0 = 38

LABELS = {
    "stream-readme-flow": {
        "en": {"clients": [("Browser A", ["one connection", "subscribes to shelf s1"]), ("Browser B", ["one connection", "subscribes to shelf s1"])],
               "server": ("Stream session", ["one per connection", "keeps the subscriptions"]),
               "sources": [("Collector", ["called once per interval", "for both sessions"]), ("Event source", ["sends when an event", "is published"])]},
        "ko": {"clients": [("브라우저 A", ["연결 하나", "서가 s1 구독"]), ("브라우저 B", ["연결 하나", "서가 s1 구독"])],
               "server": ("스트림 세션", ["연결마다 하나", "구독 목록 보관"]),
               "sources": [("수집기", ["주기마다 한 번 호출", "두 세션에 전송"]), ("이벤트 소스", ["이벤트 발행 시", "데이터 전송"])]},
    },
}


@figure(plain=True)
def fig_flow(lang):
    """Two browsers share one collector run per interval; an event source pushes on events."""
    fid = "stream-readme-flow"
    t = LABELS[fid][lang]
    c = canvas(1200, 400)
    fg = c.t["fg_dim"]
    top, vgap, gap = 28, 20, 110
    xs, w = row(3, gap, width=CONTENT_W, x0=X0)
    hc = max(card_h(w, name, lines, bullet=False) for name, lines in t["clients"] + t["sources"])
    total = 2 * hc + vgap
    for k, (name, lines) in enumerate(t["clients"]):
        y = top + k * (hc + vgap)
        card(c, xs[0], y, w, c.blue, name, lines, h=hc, bullet=False, valign="middle")
        c.line(xs[1], y + hc / 2, xs[0] + w, y + hc / 2, color=c.blue, sw=STROKE, marker=c.blue)
    card(c, xs[1], top, w, fg, *t["server"], h=total, bullet=False, valign="middle", wash=True)
    for k, (acc, (name, lines)) in enumerate(zip([c.green, c.purple], t["sources"])):
        y = top + k * (hc + vgap)
        card(c, xs[2], y, w, acc, name, lines, h=hc, bullet=False, valign="middle")
        c.line(xs[2], y + hc / 2, xs[1] + w, y + hc / 2, color=acc, sw=STROKE, marker=acc)
    save(c, f"{fid}.{lang}")


for _lang in LANGS:
    fig_flow(_lang)
