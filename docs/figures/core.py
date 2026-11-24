"""Figures for simplix-core (simplix-core/README*.md, simplix-core/docs/{en,ko})."""
from common import CONTENT_W, STROKE, canvas, card, card_h, figure, note, row, save

LANGS = ("en", "ko")
X0 = 38

GROUPS = [
    ("model", ["SimpliXBaseEntity", "SimpliXBaseRepository", "TreeEntity", "SimpliXCompositeKey"]),
    ("answer", ["SimpliXApiResponse", "ErrorCode", "SimpliXGeneralException"]),
    ("check", ["@Unique", "@UniqueFields", "@ValidateWith", "@SafeHtml"]),
    ("protect", ["HtmlSanitizer", "DataMaskingUtils", "LogMasker", "HashingUtils"]),
    ("convert", ["BooleanConverter", "EnumConverter", "DateTimeConverter", "@I18nTrans"]),
    ("support", ["EventManager", "CacheManager", "CircuitBreaker", "RateLimiter"]),
]

LABELS = {
    "core-readme-building-blocks": {
        "en": {"model": "Model data", "answer": "Answer requests", "check": "Check input",
               "protect": "Protect data", "convert": "Convert and translate",
               "support": "Events, cache and resilience"},
        "ko": {"model": "데이터 모델링", "answer": "요청 응답", "check": "입력 검사",
               "protect": "데이터 보호", "convert": "변환과 번역",
               "support": "이벤트 · 캐시 · 복원력"},
    },
    "core-tree-structures-operations": {
        "en": {"asked": "the node asked about", "unrelated": "another root",
               "verdict": "Reads start from one node: findAncestors goes up to the root, findWithDescendants goes down"},
        "ko": {"asked": "기준 노드", "unrelated": "다른 루트",
               "verdict": "조회는 노드 하나에서 시작: findAncestors는 루트 방향, findWithDescendants는 아래 방향"},
    },
}


@figure()
def fig_building_blocks(lang):
    """simplix-core groups its classes by what an application does with them."""
    fid = "core-readme-building-blocks"
    t = LABELS[fid][lang]
    c = canvas(1200, 520)
    accents = [c.blue, c.teal, c.orange, c.red, c.purple, c.green]
    gap = 24
    xs, w = row(3, gap, width=CONTENT_W, x0=X0)
    h = max(card_h(w, t[key], names) for key, names in GROUPS)
    y = 28
    for r in range(2):
        for k in range(3):
            key, names = GROUPS[3 * r + k]
            card(c, xs[k], y, w, accents[3 * r + k], t[key], names, h=h)
        y += h + gap
    save(c, f"{fid}.{lang}")


@figure(plain=True)
def fig_tree_operations(lang):
    """A tree of categories and the reads the service offers from one node."""
    fid = "core-tree-structures-operations"
    t = LABELS[fid][lang]
    c = canvas(1200, 480)
    fg = c.t["fg_dim"]
    gap = 96
    xs, w = row(3, gap, width=CONTENT_W, x0=X0)
    nodes = {
        "fiction": (0, 0, c.blue, "Fiction", ["findAncestors"]),
        "fantasy": (1, 0, c.orange, "Fantasy", ["findSiblings"]),
        "history": (0, 1, fg, "History", [t["unrelated"]]),
        "scifi": (1, 1, c.purple, "Science fiction", [t["asked"]]),
        "opera": (2, 1, c.green, "Space opera", ["findDirectChildren"]),
    }
    h = max(card_h(w, name, lines, bullet=False) for _, _, _, name, lines in nodes.values())
    top, vgap = 28, 46
    box = {}
    for key, (col, rw, acc, name, lines) in nodes.items():
        x, y = xs[col], top + rw * (h + vgap)
        card(c, x, y, w, acc, name, lines, h=h, bullet=False, valign="middle", wash=(key == "history"))
        box[key] = (x, y)
    fx, fy = box["fiction"]
    ax, ay = box["fantasy"]
    sx, sy = box["scifi"]
    ox, oy = box["opera"]
    c.line(fx + w, fy + h * 0.35, ax, ay + h * 0.35, color=fg, sw=STROKE, marker=fg)
    c.ortho(fx + w, fy + h * 0.7, sx, sy + h / 2, exit="R", entry="L", color=fg, sw=STROKE, marker=fg)
    c.line(sx + w, sy + h / 2, ox, oy + h / 2, color=fg, sw=STROKE, marker=fg)
    note(c, X0, top + 2 * h + vgap + 26, CONTENT_W, t["verdict"], c.green)
    save(c, f"{fid}.{lang}")


for _lang in LANGS:
    fig_building_blocks(_lang)
    fig_tree_operations(_lang)
