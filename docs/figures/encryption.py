"""Figures for simplix-encryption (README*.md and docs/{en,ko} of the module)."""
from common import CONTENT_W, STROKE, canvas, card, card_h, figure, note, row, save

LANGS = ("en", "ko")
X0 = 38

LABELS = {
    "encryption-readme-column-flow": {
        "en": {"stages": [("Entity", ["plain value", "ursula@example.com"]),
                          ("Converter and service", ["AES-256-GCM", "current key version"]),
                          ("Column", ["v2 : IV : ciphertext"])],
               "verdict": "The version in each value selects the key that decrypts it, so keys can change"},
        "ko": {"stages": [("엔티티", ["평문 값", "ursula@example.com"]),
                          ("변환기와 서비스", ["AES-256-GCM", "현재 키 버전"]),
                          ("컬럼", ["v2 : IV : 암호문"])],
               "verdict": "값에 기록된 버전으로 복호화 키를 선택하므로 키 교체 가능"},
    },
}


@figure(plain=True)
def fig_column_flow(lang):
    """A value is encrypted on its way to the column and carries its key version."""
    fid = "encryption-readme-column-flow"
    t = LABELS[fid][lang]
    c = canvas(1200, 420)
    fg = c.t["fg_dim"]
    gap = 90
    xs, w = row(3, gap, width=CONTENT_W, x0=X0)
    accents = [fg, c.blue, c.green]
    h = max(card_h(w, name, lines, bullet=False) for name, lines in t["stages"])
    top = 28
    for k, (x, acc, (name, lines)) in enumerate(zip(xs, accents, t["stages"])):
        card(c, x, top, w, acc, name, lines, h=h, bullet=False, valign="middle", wash=(k == 0))
    for i in range(2):
        c.line(xs[i] + w, top + h / 2, xs[i + 1], top + h / 2, color=fg, sw=STROKE, marker=fg)
    note(c, X0, top + h + 26, CONTENT_W, t["verdict"], c.green)
    save(c, f"{fid}.{lang}")


for _lang in LANGS:
    fig_column_flow(_lang)
