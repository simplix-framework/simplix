# 문서 그림

문서(`docs/en`, `docs/ko`, 각 모듈의 `docs/en`과 `docs/ko`, 소개 문서)의 모든 다이어그램은 이 폴더의 Python 모듈이 svg-diagrams 스킬의 문서 그림 라이브러리(`simplecore` 플러그인의 `<skill>/scripts/docfigures/`)로 그린 SVG입니다. 라이브러리는 복사하지 않고 import해서 사용합니다. SVG는 빌드 산출물이므로 SVG를 직접 수정하지 말고 모듈을 수정한 뒤 다시 빌드하세요.

## 구성

| 경로 | 내용 |
| --- | --- |
| `docs/figures/document-figures.json` | 설정: 보드, 글자 크기 단계, 선 굵기, 테마, 글꼴 |
| `docs/figures/<area>.py` | SimpliX 모듈 또는 문서 영역별 모듈 |
| `docs/assets/figures/<figure-id>.<lang>.svg` | 생성된 그림. 커밋 대상입니다 |

설정 파일은 모든 명령에 `--config`로 전달합니다. 설정 파일 안의 상대 경로는 `docs/figures/`를 기준으로 해석됩니다.

## 이름 규칙

그림 ID는 `<area>-<document-slug>-<what>` 형식이며 소문자와 붙임표를 사용합니다. area는 모듈의 짧은 이름(`cli`, `core`, `auth`)이고, 프레임워크 전체 문서는 `start`입니다. `cli-readme-pipeline`은 `cli-readme-pipeline.en.svg`와 `cli-readme-pipeline.ko.svg`로 저장됩니다. 문서는 자신의 언어에 해당하는 파일을 문서 기준 상대 경로로 참조합니다.

## 그림 추가

1. 해당 영역의 모듈에서 `LABELS`에 그림 ID를 키로 하는 항목을 추가합니다. 항목에는 그림에 표시할 모든 라벨을 `en`과 `ko` 표로 작성합니다. 한국어 라벨은 `.claude/GLOSSARY.md`를 따르며, 코드 식별자는 두 언어에서 같습니다.
2. `lang`을 받는 함수를 작성합니다. 이 함수는 `LABELS[fid][lang]`만 읽고, `canvas(1200, h)`에 그린 뒤 `save(c, f"{fid}.{lang}")`으로 끝납니다.
3. 모듈 끝에서 `LANGS`의 항목마다 함수를 호출합니다.
4. 빌드하고 검증한 뒤, 렌더링한 PNG를 언어별로 확인합니다.

## 명령

저장소 루트에서 실행합니다. `SVG_DIAGRAMS`에는 svg-diagrams 스킬 디렉터리(`.../plugins/simplecore/skills/svg-diagrams`)를 지정합니다.

```bash
# build every module (or name one: ... build.py --config ... cli)
python3 "$SVG_DIAGRAMS/scripts/docfigures/build.py" --config docs/figures/document-figures.json

# every check, plus PNGs to read
python3 "$SVG_DIAGRAMS/scripts/docfigures/verify.py" --config docs/figures/document-figures.json --render <scratch dir>
```

`verify.py`의 결과가 `verdict: pass`인 그림만 문서에 추가합니다.
