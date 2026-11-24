# 서비스와 컨트롤러 작성

SimpliX 기본 클래스로 서비스와 컨트롤러를 직접 작성하는 방법을 설명합니다. 엔티티의 CRUD는 [SimpliX CLI](../../../simplix-cli/README.ko.md)가 생성하며, 그 밖의 기능은 직접 작성합니다.

## 서비스 작성

```java
@Service
public class NoteService extends SimpliXBaseService<Note, String> {

    public NoteService(NoteRepository repository, EntityManager entityManager) {
        super(repository, entityManager);
    }

    @Transactional
    public Note write(String text) {
        Note note = new Note();
        note.setText(text);
        return saveAndFlush(note);
    }

    @Override
    public boolean hasOwnerPermission(String permission, String noteId, Object dto) {
        String user = SecurityContextHolder.getContext().getAuthentication().getName();
        return findById(noteId)
            .map(note -> user.equals(note.getCreatedBy()))
            .orElse(false);
    }
}
```

`SimpliXBaseService<E, ID>`는 저장소와 `EntityManager`를 받아 아래의 `SimpliXService` 연산을 구현합니다. `ModelMapper`는 protected 필드 `modelMapper`로 사용할 수 있습니다.

| 메서드 | 동작 |
|---|---|
| `findById(id)`, `findById(id, Projection.class)` | 레코드 한 건을 엔티티나 프로젝션으로 조회 |
| `findAllById(ids)`, `findAllById(ids, Projection.class)` | 식별자로 여러 레코드를 조회 |
| `findAll(pageable)`, `findAll(pageable, Projection.class)`, `findAll(Projection.class)` | 페이지 또는 전체를 조회 |
| `findAllWithSearch(searchCondition, Dto.class)` | searchable-jpa 검색을 실행하고 페이지를 DTO로 매핑 |
| `existsById(id)` | 레코드의 존재 여부를 확인 |
| `saveAndFlush(entity)`, `saveAll(entities)` | 저장 |
| `deleteById(id)`, `delete(entity)`, `deleteAllByIds(ids)`, `deleteAll(entities)` | 삭제 |
| `hasOwnerPermission(permission, id, dto)` | 직접 구현합니다. 현재 사용자가 레코드의 소유자인지 판정합니다 |
| `hasPermission(permission, id)` | DTO 없이 `hasOwnerPermission`을 호출 |

`hasOwnerPermission`은 추상 메서드이므로 모든 서비스가 구현해야 합니다. 예제는 노트를 작성한 사용자에게만 동작을 허용합니다. `@PreAuthorize("@noteService.hasPermission('edit', #noteId)")`처럼 `@PreAuthorize` 표현식에서 호출할 수 있습니다.

## 컨트롤러 작성

```java
@Getter
@Setter
public class NoteWrite {

    @NotBlank
    @Size(max = 200)
    private String text;
}

@RestController
@RequestMapping("/catalog/note")
public class NoteController extends SimpliXBaseController<Note, String> {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        super(noteService);
        this.noteService = noteService;
    }

    @GetMapping("/{noteId}")
    public SimpliXApiResponse<Note> get(@PathVariable String noteId) {
        return service.findById(noteId)
            .map(SimpliXApiResponse::success)
            .orElseThrow(() -> new SimpliXGeneralException(
                ErrorCode.GEN_NOT_FOUND, "Note not found", Map.of("noteId", noteId)));
    }

    @PostMapping
    public SimpliXApiResponse<Note> write(@RequestBody @Validated NoteWrite request) {
        return SimpliXApiResponse.success(noteService.write(request.getText()));
    }
}
```

`SimpliXBaseController<E, ID>`는 서비스를 protected 필드 `service`에 보관하고 `@SimpliXStandardApi`가 지정되어 있습니다. 이 어노테이션은 OpenAPI 문서에 표준 성공 응답과 오류 응답을 기술합니다. `SimpliXApiResponse`는 직접 반환해야 하며, 다른 타입을 반환하는 메서드의 값은 그대로 전송됩니다.

검증에 실패한 요청 본문에는 상태 코드 400과 실패한 필드 목록으로 응답합니다. [오류 처리](./handling-errors.md)를 참고하세요.

## 클라이언트를 위한 목록 설명

| 어노테이션 | 지정 위치 | 의미 |
|---|---|---|
| `@SimpliXDefaultSort` | 컨트롤러 | 엔티티 목록을 처음 열 때의 정렬 순서. 필드는 엔티티의 검색 DTO에서 정렬 가능해야 하며, 식별자는 지정할 수 없습니다 |
| `@SimpliXListFigures` | 컨트롤러 | 목록을 요약하는 수치: `GET /status-counts`가 받는 필드, `GET /aggregates`가 반환하는 값, `GET /counts`가 구간을 나누는 시간 축 |

SimpliX Meta가 이 정보를 제공합니다. [클라이언트용 메타데이터 제공](./publishing-metadata-for-clients.md)을 참고하세요.

```java
@RestController
@RequestMapping("/catalog/loan")
@SimpliXDefaultSort(field = "openedAt", direction = "desc")
@SimpliXListFigures(
    statusCounts = {"status"},
    aggregates = {
        @SimpliXListFigures.Figure(field = "lateFee", op = "sum"),
        @SimpliXListFigures.Figure(field = "memberId", op = "countDistinct")
    },
    timeAxis = "openedAt"
)
public class LoanController extends SimpliXBaseController<Loan, String> {
    // ...
}
```

| 속성 | 어노테이션 | 의미 |
|---|---|---|
| `field` | `@SimpliXDefaultSort` | 클라이언트가 정렬을 지정하지 않았을 때 목록의 정렬 기준 필드 |
| `direction` | `@SimpliXDefaultSort` | `asc` 또는 `desc`. 기본값은 `desc`입니다 |
| `statusCounts` | `@SimpliXListFigures` | 행 수를 집계할 수 있는 필드. 값별로 건수를 계산합니다 |
| `aggregates` | `@SimpliXListFigures` | 계산하는 지표. 순서대로 반환합니다. `Figure`마다 `field`와 `op`(`sum`, `count`, `countDistinct`, `min`, `max`)를 지정합니다 |
| `timeAxis` | `@SimpliXListFigures` | 목록의 기간을 구간으로 나누는 기준 시간 필드. 기간이 없는 목록은 비워 둡니다 |

## 트리 서비스

트리 엔티티의 서비스는 `SimpliXSimpliXTreeService<E, ID>`를 상속합니다. 이 클래스는 `SimpliXTreeRepository`를 받아 [simplix-core](../../../simplix-core/docs/ko/tree-structures.md)의 트리 연산을 제공합니다. `TreeEntity`를 구현한 엔티티에는 CLI가 트리 서비스를 생성합니다.

## 관련 문서

- [CRUD API 만들기](../../../docs/ko/building-a-crud-api.md)
- [오류 처리](./handling-errors.md)
- [simplix-core](../../../simplix-core/README.ko.md)
