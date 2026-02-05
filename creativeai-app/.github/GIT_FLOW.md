# Git Flow 브랜치 전략 가이드

CreativeAI 프로젝트의 Git Flow 브랜치 전략 및 커밋 규칙입니다.

---

## 📌 Git Flow 브랜치 구조

```
main (production)
  │
  └─── develop (development)
         │
         ├─── feature/database-setup
         ├─── feature/auth-system
         ├─── feature/emoji-generation
         ├─── feature/avatar-maker
         └─── ...
         
release/v1.0.0 (출시 준비)
hotfix/critical-bug (긴급 수정)
```

---

## 🌿 브랜치 종류 및 역할

### 1. `main` (메인 브랜치)
- **용도**: 프로덕션 배포용
- **특징**: 항상 배포 가능한 안정적인 상태 유지
- **권한**: 직접 푸시 금지, PR을 통해서만 머지
- **태그**: 배포 시 버전 태그 생성 (v1.0.0, v1.1.0...)

### 2. `develop` (개발 브랜치)
- **용도**: 다음 릴리즈를 위한 개발 통합
- **특징**: 최신 개발 코드가 모이는 곳
- **생성**: `main`에서 분기
- **머지 대상**: `feature/*` 브랜치들이 완료되면 머지

### 3. `feature/*` (기능 개발 브랜치)
- **용도**: 새로운 기능 개발
- **생성**: `develop`에서 분기
- **명명 규칙**: `feature/기능명-간단설명`
  - 예: `feature/database-setup`
  - 예: `feature/user-authentication`
  - 예: `feature/emoji-api`
- **머지 대상**: `develop`으로 머지
- **삭제**: 머지 후 삭제

### 4. `release/*` (릴리즈 준비 브랜치)
- **용도**: 출시 준비 (버그 수정, 문서화)
- **생성**: `develop`에서 분기
- **명명 규칙**: `release/v버전`
  - 예: `release/v1.0.0`
- **머지 대상**: `main`과 `develop` 모두에 머지
- **삭제**: 머지 후 삭제

### 5. `hotfix/*` (긴급 수정 브랜치)
- **용도**: 프로덕션 긴급 버그 수정
- **생성**: `main`에서 분기
- **명명 규칙**: `hotfix/버그설명`
  - 예: `hotfix/critical-login-bug`
- **머지 대상**: `main`과 `develop` 모두에 머지
- **삭제**: 머지 후 삭제

---

## 📝 커밋 메시지 규칙

### Conventional Commits 형식

```
<타입>(<스코프>): <제목>

<본문> (선택사항)

<푸터> (선택사항)
```

### 커밋 타입

| 타입 | 설명 | 예시 |
|------|------|------|
| `feat` | 새로운 기능 추가 | `feat(database): MySQL 스키마 및 테이블 생성` |
| `fix` | 버그 수정 | `fix(auth): JWT 토큰 만료 처리 버그 수정` |
| `docs` | 문서 수정 | `docs(readme): 데이터베이스 설치 가이드 추가` |
| `style` | 코드 포맷팅 (기능 변경 없음) | `style(database): SQL 파일 들여쓰기 정리` |
| `refactor` | 코드 리팩토링 | `refactor(api): 사용자 조회 쿼리 최적화` |
| `test` | 테스트 코드 추가/수정 | `test(database): DB 연결 테스트 추가` |
| `chore` | 빌드, 설정 파일 수정 | `chore(deps): mysql2 패키지 추가` |
| `perf` | 성능 개선 | `perf(database): 인덱스 최적화` |

### 스코프 예시

- `database`: 데이터베이스 관련
- `auth`: 인증/권한
- `api`: API 엔드포인트
- `frontend`: 프론트엔드
- `emoji`: 이모지 생성 기능
- `avatar`: 아바타 생성 기능
- `filter`: 뷰티 필터 기능
- `config`: 환경 설정

### 커밋 메시지 예시

**좋은 예:**
```bash
feat(database): 6개 핵심 테이블 스키마 생성

- users, styles, creations 테이블 추가
- creation_files, credit_transactions 테이블 추가
- generation_history 테이블 추가
- 각 테이블에 외래 키 제약조건 설정
```

```bash
feat(database): 성능 최적화 인덱스 추가

- 사용자별 창작물 조회용 복합 인덱스
- 처리 중인 작업 필터링용 인덱스
- 크레딧 거래 내역 조회용 인덱스
```

**나쁜 예:**
```bash
update  # ❌ 타입만 있고 설명 없음
database work  # ❌ 타입 없음, 모호함
asdf  # ❌ 의미 없음
```

---

## 🔄 Git Flow 워크플로우

### 1️⃣ 새 기능 개발 시작

```bash
# develop 브랜치로 이동 및 최신화
git checkout develop
git pull origin develop

# 새 feature 브랜치 생성
git checkout -b feature/new-feature

# 작업 진행...
```

### 2️⃣ 작업 중 커밋

```bash
# 변경사항 확인
git status
git diff

# 스테이징
git add .

# 커밋 (규칙에 맞게)
git commit -m "feat(scope): 기능 설명"

# 원격 저장소에 푸시
git push origin feature/new-feature
```

### 3️⃣ 기능 완료 후 develop에 머지

```bash
# develop 최신화
git checkout develop
git pull origin develop

# feature 브랜치 머지
git merge feature/new-feature

# 충돌 해결 (필요시)

# 원격에 푸시
git push origin develop

# feature 브랜치 삭제
git branch -d feature/new-feature
git push origin --delete feature/new-feature
```

### 4️⃣ 릴리즈 준비

```bash
# release 브랜치 생성
git checkout -b release/v1.0.0 develop

# 버그 수정, 문서 업데이트...
git commit -m "docs(release): v1.0.0 릴리즈 노트 작성"

# main에 머지
git checkout main
git merge release/v1.0.0
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags

# develop에도 머지
git checkout develop
git merge release/v1.0.0

# release 브랜치 삭제
git branch -d release/v1.0.0
```

### 5️⃣ 긴급 버그 수정

```bash
# hotfix 브랜치 생성
git checkout -b hotfix/critical-bug main

# 버그 수정
git commit -m "fix(auth): 로그인 실패 버그 긴급 수정"

# main에 머지
git checkout main
git merge hotfix/critical-bug
git tag -a v1.0.1 -m "Hotfix v1.0.1"
git push origin main --tags

# develop에도 머지
git checkout develop
git merge hotfix/critical-bug

# hotfix 브랜치 삭제
git branch -d hotfix/critical-bug
```

---

## 📋 PR (Pull Request) 규칙

### PR 제목

```
[타입] 간단한 설명
```

예시:
- `[Feature] 데이터베이스 스키마 및 연동 구현`
- `[Fix] 크레딧 차감 트랜잭션 버그 수정`
- `[Docs] API 문서 업데이트`

### PR 설명 템플릿

```markdown
## 🎯 목적
이 PR이 해결하는 문제나 추가하는 기능 설명

## 📝 변경 사항
- 변경 사항 1
- 변경 사항 2
- 변경 사항 3

## 🧪 테스트
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 완료
- [ ] 수동 테스트 완료

## 📸 스크린샷 (UI 변경 시)
스크린샷 첨부

## 📚 참고 자료
관련 이슈, 문서 링크
```

---

## 🚀 현재 프로젝트 브랜치 전략

### 초기 설정

```bash
# Git 저장소 초기화 (아직 안 했다면)
git init

# main 브랜치로 첫 커밋
git add .
git commit -m "chore(init): 프로젝트 초기 설정"

# GitHub 원격 저장소 연결
git remote add origin https://github.com/your-username/creativeai-app.git
git branch -M main
git push -u origin main

# develop 브랜치 생성
git checkout -b develop
git push -u origin develop
```

### 현재 작업 (데이터베이스 구현)

```bash
# feature/database-setup 브랜치 생성
git checkout -b feature/database-setup develop

# 데이터베이스 파일 커밋
git add database/
git commit -m "feat(database): MySQL 스키마, 인덱스, 시드 데이터 생성"

git add backend/config/
git commit -m "feat(database): MySQL 연결 풀 및 헬퍼 함수 구현"

git add backend/tests/
git commit -m "test(database): DB 연결 및 데이터 검증 테스트 추가"

git add .env.example
git commit -m "chore(config): 환경 변수 템플릿 추가"

git add .gitignore
git commit -m "chore(git): .gitignore 파일 추가"

# 원격에 푸시
git push -u origin feature/database-setup
```

---

## 📌 팁 & 베스트 프랙티스

1. **자주 커밋하기**: 작은 단위로 자주 커밋
2. **의미 있는 메시지**: 나중에 봐도 이해할 수 있게
3. **한 커밋 = 한 기능**: 여러 기능을 한 커밋에 넣지 않기
4. **푸시 전 리베이스**: `git pull --rebase`로 히스토리 깔끔하게
5. **브랜치 최신화**: 머지 전 항상 develop 최신화
6. **충돌 해결**: 충돌 발생 시 팀원과 소통

---

## 🔗 참고 자료

- [Git Flow 공식 문서](https://nvie.com/posts/a-successful-git-branching-model/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)
