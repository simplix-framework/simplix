"""Figures for simplix-license (README*.md and docs/{en,ko} of the module)."""
from common import CONTENT_W, STROKE, canvas, card, card_h, figure, row, save

LANGS = ("en", "ko")
X0 = 38

LABELS = {
    "license-readme-enforcement": {
        "en": {"source": ("Registration", ["online activation", "offline activation", "token file"]),
               "verify": ("Verification", ["signature and machine", "expiry and release", "at start and on a schedule"]),
               "state": ("License status", ["one shared verdict"]),
               "points": [("Request filter", ["may the API be used"]), ("Feature gate", ["is the feature granted"]), ("Quota guard", ["does one more fit"])]},
        "ko": {"source": ("등록", ["온라인 활성화", "오프라인 활성화", "토큰 파일"]),
               "verify": ("검증", ["서명과 머신", "만료와 릴리스", "시작 시와 주기적 실행"]),
               "state": ("라이선스 상태", ["공유되는 판정 결과"]),
               "points": [("요청 필터", ["API 사용 가능 여부"]), ("기능 게이트", ["기능 부여 여부"]), ("수량 가드", ["추가 등록 가능 여부"])]},
    },
}


@figure(plain=True)
def fig_enforcement(lang):
    """A registration is verified into one status that three enforcement points read."""
    fid = "license-readme-enforcement"
    t = LABELS[fid][lang]
    c = canvas(1200, 440)
    fg = c.t["fg_dim"]
    top, vgap, gap = 28, 16, 60
    xs, w = row(4, gap, width=CONTENT_W, x0=X0)
    accents = [c.orange, c.purple, c.green]
    hp = max(card_h(w, name, lines, bullet=False) for name, lines in t["points"])
    total = 3 * hp + 2 * vgap
    mid = top + total / 2
    card(c, xs[0], top, w, c.blue, *t["source"], h=total, bullet=False, valign="middle")
    card(c, xs[1], top, w, c.blue, *t["verify"], h=total, bullet=False, valign="middle")
    card(c, xs[2], top, w, fg, *t["state"], h=total, bullet=False, valign="middle", wash=True)
    c.line(xs[0] + w, mid, xs[1], mid, color=c.blue, sw=STROKE, marker=c.blue)
    c.line(xs[1] + w, mid, xs[2], mid, color=c.blue, sw=STROKE, marker=c.blue)
    for k, (acc, (name, lines)) in enumerate(zip(accents, t["points"])):
        y = top + k * (hp + vgap)
        card(c, xs[3], y, w, acc, name, lines, h=hp, bullet=False, valign="middle")
        c.line(xs[3], y + hp / 2, xs[2] + w, y + hp / 2, color=acc, sw=STROKE, marker=acc)
    save(c, f"{fid}.{lang}")


for _lang in LANGS:
    fig_enforcement(_lang)
