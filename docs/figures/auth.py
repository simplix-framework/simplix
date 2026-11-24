"""Figures for simplix-auth (README*.md and docs/{en,ko} of the module)."""
from common import CONTENT_W, STROKE, canvas, card, card_h, edge_label, figure, note, row, save

LANGS = ("en", "ko")
X0 = 38

LABELS = {
    "auth-readme-filter-chains": {
        "en": {"request": ("Request", ["matched by its path"]),
               "chains": [("Token endpoints", ["paths with /auth/token/", "credentials sent in the call"]),
                          ("API", ["/api/**", "Bearer access token"]),
                          ("Web pages", ["every other path", "login form and session"])]},
        "ko": {"request": ("요청", ["경로로 체인 결정"]),
               "chains": [("토큰 엔드포인트", ["/auth/token/ 포함 경로", "호출에 담긴 자격 증명"]),
                          ("API", ["/api/**", "Bearer 액세스 토큰"]),
                          ("웹 페이지", ["그 밖의 모든 경로", "로그인 폼과 세션"])]},
    },
    "auth-rotating-keys-lifecycle": {
        "en": {"stages": [("Active key", ["encrypts new tokens", "decrypts its tokens"]),
                          ("Earlier key", ["decrypts only", "kept until it expires"]),
                          ("Expired key", ["deleted by the cleanup"])],
               "edges": ["rotation", "expiry"],
               "verdict": "A token names its key in kid, so any key still stored decrypts it"},
        "ko": {"stages": [("활성 키", ["새 토큰 암호화", "발급한 토큰 복호화"]),
                          ("이전 키", ["복호화 전용", "만료될 때까지 보관"]),
                          ("만료된 키", ["정리 작업으로 삭제"])],
               "edges": ["교체", "만료"],
               "verdict": "토큰의 kid에 키 버전이 있으므로, 저장소에 남아 있는 키로 복호화"},
    },
}


@figure(plain=True)
def fig_filter_chains(lang):
    """A request is handled by one of three security chains, chosen by its path."""
    fid = "auth-readme-filter-chains"
    t = LABELS[fid][lang]
    c = canvas(1200, 520)
    fg = c.t["fg_dim"]
    top, vgap = 28, 22
    wr, gap = 250, 150
    xc = X0 + wr + gap
    wc = CONTENT_W - wr - gap
    accents = [c.orange, c.blue, c.purple]
    h = max(card_h(wc, name, lines, bullet=False) for name, lines in t["chains"])
    total = 3 * h + 2 * vgap
    card(c, X0, top, wr, fg, *t["request"], h=total, bullet=False, valign="middle", wash=True)
    for k, (acc, (name, lines)) in enumerate(zip(accents, t["chains"])):
        y = top + k * (h + vgap)
        card(c, xc, y, wc, acc, name, lines, h=h, bullet=False, valign="middle")
        c.line(X0 + wr, y + h / 2, xc, y + h / 2, color=acc, sw=STROKE, marker=acc)
    save(c, f"{fid}.{lang}")


@figure(plain=True)
def fig_key_lifecycle(lang):
    """After a rotation the earlier key only decrypts, and is deleted once it has expired."""
    fid = "auth-rotating-keys-lifecycle"
    t = LABELS[fid][lang]
    c = canvas(1200, 420)
    fg = c.t["fg_dim"]
    gap = 130
    xs, w = row(3, gap, width=CONTENT_W, x0=X0)
    accents = [c.green, c.orange, fg]
    h = max(card_h(w, name, lines, bullet=False) for name, lines in t["stages"])
    top = 28
    for k, (x, acc, (name, lines)) in enumerate(zip(xs, accents, t["stages"])):
        card(c, x, top, w, acc, name, lines, h=h, bullet=False, valign="middle", wash=(k == 2))
    for i in range(2):
        c.line(xs[i] + w, top + h / 2, xs[i + 1], top + h / 2, color=fg, sw=STROKE, marker=fg)
        edge_label(c, xs[i] + w + gap / 2, top + h / 2 - 18, t["edges"][i], fg, pill=False)
    note(c, X0, top + h + 26, CONTENT_W, t["verdict"], c.green)
    save(c, f"{fid}.{lang}")


for _lang in LANGS:
    fig_filter_chains(_lang)
    fig_key_lifecycle(_lang)
