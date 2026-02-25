# ⌨️ 팀 공통 코드 컨벤션 스킬 (Code Convention Skill)

## 🎯 개요
22인의 에이전트 연합이 작성하는 모든 코드의 가독성, 유지보수성, 그리고 일관성을 보장하기 위한 표준 규격입니다.

---

## 🏛️ 1. 공통 명명 규칙 (General Naming)
- **변수 및 함수**: `camelCase` (예: `getUserInfo`, `isAvailable`)
- **클래스 및 컴포넌트**: `PascalCase` (예: `AuthService`, `GlassCard`)
- **상수**: `UPPER_SNAKE_CASE` (예: `MAX_RETRY_COUNT`, `API_BASE_URL`)
- **디렉토리**: 하이픈(`-`)을 사용하는 `kebab-case` 우선 (예: `auth-service`, `user-profile`)

---

## ⚙️ 2. 백엔드 컨벤션 (Kotlin/Spring)
- **패키지**: `com.creativeai.*` 구조 준수.
- **DTO**: 요청은 `*Request`, 응답은 `*Response` 접미사 필수.
- **Layer**: `Controller`, `Service`, `Repository` 명칭을 클래스명 끝에 명시.
- **Logging**: SLF4J `logger`를 사용하며, 중요 로직 진입 시 `DEBUG`, 에러 시 `ERROR` 레벨 준수.
- **Null Safety**: Kotlin의 `?` 연산자를 활용하여 NPE를 원천 차단하고 `Optional` 대신 `Mono/Flux` 빈 처리 사용.

---

## 🎨 3. 프론트엔드 컨벤션 (JS/React)
- **컴포넌트**: 파일명과 컴포넌트명을 일치시키며 `PascalCase` 사용.
- **Hooks**: 반드시 `use` 접두사를 사용 (예: `useAuth`, `useFetchData`).
- **Props**: 구조 분해 할당(Destructuring)을 통해 명시적으로 수신.
- **스타일링**: CSS 변수를 활용한 테마 관리 및 `common.css`의 유틸리티 클래스 선언 우선.
- **Import 순서**: 
  1. 외부 라이브러리 (React, Route 등)
  2. 전역 상태 및 API 서비스
  3. 공통 컴포넌트
  4. 현재 페이지 특화 컴포넌트
  5. 스타일 파일 (.css)

---

## 🎯 4. CSS 컨벤션 (⚠️ 중요)

### 4.1 클래스명 규칙
- **BEM 변형**: `block-element` 방식 사용 (예: `ribbon-toolbar`, `tool-section`, `section-label`)
- **상태 클래스**: 별도 클래스로 추가 (예: `.active`, `.disabled`, `.primary`)
- **컴포넌트 고유 접두사**: 각 컴포넌트별 고유 접두사로 충돌 방지

### 4.2 JSX-CSS 정합성 규칙 (필수)
- JSX에서 `className`으로 사용하는 **모든 클래스**는 CSS 파일에 기본 정의가 있어야 함
- **미디어쿼리에만** 정의하고 기본 스타일이 없는 클래스는 **금지**
- 새 컴포넌트 생성 시: JSX 작성 → CSS 기본 스타일 작성 → 반응형 스타일 추가

### 4.3 CSS 변수
- 색상, 간격, 폰트 등은 반드시 CSS 변수(`var(--xxx)`)로 관리
- 하드코딩된 색상 값 사용 최소화

---

## 📝 5. 문서화 및 주석 (Documentation)
- **언어 우선순위**: 비즈니스 로직 및 핵심 설명 주석은 반드시 **한글**로 작성.
- **함수 주석**: 복잡한 로직의 경우 JSDoc/KDoc 스타일로 매개변수와 반환값 설명.
- **Dead Code**: 사용하지 않는 코드, 주석 처리된 실행 코드는 커밋 시 반드시 제거.

---

## 📌 6. Git 커밋 메시지
```
type(scope): 한글 설명
```
- **type**: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`
- **scope**: `frontend`, `backend`, `infra`, `design` (선택)
- **설명**: 반드시 한글, "무엇을 왜" 명확하게

---

## 🛠️ 7. 검증 가이드 (Enforcement)
- 모든 에이전트는 코드 생성 전 이 스킬을 숙지하고, 상호 검수(`code-review Skill`) 시 이 컨벤션을 기준으로 판정합니다.
- quality-gate 스킬의 [필수] 코드 품질 항목에서 이 컨벤션 준수를 확인합니다.
