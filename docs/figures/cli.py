"""Figures for the command line tool (simplix-cli/README*.md, simplix-cli/docs/{en,ko}).

Each figure function takes a language code and reads every label from LABELS,
so one drawing produces <figure-id>.en.svg and <figure-id>.ko.svg.
"""
from common import (CHIP, CHIP_RISE, CONTENT_W, DASH_OUTSIDE, PAD, STROKE, canvas, card,
                    card_h, edge_label, figure, note, row, save, tw, zone)

LANGS = ("en", "ko")
X0 = 38

LABELS = {
    "cli-readme-pipeline": {
        "en": {
            "stages": [("JPA entity", ["Author.java"]),
                       ("Entity yml", ["Author.yml"]),
                       ("Generated tree", ["generated/"]),
                       ("Module source", ["modules/catalog"])],
            "commands": ["config", "generate", "promote"],
            "edit": ("You edit the yml", ["which DTOs a field appears in",
                                          "search operators, validation, permissions"]),
            "templates": ("Templates decide the code", ["built-in templates ship with the CLI",
                                                        "a project file of the same path replaces one"]),
            "verdict": "generated reports whether each promoted file still matches the templates",
        },
        "ko": {
            "stages": [("JPA 엔티티", ["Author.java"]),
                       ("엔티티 yml", ["Author.yml"]),
                       ("생성 트리", ["generated/"]),
                       ("모듈 소스", ["modules/catalog"])],
            "commands": ["config", "generate", "promote"],
            "edit": ("개발자가 yml을 편집", ["필드가 들어갈 DTO 선택",
                                         "검색 연산자, 검증, 권한 설정"]),
            "templates": ("템플릿이 코드를 결정", ["내장 템플릿은 CLI에 포함",
                                              "같은 경로의 프로젝트 파일이 대체"]),
            "verdict": "generated 명령이 모듈로 옮긴 파일과 현재 템플릿의 일치 여부를 보고",
        },
    },
    "cli-how-it-works-generated-classes": {
        "en": {
            "generated": "Generated for Author",
            "yours": "Written by you",
            "controller": ("AuthorRestController", ["REST endpoints with permission checks"]),
            "service": ("AuthorService", ["CRUD and search"]),
            "dtos": ("AuthorDTOs", ["list, detail, edit and search shapes"]),
            "test": ("AuthorServiceTest", ["unit tests of the service"]),
            "entity": ("Author", ["JPA entity"]),
            "repository": ("AuthorRepository", ["Spring Data repository"]),
            "calls": "calls",
            "uses": "uses",
            "carries": "carries",
            "covers": "tests",
        },
        "ko": {
            "generated": "Author에 대해 생성하는 클래스",
            "yours": "직접 작성하는 클래스",
            "controller": ("AuthorRestController", ["권한 검사를 포함한 REST 엔드포인트"]),
            "service": ("AuthorService", ["생성 · 수정 · 삭제 · 검색"]),
            "dtos": ("AuthorDTOs", ["목록 · 상세 · 편집 · 검색 DTO"]),
            "test": ("AuthorServiceTest", ["서비스 단위 테스트"]),
            "entity": ("Author", ["JPA 엔티티"]),
            "repository": ("AuthorRepository", ["Spring Data 저장소"]),
            "calls": "호출",
            "uses": "사용",
            "carries": "전달",
            "covers": "테스트",
        },
    },
    "cli-customizing-templates-resolution": {
        "en": {
            "builtin": "Built-in templates",
            "project": "Project templates",
            "used": "Used by generate",
            "paths": ["service/", "dto/", "test/"],
            "files": ["EntityService", "EntityDTOs", "EntityServiceTest"],
            "replaced": "replaced",
            "none": "no file",
            "from_builtin": "built-in",
            "from_project": "project",
            "eject": "templates --eject",
            "verdict": "The choice is made per file: a project file replaces only the built-in template of the same relative path",
        },
        "ko": {
            "builtin": "내장 템플릿",
            "project": "프로젝트 템플릿",
            "used": "generate가 사용",
            "paths": ["service/", "dto/", "test/"],
            "files": ["EntityService", "EntityDTOs", "EntityServiceTest"],
            "replaced": "대체됨",
            "none": "파일 없음",
            "from_builtin": "내장",
            "from_project": "프로젝트",
            "eject": "templates --eject",
            "verdict": "파일 단위로 선택: 프로젝트 파일은 같은 상대 경로의 내장 템플릿만 대체",
        },
    },
    "cli-updating-generated-code-merge": {
        "en": {
            "base": ("Base render", [".simplix/bases/", "what promote wrote last time"]),
            "file": ("Your file", ["modules/<module>/", "the base plus your edits"]),
            "fresh": ("Fresh render", ["generated/", "current templates and yml"]),
            "merge": ("promote", ["three-way merge"]),
            "merged": ("merged", ["the file holds both changes",
                                  "the fresh render is the new base"]),
            "conflict": ("conflict", ["your file is left as it is",
                                      "marked merge in generated/conflicts/"]),
            "clean": "changes do not overlap",
            "overlap": "both changed the same lines",
        },
        "ko": {
            "base": ("기준 렌더", [".simplix/bases/", "지난 promote가 쓴 내용"]),
            "file": ("모듈의 파일", ["modules/<모듈>/", "기준 렌더 + 직접 고친 내용"]),
            "fresh": ("새 렌더", ["generated/", "현재 템플릿과 yml의 결과"]),
            "merge": ("promote", ["3방향 병합"]),
            "merged": ("merged", ["양쪽 변경을 모두 파일에 반영",
                                  "새 렌더를 기준 렌더로 저장"]),
            "conflict": ("conflict", ["모듈의 파일은 그대로 유지",
                                      "충돌 표시본: generated/conflicts/"]),
            "clean": "변경이 겹치지 않음",
            "overlap": "같은 줄을 양쪽이 변경",
        },
    },
    "cli-updating-generated-code-states": {
        "en": {
            "cols": ["Fresh render equals base", "Fresh render differs from base"],
            "rows": ["Unchanged since promote", "Edited since promote"],
            "untouched": ("untouched", ["nothing to do"]),
            "stale": ("stale", ["promote rewrites the file"]),
            "edited": ("edited", ["your edits stand"]),
            "edited2": ("edited", ["merges cleanly"]),
            "conflict": ("conflict", ["collides with your edits"]),
            "outside": "File or base missing",
            "nobase": ("no-base", ["the file has no stored base",
                                   "promote --adopt records one"]),
            "removed": ("removed", ["the file was deleted after promote",
                                    "promote keeps it deleted"]),
            "pass": "passes",
            "fail": "fails the check",
        },
        "ko": {
            "cols": ["새 렌더가 기준 렌더와 같음", "새 렌더가 기준 렌더와 다름"],
            "rows": ["promote 이후 그대로", "promote 이후 직접 고침"],
            "untouched": ("untouched", ["할 일 없음"]),
            "stale": ("stale", ["promote가 파일을 다시 씀"]),
            "edited": ("edited", ["직접 고친 내용 유지"]),
            "edited2": ("edited", ["충돌 없이 병합"]),
            "conflict": ("conflict", ["직접 고친 내용과 충돌"]),
            "outside": "파일 또는 기준 렌더 없음",
            "nobase": ("no-base", ["기준 렌더 없이 파일만 있음",
                                   "promote --adopt로 기준 렌더 기록"]),
            "removed": ("removed", ["promote 이후 파일을 삭제함",
                                    "promote가 삭제 상태를 유지"]),
            "pass": "통과",
            "fail": "검사 실패",
        },
    },
}


def arrow(c, x1, y1, x2, y2, color):
    c.line(x1, y1, x2, y2, color=color, sw=STROKE, marker=color)


def zone_h(inner):
    """The height of a zone whose content is inner tall, padded evenly."""
    return CHIP_RISE + PAD + inner + PAD


@figure(plain=True)
def fig_pipeline(lang):
    """Entity to module source through three commands; the yml is the file the developer edits."""
    fid = "cli-readme-pipeline"
    t = LABELS[fid][lang]
    c = canvas(1200, 520)
    fg = c.t["fg_dim"]
    top, gap = 28, 92
    xs, w = row(4, gap, width=CONTENT_W, x0=X0)
    accents = [c.purple, c.orange, c.blue, c.green]
    h = max(card_h(w, n, l, bullet=False) for n, l in t["stages"])
    for x, acc, (name, lines) in zip(xs, accents, t["stages"]):
        card(c, x, top, w, acc, name, lines, h=h, bullet=False)
    my = top + h / 2
    for i, cmd in enumerate(t["commands"]):
        arrow(c, xs[i] + w, my, xs[i + 1], my, fg)
        edge_label(c, xs[i] + w + gap / 2, my - 18, cmd, fg, pill=False)
    # what feeds the yml and the generated tree: one wide card under each pair of stages
    y2 = top + h + 52
    w2 = xs[1] + w - xs[0]
    h2 = max(card_h(w2, *t["edit"], bullet=False), card_h(w2, *t["templates"], bullet=False))
    card(c, xs[0], y2, w2, c.orange, *t["edit"], h=h2, bullet=False, wash=True)
    card(c, xs[2], y2, w2, c.blue, *t["templates"], h=h2, bullet=False, wash=True)
    arrow(c, xs[1] + w / 2, y2, xs[1] + w / 2, top + h, c.orange)
    arrow(c, xs[2] + w / 2, y2, xs[2] + w / 2, top + h, c.blue)
    note(c, X0, y2 + h2 + 26, CONTENT_W, t["verdict"], c.green)
    save(c, f"{fid}.{lang}")


@figure(plain=True)
def fig_generated_classes(lang):
    """Which classes generate writes for one entity and which the developer owns."""
    fid = "cli-how-it-works-generated-classes"
    t = LABELS[fid][lang]
    c = canvas(1200, 640)
    fg = c.t["fg_dim"]
    top, gap, zgap, vgap = 28 + CHIP_RISE, 90, 84, 60
    wz_own = 280
    wz_gen = CONTENT_W - wz_own - zgap
    wc = (wz_gen - 2 * PAD - gap) / 2
    wr = wz_own - 2 * PAD
    hrow1 = max(card_h(wc, *t["controller"], bullet=False), card_h(wc, *t["service"], bullet=False),
                card_h(wr, *t["repository"], bullet=False))
    hrow2 = max(card_h(wc, *t["dtos"], bullet=False), card_h(wc, *t["test"], bullet=False),
                card_h(wr, *t["entity"], bullet=False))
    zh = zone_h(hrow1 + vgap + hrow2)
    y0 = zone(c, X0, top, wz_gen, zh, c.blue, t["generated"])
    xo = X0 + wz_gen + zgap
    zone(c, xo, top, wz_own, zh, fg, t["yours"], dash=DASH_OUTSIDE)
    xc, xsv = X0 + PAD, X0 + PAD + wc + gap
    y1 = y0 + hrow1 + vgap
    card(c, xc, y0, wc, c.blue, *t["controller"], h=hrow1, bullet=False, valign="middle")
    card(c, xsv, y0, wc, c.blue, *t["service"], h=hrow1, bullet=False, valign="middle")
    card(c, xc, y1, wc, c.teal, *t["dtos"], h=hrow2, bullet=False, valign="middle")
    card(c, xsv, y1, wc, c.purple, *t["test"], h=hrow2, bullet=False, valign="middle")
    xr = xo + PAD
    card(c, xr, y0, wr, fg, *t["repository"], h=hrow1, bullet=False, valign="middle")
    card(c, xr, y1, wr, fg, *t["entity"], h=hrow2, bullet=False, valign="middle")
    m1 = y0 + hrow1 / 2
    arrow(c, xc + wc, m1, xsv, m1, c.blue)
    edge_label(c, xc + wc + gap / 2, m1 - 18, t["calls"], c.blue, pill=False)
    arrow(c, xsv + wc, m1, xr, m1, fg)
    edge_label(c, (xsv + wc + xr) / 2, m1 - 18, t["uses"], fg, pill=False)
    mid = y0 + hrow1 + vgap / 2
    arrow(c, xc + wc / 2, y0 + hrow1, xc + wc / 2, y1, c.teal)
    edge_label(c, xc + wc / 2 + 14 + tw(t["carries"], CHIP) / 2, mid, t["carries"], c.teal, pill=False)
    arrow(c, xsv + wc / 2, y1, xsv + wc / 2, y0 + hrow1, c.purple)
    edge_label(c, xsv + wc / 2 + 14 + tw(t["covers"], CHIP) / 2, mid, t["covers"], c.purple, pill=False)
    arrow(c, xr + wr / 2, y0 + hrow1, xr + wr / 2, y1, fg)
    save(c, f"{fid}.{lang}")


@figure(plain=True)
def fig_template_resolution(lang):
    """Built-in row, project row, and the set generate ends up using, column by column."""
    fid = "cli-customizing-templates-resolution"
    t = LABELS[fid][lang]
    c = canvas(1200, 640)
    fg = c.t["fg_dim"]
    top, gap, vgap, lead = 28, 24, 76, 224
    xs, w = row(3, gap, width=CONTENT_W - lead - gap, x0=X0 + lead + gap)
    project = (0,)                    # the service template has a project file
    ejected = 0                       # copied from the built-in one with templates --eject
    ht = card_h(w, t["paths"][1], [t["files"][1]], bullet=False)
    ys = [top + k * (ht + vgap) for k in range(3)]
    leads = [(c.blue, t["builtin"]), (c.orange, t["project"]), (c.green, t["used"])]
    for (acc, text), y in zip(leads, ys):
        card(c, X0, y, lead, acc, None, [text], h=ht, bullet=False, align="middle",
             valign="middle", wash=True)
    yb, yp, yu = ys
    for i, x in enumerate(xs):
        cx = x + w / 2
        if i in project:
            card(c, x, yb, w, fg, t["paths"][i], [t["files"][i]], h=ht, bullet=False,
                 tag=t["replaced"])
            card(c, x, yp, w, c.orange, t["paths"][i], [t["files"][i]], h=ht, bullet=False)
            card(c, x, yu, w, c.orange, t["paths"][i], [t["from_project"]], h=ht, bullet=False)
            arrow(c, cx, yp + ht, cx, yu, c.orange)
        else:
            card(c, x, yb, w, c.blue, t["paths"][i], [t["files"][i]], h=ht, bullet=False)
            card(c, x, yu, w, c.blue, t["paths"][i], [t["from_builtin"]], h=ht, bullet=False)
            arrow(c, cx, yb + ht, cx, yu, c.blue)
    # eject copies a built-in file into the project
    cx = xs[ejected] + w / 2
    arrow(c, cx, yb + ht, cx, yp, fg)
    edge_label(c, cx + 12 + tw(t["eject"], CHIP) / 2, yb + ht + vgap / 2, t["eject"], fg,
               pill=False)
    note(c, X0, yu + ht + 26, CONTENT_W, t["verdict"], c.green)
    save(c, f"{fid}.{lang}")


@figure(plain=True)
def fig_merge(lang):
    """Three inputs meet in promote; the result is a merge or a conflict."""
    fid = "cli-updating-generated-code-merge"
    t = LABELS[fid][lang]
    c = canvas(1200, 560)
    fg = c.t["fg_dim"]
    top, vgap, gap = 28, 26, 84
    wi, wm = 330, 190
    wo = CONTENT_W - wi - wm - 2 * gap
    ins = [(c.purple, t["base"]), (c.orange, t["file"]), (c.blue, t["fresh"])]
    hi = max(card_h(wi, n, l, bullet=False) for _, (n, l) in ins)
    ys = [top + k * (hi + vgap) for k in range(3)]
    total = 3 * hi + 2 * vgap
    xm = X0 + wi + gap
    # promote spans the three inputs, so each arrives on its own level
    card(c, xm, top, wm, fg, *t["merge"], h=total, bullet=False, align="middle",
         valign="middle", wash=True)
    for (acc, (n, l)), y in zip(ins, ys):
        card(c, X0, y, wi, acc, n, l, h=hi, bullet=False, valign="middle")
        arrow(c, X0 + wi, y + hi / 2, xm, y + hi / 2, acc)
    xo = xm + wm + gap
    ho = max(card_h(wo, *t["merged"], bullet=False), card_h(wo, *t["conflict"], bullet=False))
    ogap = total - 2 * ho
    y_ok, y_no = top, top + ho + ogap
    card(c, xo, y_ok, wo, c.green, *t["merged"], h=ho, bullet=False, valign="middle")
    card(c, xo, y_no, wo, c.red, *t["conflict"], h=ho, bullet=False, valign="middle")
    arrow(c, xm + wm, y_ok + ho / 2, xo, y_ok + ho / 2, c.green)
    arrow(c, xm + wm, y_no + ho / 2, xo, y_no + ho / 2, c.red)
    ymid = top + total / 2
    edge_label(c, xo + wo / 2, y_ok + ho + 20, t["clean"], c.green, pill=False)
    edge_label(c, xo + wo / 2, y_no - 16, t["overlap"], c.red, pill=False)
    save(c, f"{fid}.{lang}")


@figure(plain=True)
def fig_states(lang):
    """Two questions place a promoted file in one of four cells; two states sit outside them."""
    fid = "cli-updating-generated-code-states"
    t = LABELS[fid][lang]
    c = canvas(1200, 700)
    fg = c.t["fg_dim"]
    top, lead, gap = 28, 300, 24
    wcol = (CONTENT_W - lead - 2 * gap) / 2
    x1 = X0 + lead + gap
    x2 = x1 + wcol + gap
    hh = card_h(wcol, None, [t["cols"][0]], bullet=False)
    for x, text in zip((x1, x2), t["cols"]):
        card(c, x, top, wcol, fg, None, [text], h=hh, bullet=False, align="middle", wash=True)
    ok, bad = c.green, c.red
    wsplit = (wcol - gap) / 2
    hc = max(card_h(wcol, *t["untouched"], bullet=False), card_h(wcol, *t["stale"], bullet=False),
             card_h(wsplit, *t["edited2"], bullet=False), card_h(wsplit, *t["conflict"], bullet=False))
    y1 = top + hh + gap
    y2 = y1 + hc + gap
    for y, text in zip((y1, y2), t["rows"]):
        card(c, X0, y, lead, fg, None, [text], h=hc, bullet=False, align="middle",
             valign="middle", wash=True)
    card(c, x1, y1, wcol, ok, *t["untouched"], h=hc, bullet=False, tag=t["pass"], valign="middle")
    card(c, x2, y1, wcol, bad, *t["stale"], h=hc, bullet=False, tag=t["fail"], valign="middle")
    card(c, x1, y2, wcol, ok, *t["edited"], h=hc, bullet=False, tag=t["pass"], valign="middle")
    card(c, x2, y2, wsplit, ok, *t["edited2"], h=hc, bullet=False, valign="middle")
    card(c, x2 + wsplit + gap, y2, wsplit, bad, *t["conflict"], h=hc, bullet=False, valign="middle")
    yo = y2 + hc + 60
    ho = max(card_h(wcol, *t["nobase"], bullet=False), card_h(wcol, *t["removed"], bullet=False))
    card(c, X0, yo, lead, fg, None, [t["outside"]], h=ho, bullet=False, align="middle",
         valign="middle", wash=True)
    card(c, x1, yo, wcol, bad, *t["nobase"], h=ho, bullet=False, tag=t["fail"])
    card(c, x2, yo, wcol, ok, *t["removed"], h=ho, bullet=False, tag=t["pass"])
    save(c, f"{fid}.{lang}")


for _lang in LANGS:
    fig_pipeline(_lang)
    fig_generated_classes(_lang)
    fig_template_resolution(_lang)
    fig_merge(_lang)
    fig_states(_lang)
