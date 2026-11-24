# Writing services and controllers

How to write a service and a controller by hand on the SimpliX base classes. The [SimpliX CLI](../../../simplix-cli/README.md) generates both for the CRUD of an entity; write them yourself for anything else.

## Write a service

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

`SimpliXBaseService<E, ID>` takes the repository and the `EntityManager`, and implements the `SimpliXService` operations below. A `ModelMapper` is available as the protected field `modelMapper`.

| Method | Does |
|---|---|
| `findById(id)`, `findById(id, Projection.class)` | reads one record, as the entity or as a projection |
| `findAllById(ids)`, `findAllById(ids, Projection.class)` | reads several records by id |
| `findAll(pageable)`, `findAll(pageable, Projection.class)`, `findAll(Projection.class)` | reads a page or everything |
| `findAllWithSearch(searchCondition, Dto.class)` | runs a searchable-jpa search and maps the page to DTOs |
| `existsById(id)` | tells whether a record exists |
| `saveAndFlush(entity)`, `saveAll(entities)` | saves |
| `deleteById(id)`, `delete(entity)`, `deleteAllByIds(ids)`, `deleteAll(entities)` | deletes |
| `hasOwnerPermission(permission, id, dto)` | you implement it: whether the current user owns the record |
| `hasPermission(permission, id)` | calls `hasOwnerPermission` without a DTO |

`hasOwnerPermission` is abstract, so every service implements it. The example lets the user who wrote a note act on it; a `@PreAuthorize` expression can call it, for example `@PreAuthorize("@noteService.hasPermission('edit', #noteId)")`.

## Write a controller

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

`SimpliXBaseController<E, ID>` keeps the service in the protected field `service` and carries `@SimpliXStandardApi`, which describes the standard success and error responses in the OpenAPI document. Return a `SimpliXApiResponse` yourself; a method that returns another type is sent as it is.

A request body that fails validation is answered with status 400 and the failing fields; see [Handling errors](./handling-errors.md).

## Describe a list for clients

| Annotation | On | Meaning |
|---|---|---|
| `@SimpliXDefaultSort` | a controller | the order a list of the entity opens in. The field must be sortable in the entity's search DTO and is never the id |
| `@SimpliXListFigures` | a controller | the figures a list can be summed up by: the fields `GET /status-counts` accepts, what `GET /aggregates` returns, and the time axis `GET /counts` slices |

SimpliX Meta publishes both; see [Publishing metadata for clients](./publishing-metadata-for-clients.md).

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

| Attribute | Of | Meaning |
|---|---|---|
| `field` | `@SimpliXDefaultSort` | the field a list is ordered by when the client names none |
| `direction` | `@SimpliXDefaultSort` | `asc` or `desc`; `desc` by default |
| `statusCounts` | `@SimpliXListFigures` | the fields rows can be counted by, one count per value |
| `aggregates` | `@SimpliXListFigures` | the computed figures, in order; each `Figure` names a `field` and an `op`: `sum`, `count`, `countDistinct`, `min` or `max` |
| `timeAxis` | `@SimpliXListFigures` | the time field a window of the list is sliced on; empty when the list has no time range |

## Tree services

A service for a tree entity extends `SimpliXSimpliXTreeService<E, ID>`, which takes the `SimpliXTreeRepository` and provides the tree operations of [simplix-core](../../../simplix-core/docs/en/tree-structures.md). The CLI generates one for an entity that implements `TreeEntity`.

## Related documents

- [Building a CRUD API](../../../docs/en/building-a-crud-api.md)
- [Handling errors](./handling-errors.md)
- [simplix-core](../../../simplix-core/README.md)
