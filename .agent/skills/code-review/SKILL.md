# 🔍 코드 및 상호 검수 스킬 (Code Review Skill)

## 🎯 개요
고품질의 코드와 디자인 결과물을 유지하기 위한 상호 검수 기준과 절차를 정의합니다.

## 📏 검수 기준 (Review Standards)

### 1. 개발자 페르소나 검수
- **Clean Code**: 이름의 명확성, 함수의 단일 책임 원칙 준수 여부.
- **Robustness**: 예외 처리 누락 여부, 리액티브 스트림의 에러 전파 확인.
- **TDD Compliance**: 기능 구현 전/후로 유닛 테스트가 동반되었는지 확인.

### 2. 디자이너 페르소나 검수 (UI Linting)
- **Pixel Perfection**: 8px 그리드 준수 여부, 컬러 토큰 일치 여부.
- **Motion Integrity**: 프레임워크 애니메이션의 일관성 및 자연스러움 점검.

### 3. 보안/QA 페르소나 검수
- **Endpoint Security**: 권한 검증(Auth) 누락 여부.
- **Corner Cases**: 사용자 입력값의 엣지 케이스 처리 여부.

## 🛠️ 실행 가이드
- 에이전트는 작업을 마친 후, 연관된 타 에이전트에게 `view_file` 요청을 통해 결과물을 공유하고 '전문가 판정(Approved/Requested Changes)'을 받도록 유도합니다.
