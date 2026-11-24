# 설정 레퍼런스

모듈은 `mybatis` 아래에 있는 MyBatis Spring Boot 스타터의 속성으로 설정합니다.

| 속성 | 기본값 | 의미 |
|---|---|---|
| `mybatis.enabled` | `true` | `false`이면 SimpliX의 MyBatis 구성을 제외 |
| `mybatis.mapper-locations` | 없음 | `classpath*:mapper/**/*.xml` 같은 매퍼 XML 파일의 위치 |
| `mybatis.type-aliases-package` | 없음 | XML에서 짧은 이름으로 지정할 수 있는 클래스의 패키지 |
| `mybatis.config-location` | 없음 | `classpath:mybatis-config.xml` 같은 MyBatis 설정 파일 |
| `mybatis.configuration.map-underscore-to-camel-case` | `false` | `pen_name` 컬럼을 `penName` 속성에 매핑 |
| `mybatis.configuration.call-setters-on-nulls` | `false` | 컬럼이 `NULL`인 속성의 setter 호출 |

## 모듈이 등록하는 내용

`SimpliXMyBatisAutoConfiguration`이 속성을 `SimpliXMyBatisProperties`에 바인딩하고 트랜잭션 관리를 활성화하며, `SqlSessionFactory`와 `SqlSessionTemplate`이 없는 애플리케이션에는 이 빈을 등록합니다. 이 자동 구성은 MyBatis 스타터의 자동 구성 뒤에 실행됩니다. 모듈이 함께 가져오는 MyBatis 스타터가 있으면 스타터의 세션 팩토리가 사용되며, 위 속성으로 설정합니다.

## 관련 문서

- [시작하기](./getting-started.md)
