"""Figures for the framework-wide documents (README*.md, docs/{en,ko}).

Each figure function takes a language code and reads every label from LABELS,
so one drawing produces <figure-id>.en.svg and <figure-id>.ko.svg.
"""
from common import (BADGE_GAP, BODY, CHIP_RISE, CONTENT_W, PAD, STROKE, badge_rows, badges,
                    badges_h, canvas, card, card_h, edge_label, figure, note, row, save, tw, zone)

LANGS = ("en", "ko")
X0 = 38

STARTER = ["simplix-core", "simplix-auth", "simplix-encryption", "simplix-cache",
           "simplix-hibernate", "simplix-mybatis", "simplix-messaging", "simplix-email",
           "simplix-file", "simplix-excel", "simplix-scheduler", "simplix-egov"]
SEPARATE = ["simplix-stream", "simplix-sync", "simplix-license"]

LABELS = {
    "start-readme-modules": {
        "en": {
            "app": ("Your application", ["Spring Boot 4 or 3", "Java 17 or later"]),
            "starter": "spring-boot-starter-simplix",
            "separate": "Added one by one",
            "cli": "Command line tool",
            "one": "one dependency",
            "each": "a dependency each",
            "writes": "generates code",
        },
        "ko": {
            "app": ("애플리케이션", ["Spring Boot 4 · 3", "Java 17 이상"]),
            "starter": "spring-boot-starter-simplix",
            "separate": "개별 추가 모듈",
            "cli": "명령줄 도구",
            "one": "의존성 하나",
            "each": "모듈별 의존성",
            "writes": "코드 생성",
        },
    },
    "start-building-a-crud-api-request-flow": {
        "en": {
            "stages": [("Client", ["HTTP request"]),
                       ("AuthorRestController", ["permission check", "DTO validation"]),
                       ("AuthorService", ["transaction", "entity and DTO mapping"]),
                       ("AuthorRepository", ["Spring Data JPA"])],
            "bases": ["", "SimpliXBaseController", "SimpliXBaseService", "SimpliXBaseRepository"],
            "extends": "extends",
            "verdict": "Every answer is a SimpliXApiResponse, and an exception is answered in the same shape",
        },
        "ko": {
            "stages": [("클라이언트", ["HTTP 요청"]),
                       ("AuthorRestController", ["권한 검사 · DTO 검증"]),
                       ("AuthorService", ["트랜잭션 처리", "엔티티와 DTO 변환"]),
                       ("AuthorRepository", ["Spring Data JPA"])],
            "bases": ["", "SimpliXBaseController", "SimpliXBaseService", "SimpliXBaseRepository"],
            "extends": "상속",
            "verdict": "모든 응답은 SimpliXApiResponse이며, 예외도 같은 형태로 응답",
        },
    },
    "start-securing-an-application-token-flow": {
        "en": {
            "client": "Client",
            "targets": [("Token endpoint", ["/auth/token/issue"]),
                        ("Your API", ["paths under /api"]),
                        ("Token endpoint", ["/auth/token/refresh"])],
            "messages": ["user name and password (Basic)", "access token and refresh token",
                         "Authorization: Bearer <access token>", "SimpliXApiResponse",
                         "X-Refresh-Token: <refresh token>", "new access token and refresh token"],
        },
        "ko": {
            "client": "클라이언트",
            "targets": [("토큰 엔드포인트", ["/auth/token/issue"]),
                        ("애플리케이션 API", ["/api 아래의 경로"]),
                        ("토큰 엔드포인트", ["/auth/token/refresh"])],
            "messages": ["사용자 이름과 비밀번호 (Basic)", "액세스 토큰과 리프레시 토큰",
                         "Authorization: Bearer <액세스 토큰>", "SimpliXApiResponse",
                         "X-Refresh-Token: <리프레시 토큰>", "새 액세스 토큰과 리프레시 토큰"],
        },
    },
}


def arrow(c, x1, y1, x2, y2, color):
    c.line(x1, y1, x2, y2, color=color, sw=STROKE, marker=color)


def zone_h(inner):
    return CHIP_RISE + PAD + inner + PAD


def fitted_w(texts):
    """The width of a zone that holds these badges on one line."""
    rows, ws = badge_rows(texts, CONTENT_W, BODY)
    return sum(ws) + BADGE_GAP * (len(texts) - 1) + 2 * PAD


@figure(plain=True)
def fig_modules(lang):
    """The starter brings most modules in one dependency; three are added one by one; the CLI writes code."""
    fid = "start-readme-modules"
    t = LABELS[fid][lang]
    c = canvas(1200, 560)
    top = 28 + CHIP_RISE
    wa, gap = 230, 170
    xz = X0 + wa + gap
    wz = CONTENT_W - wa - gap
    inner = wz - 2 * PAD
    rows = [(c.blue, t["starter"], STARTER, wz), (c.orange, t["separate"], SEPARATE, fitted_w(SEPARATE))]
    zgap = 30 + CHIP_RISE
    y = top
    mids = []
    for acc, label, names, w in rows:
        zh = zone_h(badges_h(names, w - 2 * PAD, BODY))
        y0 = zone(c, xz, y, w, zh, acc, label)
        badges(c, xz + PAD, y0, names, w - 2 * PAD, acc, BODY)
        mids.append(y + zh / 2)
        y += zh + zgap
    # the command line tool is not a dependency: a card, not a zone of modules
    wc = 320
    hc = card_h(wc, t["cli"], ["@simplix-boot/cli"], bullet=False)
    y -= CHIP_RISE
    card(c, xz, y, wc, c.purple, t["cli"], ["@simplix-boot/cli"], h=hc, bullet=False)
    mids.append(y + hc / 2)
    y += hc + zgap
    total = y - zgap - top
    card(c, X0, top, wa, c.green, *t["app"], h=total, bullet=False, valign="middle", wash=True)
    xr = X0 + wa
    arrow(c, xr, mids[0], xz, mids[0], c.blue)
    edge_label(c, xr + gap / 2, mids[0] - 18, t["one"], c.blue, pill=False)
    arrow(c, xr, mids[1], xz, mids[1], c.orange)
    edge_label(c, xr + gap / 2, mids[1] - 18, t["each"], c.orange, pill=False)
    arrow(c, xz, mids[2], xr, mids[2], c.purple)
    edge_label(c, xr + gap / 2, mids[2] - 18, t["writes"], c.purple, pill=False)
    save(c, f"{fid}.{lang}")


@figure(plain=True)
def fig_request_flow(lang):
    """A request passes the generated controller, service and repository, each on a SimpliX base class."""
    fid = "start-building-a-crud-api-request-flow"
    t = LABELS[fid][lang]
    c = canvas(1200, 520)
    fg = c.t["fg_dim"]
    top, gap = 28, 44
    wclient = 150
    xs, w = row(3, gap, width=CONTENT_W - wclient - gap, x0=X0 + wclient + gap)
    accents = [c.blue, c.teal, c.purple]
    h = max(card_h(w, n, l, bullet=False) for n, l in t["stages"][1:])
    card(c, X0, top, wclient, fg, *t["stages"][0], h=h, bullet=False, valign="middle", wash=True)
    for x, acc, (name, lines) in zip(xs, accents, t["stages"][1:]):
        card(c, x, top, w, acc, name, lines, h=h, bullet=False, valign="middle")
    my = top + h / 2
    arrow(c, X0 + wclient, my, xs[0], my, fg)
    for i in range(2):
        arrow(c, xs[i] + w, my, xs[i + 1], my, fg)
    # the base class under each generated class
    y2 = top + h + 62
    hb = card_h(w, None, [t["bases"][1]], bullet=False)
    for x, acc, base in zip(xs, accents, t["bases"][1:]):
        card(c, x, y2, w, acc, None, [base], h=hb, bullet=False, align="middle", wash=True)
        arrow(c, x + w / 2, top + h, x + w / 2, y2, acc)
    edge_label(c, xs[0] + w / 2 + 46, top + h + 31, t["extends"], accents[0], pill=False)
    note(c, X0, y2 + hb + 26, CONTENT_W, t["verdict"], c.green)
    save(c, f"{fid}.{lang}")


@figure(plain=True)
def fig_token_flow(lang):
    """Issue tokens with the password, call the API with the access token, renew with the refresh token."""
    fid = "start-securing-an-application-token-flow"
    t = LABELS[fid][lang]
    c = canvas(1200, 620)
    fg = c.t["fg_dim"]
    top, step, vgap = 28, 58, 22
    wc, wt = 190, 290
    xt = X0 + CONTENT_W - wt
    pair = 2 * step
    accents = [c.blue, c.green, c.orange]
    total = 3 * pair + 2 * vgap
    card(c, X0, top, wc, fg, t["client"], [], h=total, bullet=False, valign="middle", wash=True)
    for k, (acc, (name, lines)) in enumerate(zip(accents, t["targets"])):
        y = top + k * (pair + vgap)
        card(c, xt, y, wt, acc, name, lines, h=pair, bullet=False, valign="middle")
        y_req = y + step / 2 + 8
        y_res = y + step + step / 2 + 2
        arrow(c, X0 + wc, y_req, xt, y_req, acc)
        arrow(c, xt, y_res, X0 + wc, y_res, fg)
        mid = (X0 + wc + xt) / 2
        edge_label(c, mid, y_req - 17, t["messages"][2 * k], acc, size=BODY, pill=False)
        edge_label(c, mid, y_res - 17, t["messages"][2 * k + 1], fg, size=BODY, pill=False)
    save(c, f"{fid}.{lang}")


for _lang in LANGS:
    fig_modules(_lang)
    fig_request_flow(_lang)
    fig_token_flow(_lang)
