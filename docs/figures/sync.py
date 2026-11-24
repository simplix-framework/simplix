"""Figures for simplix-sync (README*.md and docs/{en,ko} of the module)."""
from common import CONTENT_W, STROKE, canvas, card, card_h, figure, row, save

LANGS = ("en", "ko")
X0 = 38

LABELS = {
    "sync-readme-broadcast": {
        "en": {"sender": ("Instance A", ["changes its state", "broadcasts the change"]),
               "broker": ("Broker", ["Redis or NATS", "one channel per topic"]),
               "receivers": [("Instance B", ["applies the change"]), ("Instance C", ["applies the change"])]},
        "ko": {"sender": ("인스턴스 A", ["자신의 상태 변경", "변경 브로드캐스트"]),
               "broker": ("브로커", ["Redis 또는 NATS", "주제별 채널"]),
               "receivers": [("인스턴스 B", ["변경 반영"]), ("인스턴스 C", ["변경 반영"])]},
    },
}


@figure(plain=True)
def fig_broadcast(lang):
    """A change broadcast by one instance reaches the others through the broker."""
    fid = "sync-readme-broadcast"
    t = LABELS[fid][lang]
    c = canvas(1200, 420)
    fg = c.t["fg_dim"]
    top, vgap, gap = 28, 20, 110
    xs, w = row(3, gap, width=CONTENT_W, x0=X0)
    hs = max(card_h(w, name, lines, bullet=False) for name, lines in t["receivers"])
    total = 2 * hs + vgap
    card(c, xs[0], top, w, c.blue, *t["sender"], h=total, bullet=False, valign="middle")
    card(c, xs[1], top, w, fg, *t["broker"], h=total, bullet=False, valign="middle", wash=True)
    c.line(xs[0] + w, top + total / 2, xs[1], top + total / 2, color=c.blue, sw=STROKE, marker=c.blue)
    for k, (name, lines) in enumerate(t["receivers"]):
        y = top + k * (hs + vgap)
        card(c, xs[2], y, w, c.green, name, lines, h=hs, bullet=False, valign="middle")
        c.line(xs[1] + w, y + hs / 2, xs[2], y + hs / 2, color=c.green, sw=STROKE, marker=c.green)
    save(c, f"{fid}.{lang}")


for _lang in LANGS:
    fig_broadcast(_lang)
