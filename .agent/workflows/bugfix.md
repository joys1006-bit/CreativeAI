---
description: 버그/이슈 수정 표준 절차
---

# 🐛 버그 수정 워크플로우

## Step 1: 이슈 분류
// turbo
이슈를 심각도별로 분류합니다:
- **🔴 Critical**: 서비스 중단, 데이터 손실, 보안 취약점 → 즉시 대응
- **🟡 Major**: 핵심 기능 불능, UI 심각 깨짐 → 당일 대응
- **🟢 Minor**: 경미한 UI 이슈, 개선 사항 → 일정 배정

## Step 2: 원인 분석
// turbo
1. **증상 확인**: 에러 로그, 스크린샷, 재현 절차 확인
2. **범위 파악**: 프론트엔드/백엔드/인프라 중 어디 문제인지 식별
3. **근본 원인**: 코드 추적 (grep, view_file, view_code_item)
4. 성능 이슈인 경우 → performance-audit 스킬의 3각 합동 진단 발동

## Step 3: 담당자 배정
// turbo
task-dispatch 워크플로우의 담당자 결정 표에 따라 배정:
- FE 이슈 → `/dev-frontend` 워크플로우
- BE 이슈 → `/dev-backend` 워크플로우
- 인프라 이슈 → 데브옵스 엔지니어(L5)

## Step 4: 수정 및 검증
// turbo
1. 최소 변경 원칙으로 수정
2. 수정 후 원래 증상이 사라졌는지 확인
3. 사이드 이펙트(부작용) 발생 여부 검증
4. quality-gate 체크리스트 통과

## Step 5: 회고 기록
Critical/Major 이슈의 경우:
- 근본 원인, 수정 내용, 재발 방지책을 master_handbook PART 5에 기록
