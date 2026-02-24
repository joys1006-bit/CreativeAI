# 🚀 CreativeAI: Enterprise AI Design Platform

`CreativeAI`는 시니어 개발자 및 DBA의 고도화된 아키텍처 설계와 AI 기술을 결합한 지능형 디자인 창작 플랫폼입니다. 단순한 기능 구현을 넘어, **확장성(Scalability)**, **유지보수성(Maintainability)**, 그리고 **데이터 무결성(Data Integrity)**을 최우선으로 설계되었습니다.

---

## 🏗️ Core Architecture Decisions

### 1. Hexagonal Architecture (Ports & Adapters)
- **핵심 원칙**: 비즈니스 로직(Domain)을 외부 기술(Web, DB, AI API)로부터 완벽히 격리.
- **구조**:
    - `domain`: 엔터티와 비즈니스 핵심 정책을 포함 (기술 라이브러리 의존성 0%).
    - `application`: Use Case 구현 및 흐름 제어 (인바운드/아웃바운드 포트 정의).
    - `adapter`: REST API, R2DBC Persistence, AI 모델 연동 등 상세 기술 구현.

### 2. Reactive & Non-blocking Stream
- **Stack**: Kotlin + Spring WebFlux + Project Reactor.
- **성능**: AI 처리와 같은 Heavy한 작업을 비동기 백그라운드 스레드로 분리하여 시스템 응답성을 극대화했습니다.

### 3. Domain-Driven Design (DDD)
- 도메인 모델 간의 경계를 획득하고, Aggregate를 통해 트랜잭션의 일관성을 유지합니다.

---

## 🗄️ Database Excellence (Senior DBA View)

현재 `CreativeAI`는 데이터의 가치와 성능의 균형을 위해 다음과 같은 DBA 전략이 적용되어 있습니다.

- **JSON Native Type**: 비정형 메타데이터 처리를 위해 MySQL Native JSON 타입을 사용하여 쿼리 성능과 유연성을 동시에 확보했습니다.
- **Strategic Indexing**: `user_id`, `status`, `created_at` 등 주요 조회 경로에 복합 인덱스를 적용하여 대량 데이터 환경에 대비했습니다.
- **Audit Logging**: `updated_at` 자동 갱신 및 감사 데이터를 통해 데이터 변경 이력을 투명하게 관리합니다.

---

## 🛠️ Technical Implementation

### Backend
- **Kotlin 1.9**: 강력한 타입 추론과 널 안전성을 활용한 생산성 향상.
- **R2DBC**: 리액티브 환경에 최적화된 논블로킹 데이터베이스 접근 패러다임.
- **TDD (JUnit5 + MockK)**: 모든 Use Case에 대한 단위 테스트를 통해 코드 신뢰성 확보.

### Frontend
- **React 18**: 선언적 UI와 컴포넌트 기반 개발.
- **Zustand**: 중앙 집중식 상태 관리와 미들웨어를 이용한 상태 영속화.
- **Modern UI**: CSS3을 활용한 Glassmorphism 및 Framer Motion 기반 마이크로 인터렉션.

---

## 📡 Key API Endpoints (v1.0)

| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/emoji/styles` | 이모티콘 스타일 및 설정 정보 조회 | ✅ |
| `POST` | `/api/emoji/generate` | AI 이모티콘 생성 요청 (비동기) | ✅ |
| `GET` | `/api/emoji/generation/{id}` | 생성 프로세스 상태 및 결과 폴링 | ✅ |
| `GET` | `/api/avatar/styles` | 아바타 스타일 목록 정보 제공 | ✅ |
| `POST` | `/api/avatar/generate` | AI 아바타 생성 (백그라운드 처리) | ✅ |

---

## 🚀 Getting Started

### Backend Execution
```powershell
cd creativeai-backend
./gradlew bootRun
```
*Port: 9090 (Default)*

### Frontend Execution
```powershell
cd creativeai-app
npm install
npm run dev
```
*URL: http://localhost:3000*

---

## 👨‍💻 Contributors & Persona
- **Senior Developer**: joys1006-bit (Architecture & Core Logic)
- **Senior DBA Sub-agent**: Database Design & Performance Tuning

---
**CreativeAI** - *Intelligence meets Design.*
