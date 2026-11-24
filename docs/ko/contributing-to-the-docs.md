# 문서 기여 가이드

이 저장소의 문서 구성, 사이트를 미리 보는 방법, 변경을 보내기 전에 확인할 내용을 설명합니다.

## 문서의 위치

| 문서 | 영어 | 한국어 |
|---|---|---|
| 저장소 소개 | `README.md` | `README.ko.md` |
| 프레임워크 공통 문서 | `docs/en/*.md` | `docs/ko/*.md` |
| 모듈 소개 | `<module>/README.md` | `<module>/README.ko.md` |
| 모듈 문서 | `<module>/docs/en/*.md` | `<module>/docs/ko/*.md` |
| 그림 | `docs/assets/figures/<id>.en.svg` | `docs/assets/figures/<id>.ko.svg` |

모든 문서는 영어와 한국어로 작성하며, 제목 구조와 코드 블록, 그림이 같아야 합니다. 한 언어의 파일을 바꾸면 같은 변경에서 다른 언어의 파일도 함께 바꿉니다.

## 문서의 종류

| 종류 | 답하는 질문 | 파일 |
|---|---|---|
| 소개 | 무엇이고 어떻게 시작하나 | `README.md` |
| 시작하기 | 첫 결과를 어떻게 얻나 | `getting-started.md` |
| 가이드 | 작업 하나를 어떻게 수행하나 | 작업 이름으로 지정 |
| 레퍼런스 | 옵션, 명령, 속성이 무엇을 하나 | `*-reference.md` |
| 동작 원리 | 어떻게 동작하나 | `how-it-works.md` |
| 문제 해결 | 실패했을 때 무엇을 하나 | `troubleshooting.md` |

SimpliX를 사용하는 개발자를 독자로 작성하세요. 작업에서 출발하고, 실제로 실행되는 명령이나 코드를 먼저 제시한 뒤 결과를 설명합니다. 릴리스 라인마다 다른 요구 사항은 라인별 행이 있는 표로 적습니다.

## 그림

그림은 `docs/figures` 아래의 Python 모듈이 그리는 SVG이며, 언어별로 한 장씩 저장합니다. 모듈을 고치고 다시 빌드하세요. 직접 편집한 SVG는 다음 빌드에서 덮어씁니다. 명령은 `docs/figures/README.md`에 있습니다.

## 사이트 미리 보기

```bash
# Assemble the site under build-docs/
./scripts/build-docs.sh

# Serve it
cd build-docs && python3 -m http.server 3000
```

`http://localhost:3000`을 여세요. 사이트는 Docsify로 만들며, `docs/ko/_sidebar.md`와 `docs/en/_sidebar.md`에 페이지 목록이 있습니다. 새 문서는 양쪽에 추가하세요.

## 보내기 전 확인

```bash
# Language parity, links, images, symbols
node .claude/scripts/validate-docs.mjs

# Links and images of the built site
./scripts/build-docs.sh && node .claude/scripts/validate-docs.mjs --site
```

- 이모지는 쓰지 않습니다. 상태 표시는 ✔ ✖ ⚠ ℹ만 사용합니다.
- 문서에 패치 버전을 적지 않습니다. `${version}`으로 적거나 생략합니다.
- 문서의 이름을 바꾸거나 삭제하면 사이드바와 그 문서를 가리키는 모든 링크를 고칩니다.
