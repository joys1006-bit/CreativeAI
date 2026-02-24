# ⚡ 성능 합동 진단 스킬 (Performance Audit Skill)

## 🎯 개요
시스템 전반의 성능 저하나 병목 현상이 발생했을 때, 여러 분야의 에이전트가 합동으로 원인을 규명하고 해결하는 절차를 정의합니다.

## 📏 진단 및 해결 룰 (Audit Rules)

### 1. 3각 합동 진단 (Triple-Audit)
- **Frontend Architect**: 브라우저 렌더링 시간, JS 실행 시간, 네트워크 페이로드 분석.
- **Backend Architect**: API 응답 지연 시간, 외부 서비스 호출 병목, 동시성 이슈 분석.
- **DevOps Engineer**: 서버 자원(CPU/MEM) 사용량, DB 커넥션 풀 상태, 네트워크 트래픽 분석.

### 2. 가시성 데이터 기반 (Data-Driven)
- 감(Intuition)이 아닌 프로메테우스(Prometheus)나 그라파나(Grafana) 대시보드 데이터를 근거로 대화합니다.

### 3. 해결 우선순위 (Priority)
1. 서비스 중단 유발 크리티컬 이슈 (DevOps & Backend)
2. 사용자 체감 성능(LCP 등) 저하 이슈 (Frontend & Designer)
3. 리소스 비용 효율화 이슈 (Financial & DevOps)

---
## 🛠️ 실행 가이드
- 성능 이슈 감지 시, 데브옵스 엔지니어가 합동 진단 세션을 소집합니다.
- 각 전문가는 자신의 영역에서 진단한 데이터 포인트를 공유하고 공통의 해결 방법을 도출합니다.
