# Translating fields

How to store a text in several languages and send each reader the one in their language. The translations are kept in a map on the object, and `@I18nTrans` picks one while the object is written to JSON.

## Translate a field

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

With `nameI18n` holding `{"en": "Fantasy", "ko": "판타지"}`, a request in Korean receives the Korean text and the map itself is not sent.

```json
{
  "name" : "판타지"
}
```

A request in a language the map lacks, such as French, receives `Fantasy`: the default locale.

## Where the translations come from

The map usually lives on the entity, in one text column, and is copied to the DTO with the rest of the fields. `JsonMapConverter` stores a `Map<String, String>` as a JSON object.

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

The locale is that of the request. With the [starter](../../../spring-boot-starter-simplix/README.md) a client chooses it with the `Accept-Language` header, for example `Accept-Language: ko`. A screen that edits the translations reads the map itself, through a DTO without `@JsonIgnore` on it.

## Translate a field of a nested object

Put the annotation on the field that holds the object. `source` is the path of the map and `target` the path of the field that receives the translation.

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

The annotation is repeatable (the compiler collects the repetitions in `@I18nTransList`), so several fields of the same object can be translated, and a path may go through more than one object (`shelf.section.nameI18n`).

```java
@I18nTrans(source = "genre.nameI18n", target = "genre.name")
@I18nTrans(source = "genre.descriptionI18n", target = "genre.description")
private Genre genre;
```

The serializer reads the map through reflection, so it works together with `@JsonIncludeProperties` or `@JsonIgnore` that keep the map out of the JSON.

## Which translation is chosen

1. the exact locale of the request, such as `ko_KR`
2. its language, `ko`
3. the configured default locale
4. the `defaultLocale` of the annotation
5. the first supported locale that has a value
6. the first value of the map
7. the value of the field itself

- A field whose value is `null` stays `null`, whatever the map holds.
- A map that is `null` or empty leaves the field as it is.

## Configuration

```yaml
simplix:
  i18n:
    default-locale: en
    supported-locales:
      - en
      - ko
      - ja
```

| Property | Default | Meaning |
|---|---|---|
| `simplix.i18n.default-locale` | `en` | the locale used when the request's has no translation |
| `simplix.i18n.supported-locales` | `en`, `ko`, `ja` | the locales tried next, in order |

| Attribute of `@I18nTrans` | Default | Meaning |
|---|---|---|
| `source` | required | the path of the translation map |
| `target` | empty | the path of the field that receives the value; empty translates the annotated field itself |
| `defaultLocale` | `en` | the fallback locale of this field |

## Messages of entities and enums

`EntityMessageResolver.resolveMessage(key)` and `EnumMessageResolver.resolveMessage(key)` read a text from the message bundles for the current locale, or for a locale passed as an argument.

## Related documents

- [Converting types](./converting-types.md)
- [spring-boot-starter-simplix](../../../spring-boot-starter-simplix/README.md): message sources and locale resolution
