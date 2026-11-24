"""Figures for simplix-excel (README*.md and docs/{en,ko} of the module)."""
from common import CONTENT_W, STROKE, canvas, card, card_h, figure, row, save

LANGS = ("en", "ko")
X0 = 38

LABELS = {
    "excel-readme-row-class": {
        "en": {"row": ("Row class", ["@ExcelColumn fields", "headers, order, formats"]),
               "uses": [("Excel export", ["StandardExcelExporter"]), ("CSV export", ["UnifiedCsvExporter"]), ("Import", ["StandardExcelImporter"])]},
        "ko": {"row": ("행 클래스", ["@ExcelColumn 필드", "헤더 · 순서 · 형식"]),
               "uses": [("Excel 내보내기", ["StandardExcelExporter"]), ("CSV 내보내기", ["UnifiedCsvExporter"]), ("가져오기", ["StandardExcelImporter"])]},
    },
}


@figure(plain=True)
def fig_row_class(lang):
    """One annotated row class serves both exports and the import."""
    fid = "excel-readme-row-class"
    t = LABELS[fid][lang]
    c = canvas(1200, 480)
    top, vgap = 28, 20
    wr, gap = 380, 170
    xc = X0 + wr + gap
    wc = CONTENT_W - wr - gap
    accents = [c.green, c.orange, c.purple]
    h = max(card_h(wc, name, lines, bullet=False) for name, lines in t["uses"])
    total = 3 * h + 2 * vgap
    card(c, X0, top, wr, c.blue, *t["row"], h=total, bullet=False, valign="middle")
    for k, (acc, (name, lines)) in enumerate(zip(accents, t["uses"])):
        y = top + k * (h + vgap)
        card(c, xc, y, wc, acc, name, lines, h=h, bullet=False, valign="middle")
        if k < 2:
            c.line(X0 + wr, y + h / 2, xc, y + h / 2, color=acc, sw=STROKE, marker=acc)
        else:
            c.line(xc, y + h / 2, X0 + wr, y + h / 2, color=acc, sw=STROKE, marker=acc)
    save(c, f"{fid}.{lang}")


for _lang in LANGS:
    fig_row_class(_lang)
