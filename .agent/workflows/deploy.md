---
description: Git 커밋, 푸시, 배포 표준 절차
---

# 🚀 배포 워크플로우

## 브랜치 전략
- **main**: 프로덕션 안정 버전 (직접 커밋 금지)
- **develop**: 개발 통합 브랜치 (기본 작업 브랜치)
- **feature/***: 기능 개발 브랜치 (선택적)

## Step 1: 커밋 전 보안 점검 (⚠️ 필수)
// turbo
1. `.env`, `.env.*` 파일이 `.gitignore`에 포함되어 있는지 확인
2. `git diff --staged`로 API 키, 비밀번호, 시크릿이 포함되지 않았는지 확인
3. 키워드 검사: `API_KEY`, `SECRET`, `PASSWORD`, `TOKEN` 등

## Step 2: 커밋 메시지 작성
// turbo
Conventional Commits 규격 준수:
```
type(scope): 한글 설명

type: feat, fix, refactor, docs, style, test, chore
scope: 선택적 (frontend, backend, infra 등)
설명: 반드시 한글, 명확하고 구체적으로
```

예시:
- `feat(frontend): 리본 툴바 AI 분석 버튼 추가`
- `fix(backend): JWT 토큰 만료 시 갱신 로직 수정`
- `docs: 마스터 핸드북 조직도 업데이트`

## Step 3: Git 실행
// turbo
```powershell
git add -A
git status            # 스테이징 내용 확인
git commit -m "type(scope): 설명"
git push origin develop
```

## Step 4: 배포 후 확인
1. 원격 저장소 push 성공 확인
2. 빌드/CI 에러 여부 확인 (GitHub Actions 등)
3. 사장님께 결과 보고
