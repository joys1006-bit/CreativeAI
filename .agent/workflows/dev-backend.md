---
description: 백엔드(Kotlin/Spring) 개발 및 수정 표준 절차
---

# ⚙️ 백엔드 개발 워크플로우

## 담당 에이전트
- **실행**: 시니어 백엔드(L4), 백엔드 로직(L3)
- **설계**: 백엔드 아키텍트(L6)
- **보안 검수**: CISO(L7)
- **최종 승인**: CTO(L7)

## Step 1: API 설계
// turbo
1. 백엔드 아키텍트 관점에서 엔드포인트 설계
2. 프론트엔드 아키텍트에게 컨슈머 사이드 검토 요청 (collaboration 스킬)
3. DTO 명명: 요청 `*Request`, 응답 `*Response`

## Step 2: TDD 작성
// turbo
1. 기능 구현 **전** 테스트 코드 작성
2. 단위 테스트: Service 레이어 중심
3. 통합 테스트: API 엔드포인트 검증

## Step 3: 구현
// turbo
1. code-convention 스킬의 백엔드 컨벤션 준수
2. 패키지: `com.creativeai.*` 구조
3. Layer 주석: Controller/Service/Repository 명시
4. Null Safety: `?` 연산자, Mono/Flux 빈 처리
5. SLF4J 로깅: 진입 DEBUG, 에러 ERROR

## Step 4: 보안 점검
// turbo
1. security-protocol 스킬 체크리스트 적용
2. 환경변수 참조로 시크릿 관리
3. 인증/인가 체크 누락 여부 확인
4. 입력 검증(Validation) 적용

## Step 5: 서버 실행 검증
1. 서버 시작 및 에러 로그 확인
2. API 엔드포인트 요청/응답 테스트
3. DB 연동 정상 작동 확인

## Step 6: 검수 및 배포
1. quality-gate 체크리스트 통과
2. `/deploy` 워크플로우 실행
