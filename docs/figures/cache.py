"""Figures for simplix-cache (README*.md and docs/{en,ko} of the module)."""
from common import CONTENT_W, STROKE, canvas, card, card_h, figure, row, save

LANGS = ("en", "ko")
X0 = 38

LABELS = {
    "cache-readme-entry-points": {
        "en": {"code": ("Your code", ["CacheService", "@Cacheable"]),
               "module": ("simplix-cache", ["mode from configuration"]),
               "stores": [("Caffeine", ["local", "one instance"]), ("Redis", ["redis", "shared"]), ("NATS", ["nats", "shared"])]},
        "ko": {"code": ("애플리케이션 코드", ["CacheService", "@Cacheable"]),
               "module": ("simplix-cache", ["설정으로 모드 선택"]),
               "stores": [("Caffeine", ["local", "단일 인스턴스"]), ("Redis", ["redis", "공유"]), ("NATS", ["nats", "공유"])]},
    },
}


@figure(plain=True)
def fig_entry_points(lang):
    """Code reaches the cache through one module, and the mode decides the store."""
    fid = "cache-readme-entry-points"
    t = LABELS[fid][lang]
    c = canvas(1200, 480)
    fg = c.t["fg_dim"]
    top, vgap, gap = 28, 20, 110
    xs, w = row(3, gap, width=CONTENT_W, x0=X0)
    accents = [c.green, c.red, c.purple]
    hs = max(card_h(w, name, lines, bullet=False) for name, lines in t["stores"])
    total = 3 * hs + 2 * vgap
    card(c, xs[0], top, w, fg, *t["code"], h=total, bullet=False, valign="middle", wash=True)
    card(c, xs[1], top, w, c.blue, *t["module"], h=total, bullet=False, valign="middle")
    c.line(xs[0] + w, top + total / 2, xs[1], top + total / 2, color=fg, sw=STROKE, marker=fg)
    for k, (acc, (name, lines)) in enumerate(zip(accents, t["stores"])):
        y = top + k * (hs + vgap)
        card(c, xs[2], y, w, acc, name, lines, h=hs, bullet=False, valign="middle")
        c.line(xs[1] + w, y + hs / 2, xs[2], y + hs / 2, color=acc, sw=STROKE, marker=acc)
    save(c, f"{fid}.{lang}")


for _lang in LANGS:
    fig_entry_points(_lang)
