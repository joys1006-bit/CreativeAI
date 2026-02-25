# 🛡️ 보안 프로토콜 스킬 (Security Protocol Skill)

## 🎯 개요
CISO가 관장하는 전사 보안 기준입니다. 모든 에이전트는 코드 작성 및 배포 시 이 스킬을 반드시 준수합니다.

## 🔐 1. 시크릿 관리 (Secrets Management)
- **절대 금지**: API 키, 비밀번호, JWT 시크릿을 소스 코드에 하드코딩
- **필수 방식**: 환경변수(`process.env`, `System.getenv()`) 또는 `.env` 파일 참조
- **`.gitignore` 필수 패턴**:
  ```
  .env
  .env.*
  *.key
  *.pem
  ```
- **키 노출 시 대응**: 즉시 키 재발급 → Git 히스토리 정리 (`git filter-branch` 또는 BFG)

## 🔑 2. 인증 및 인가 (Authentication & Authorization)
- 모든 API 엔드포인트에 인증 검사 필수 (public 엔드포인트는 명시적 예외 처리)
- JWT 토큰 검증: 만료, 서명, 권한 수준 3중 검사
- 비밀번호 저장: 반드시 bcrypt/scrypt 등 단방향 해싱

## 🧹 3. 입력 검증 (Input Validation)
- 모든 사용자 입력은 **화이트리스트** 기반 검증
- SQL Injection 방지: PreparedStatement/파라미터 바인딩 필수
- XSS 방지: HTML 이스케이핑, CSP 헤더 설정
- 파일 업로드: 확장자 + MIME 타입 이중 검증, 크기 제한

## 📦 4. 의존성 보안 (Dependency Security)
- 서드파티 라이브러리 추가 시 보안 취약점 확인
- `npm audit` / `gradle dependencyCheckAnalyze` 정기 실행 권장
- 알려진 취약 버전 사용 금지

## 🔍 5. 커밋 전 보안 체크리스트
코드를 커밋하기 전에 반드시 확인:
- [ ] 소스 코드에 시크릿/키/비밀번호가 없는가?
- [ ] `.env` 파일이 `.gitignore`에 포함되었는가?
- [ ] 새 API 엔드포인트에 인증 검사가 있는가?
- [ ] 사용자 입력이 검증되는가?
- [ ] 에러 메시지에 내부 정보가 노출되지 않는가?

---
> [!CAUTION]
> 보안 위반은 등급 평가에 직결됩니다. 시크릿 노출 사고는 Critical 이슈로 즉시 CISO에게 보고합니다.
