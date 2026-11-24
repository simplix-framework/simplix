"""Figures for simplix-scheduler (README*.md and docs/{en,ko} of the module)."""
from common import CONTENT_W, STROKE, canvas, card, card_h, figure, row, save

LANGS = ("en", "ko")
X0 = 38

LABELS = {
    "scheduler-readme-recording": {
        "en": {"job": ("@Scheduled method", ["your job, unchanged"]),
               "module": ("simplix-scheduler", ["registers the job once", "records every run"]),
               "stores": [("In memory", ["development"]), ("Your tables", ["job registry", "run history"])]},
        "ko": {"job": ("@Scheduled 메서드", ["기존 작업 코드 그대로"]),
               "module": ("simplix-scheduler", ["작업을 한 번 등록", "모든 실행 기록"]),
               "stores": [("메모리", ["개발 환경"]), ("애플리케이션 테이블", ["작업 목록", "실행 이력"])]},
    },
}


@figure(plain=True)
def fig_recording(lang):
    """A scheduled method is intercepted, registered once and recorded at every run."""
    fid = "scheduler-readme-recording"
    t = LABELS[fid][lang]
    c = canvas(1200, 420)
    fg = c.t["fg_dim"]
    top, vgap, gap = 28, 20, 110
    xs, w = row(3, gap, width=CONTENT_W, x0=X0)
    accents = [c.orange, c.green]
    hs = max(card_h(w, name, lines, bullet=False) for name, lines in t["stores"])
    total = 2 * hs + vgap
    card(c, xs[0], top, w, fg, *t["job"], h=total, bullet=False, valign="middle", wash=True)
    card(c, xs[1], top, w, c.blue, *t["module"], h=total, bullet=False, valign="middle")
    c.line(xs[0] + w, top + total / 2, xs[1], top + total / 2, color=fg, sw=STROKE, marker=fg)
    for k, (acc, (name, lines)) in enumerate(zip(accents, t["stores"])):
        y = top + k * (hs + vgap)
        card(c, xs[2], y, w, acc, name, lines, h=hs, bullet=False, valign="middle")
        c.line(xs[1] + w, y + hs / 2, xs[2], y + hs / 2, color=acc, sw=STROKE, marker=acc)
    save(c, f"{fid}.{lang}")


for _lang in LANGS:
    fig_recording(_lang)
