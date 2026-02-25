---
description: 작업 접수 시 담당자 배정 및 실행 절차
---

# 📋 업무 디스패치 워크플로우

모든 사장님(USER) 요청은 이 절차를 따릅니다.

## Step 1: 요청 분류
요청을 아래 카테고리로 분류합니다:
- **🖥️ FE**: UI/UX, CSS, React 컴포넌트, 프론트엔드 버그
- **⚙️ BE**: API, DB, 서버 로직, Kotlin/Spring
- **🎨 Design**: 디자인 시스템, 브랜드, 프로토타입
- **🏗️ Infra**: CI/CD, 배포, Docker, 서버 설정
- **🛡️ Security**: API 키, 인증, 보안 취약점
- **📊 Biz**: 사업 전략, 재무 분석, 시장 조사
- **🔀 Cross**: 여러 분야에 걸친 복합 요청

## Step 2: 담당자 결정
// turbo

| 카테고리 | 1차 담당 (실행) | 2차 담당 (검수) | 최종 승인 |
|---------|---------------|---------------|---------|
| FE | 프론트엔드 개발자(L4) | 프론트엔드 아키텍트(L6) | CPO/CDO |
| BE | 백엔드 개발자(L4) | 백엔드 아키텍트(L6) | CTO |
| Design | UI 디자이너(L3) | UX 기획자(L3) | CDO |
| Infra | 데브옵스(L5) | 백엔드 아키텍트(L6) | CTO |
| Security | CISO(L7) 직접 또는 위임 | CTO | CISO |
| Biz | 사업 전략가(L2) | 재무 분석가(L2) | CSO/CFO |
| Cross | VP가 태스크포스 구성 | 관련 C-Suite 합동 | VP |

## Step 3: 실행
1. 담당자 페르소나의 관점으로 작업 수행
2. 해당 분야의 code-convention 스킬 준수
3. 작업 중 다른 분야 영향 시 collaboration 스킬 적용

## Step 4: 검수
1. quality-gate 스킬의 체크리스트 통과
2. code-review 스킬 기준으로 검수 수행
3. 보안 변경 시 security-protocol 스킬 추가 점검

## Step 5: 보고
1. 실무진 → 리더(L4-L6) → C-Suite(L7) → 사장님(USER)
2. 보고 시 변경 파일, 검수 결과, 잔여 리스크를 명시
