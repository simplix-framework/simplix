"""Figures for simplix-hibernate (README*.md and docs/{en,ko} of the module)."""
from common import CONTENT_W, STROKE, canvas, card, card_h, figure, note, row, save

LANGS = ("en", "ko")
X0 = 38

LABELS = {
    "hibernate-readme-commit-sequence": {
        "en": {"stages": [("Flush", ["changes written"]),
                          ("Events", ["published", "listeners run"]),
                          ("Commit", ["transaction ends"]),
                          ("After commit", ["cache evicted", "listeners run"])],
               "verdict": "Flushing first lets before-commit listeners see every entity event"},
        "ko": {"stages": [("플러시", ["변경 기록"]),
                          ("이벤트", ["이벤트 발행", "리스너 실행"]),
                          ("커밋", ["트랜잭션 종료"]),
                          ("커밋 후", ["캐시 제거", "리스너 실행"])],
               "verdict": "먼저 플러시하므로 커밋 전 리스너가 모든 엔티티 이벤트를 수신"},
    },
}


@figure(plain=True)
def fig_commit_sequence(lang):
    """The transaction manager flushes before the before-commit listeners run."""
    fid = "hibernate-readme-commit-sequence"
    t = LABELS[fid][lang]
    c = canvas(1200, 420)
    fg = c.t["fg_dim"]
    gap = 56
    xs, w = row(4, gap, width=CONTENT_W, x0=X0)
    accents = [c.blue, c.orange, c.green, c.purple]
    h = max(card_h(w, name, lines, bullet=False) for name, lines in t["stages"])
    top = 28
    for x, acc, (name, lines) in zip(xs, accents, t["stages"]):
        card(c, x, top, w, acc, name, lines, h=h, bullet=False, valign="middle")
    for i in range(3):
        c.line(xs[i] + w, top + h / 2, xs[i + 1], top + h / 2, color=fg, sw=STROKE, marker=fg)
    note(c, X0, top + h + 26, CONTENT_W, t["verdict"], c.green)
    save(c, f"{fid}.{lang}")


for _lang in LANGS:
    fig_commit_sequence(_lang)
