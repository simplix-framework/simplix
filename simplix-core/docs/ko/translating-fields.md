# 필드 번역

문구를 여러 언어로 저장하고, 독자의 언어에 맞는 문구를 응답에 담는 방법을 설명합니다. 번역은 객체의 맵 필드에 보관하고, 객체를 JSON으로 직렬화할 때 `@I18nTrans`가 그중에서 값을 선택합니다.

## 필드 번역

```java
@Getter
@Setter
public class GenreInfo {

    @I18nTrans(source = "nameI18n")
    private String name;

    @JsonIgnore
    private Map<String, String> nameI18n;
}
```

`nameI18n`이 `{"en": "Fantasy", "ko": "판타지"}`일 때, 한국어 요청은 한국어 문구를 받으며 맵은 응답에 포함되지 않습니다.

```json
{
  "name" : "판타지"
}
```

맵에 없는 언어(예: 프랑스어)의 요청은 기본 로케일의 값인 `Fantasy`를 받습니다.

## 번역 데이터의 출처

맵은 보통 엔티티의 문자열 컬럼 하나에 저장하며, 다른 필드와 함께 DTO로 복사합니다. `JsonMapConverter`는 `Map<String, String>`을 JSON 객체로 저장합니다.

```java
@Entity
@Table(name = "genres")
public class Genre extends SimpliXBaseEntity<String> {

    @Id
    @UuidV7Generator
    private String id;

    // The text shown when no translation fits
    @Column(nullable = false)
    private String name;

    // {"en": "Fantasy", "ko": "판타지"}
    @Convert(converter = JsonMapConverter.class)
    @Column(name = "name_i18n", columnDefinition = "TEXT")
    private Map<String, String> nameI18n = new HashMap<>();
}
```

로케일은 요청의 로케일을 사용합니다. [스타터](../../../spring-boot-starter-simplix/README.ko.md)를 사용하면 클라이언트가 `Accept-Language` 헤더로 선택합니다(예: `Accept-Language: ko`). 번역을 편집하는 화면은 `@JsonIgnore`를 지정하지 않은 DTO로 맵 자체를 읽습니다.

## 중첩 객체의 필드 번역

객체를 담는 필드에 어노테이션을 지정합니다. `source`는 맵의 경로이고, `target`은 번역 값을 받을 필드의 경로입니다.

```java
public class BookInfo {

    @I18nTrans(source = "genre.nameI18n", target = "genre.name")
    private Genre genre;
}

public class Genre {

    private String code;
    private String name;

    @JsonIgnore
    private Map<String, String> nameI18n;
}
```

어노테이션은 반복해서 지정할 수 있으므로(컴파일러가 반복한 어노테이션을 `@I18nTransList`에 모읍니다) 같은 객체의 여러 필드를 번역할 수 있습니다. 경로는 여러 객체를 거칠 수 있습니다(`shelf.section.nameI18n`).

```java
@I18nTrans(source = "genre.nameI18n", target = "genre.name")
@I18nTrans(source = "genre.descriptionI18n", target = "genre.description")
private Genre genre;
```

직렬화기는 리플렉션으로 맵을 읽으므로, 맵을 JSON에서 제외하는 `@JsonIncludeProperties`나 `@JsonIgnore`와 함께 사용할 수 있습니다.

## 번역 선택 순서

1. 요청의 로케일과 정확히 일치하는 값(예: `ko_KR`)
2. 요청의 언어 코드(`ko`)
3. 설정한 기본 로케일
4. 어노테이션의 `defaultLocale`
5. 값이 있는 지원 로케일 중 첫 번째
6. 맵의 첫 번째 값
7. 필드 자체의 값

- 필드 값이 `null`이면 맵의 내용과 관계없이 `null`로 유지합니다.
- 맵이 `null`이거나 비어 있으면 필드 값을 그대로 사용합니다.

## 설정

```yaml
simplix:
  i18n:
    default-locale: en
    supported-locales:
      - en
      - ko
      - ja
```

| 속성 | 기본값 | 의미 |
|---|---|---|
| `simplix.i18n.default-locale` | `en` | 요청 로케일의 번역이 없을 때 사용하는 로케일 |
| `simplix.i18n.supported-locales` | `en`, `ko`, `ja` | 그다음에 순서대로 시도하는 로케일 |

| `@I18nTrans` 속성 | 기본값 | 의미 |
|---|---|---|
| `source` | 필수 | 번역 맵의 경로 |
| `target` | 빈 값 | 값을 받을 필드의 경로. 비워 두면 어노테이션을 지정한 필드를 번역합니다 |
| `defaultLocale` | `en` | 이 필드의 대체 로케일 |

## 엔티티와 열거형의 메시지

`EntityMessageResolver.resolveMessage(key)`와 `EnumMessageResolver.resolveMessage(key)`는 메시지 번들에서 현재 로케일의 문구를 읽습니다. 로케일을 인자로 전달할 수도 있습니다.

## 관련 문서

- [타입 변환](./converting-types.md)
- [spring-boot-starter-simplix](../../../spring-boot-starter-simplix/README.ko.md): 메시지 소스와 로케일 결정
