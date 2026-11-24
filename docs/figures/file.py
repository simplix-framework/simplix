"""Figures for simplix-file (README*.md and docs/{en,ko} of the module)."""
from common import CONTENT_W, STROKE, canvas, card, card_h, figure, row, save

LANGS = ("en", "ko")
X0 = 38

LABELS = {
    "file-readme-upload-path": {
        "en": {"steps": [("Upload", ["a file of a request"]),
                         ("Validate", ["not empty", "size", "content type"]),
                         ("Process images", ["resize", "convert to WebP"]),
                         ("Store", ["local disk", "or S3 bucket"]),
                         ("Result", ["stored path", "type and size", "checksum"])]},
        "ko": {"steps": [("업로드", ["요청의 파일"]),
                         ("검증", ["빈 파일 여부", "크기", "콘텐츠 타입"]),
                         ("이미지 처리", ["크기 조정", "WebP 변환"]),
                         ("저장", ["로컬 디스크", "또는 S3 버킷"]),
                         ("결과", ["저장 경로", "타입과 크기", "체크섬"])]},
    },
}


@figure(plain=True)
def fig_upload_path(lang):
    """An upload is validated, processed when it is an image, stored and described."""
    fid = "file-readme-upload-path"
    t = LABELS[fid][lang]
    c = canvas(1200, 300)
    top, gap = 28, 34
    steps = t["steps"]
    xs, w = row(len(steps), gap, width=CONTENT_W, x0=X0)
    accents = [c.blue, c.orange, c.purple, c.green, c.blue]
    h = max(card_h(w, name, lines, bullet=False) for name, lines in steps)
    for k, (acc, (name, lines)) in enumerate(zip(accents, steps)):
        card(c, xs[k], top, w, acc, name, lines, h=h, bullet=False, valign="middle")
        if k < len(steps) - 1:
            c.line(xs[k] + w, top + h / 2, xs[k + 1], top + h / 2, color=acc, sw=STROKE, marker=acc)
    save(c, f"{fid}.{lang}")


for _lang in LANGS:
    fig_upload_path(_lang)
