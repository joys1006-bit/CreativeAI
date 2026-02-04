# CreativeAI - AI 기반 디자인 창작 플랫폼

AI 기술을 활용한 이모티콘, 아바타, 사진 편집 등 다양한 디자인 창작 기능을 제공하는 웹 애플리케이션입니다.

## 🚀 프로젝트 구조

```
CreativeAI/
├── creativeai-app/          # 프론트엔드 (React + Vite)
└── creativeai-backend/      # 백엔드 (Spring WebFlux + Hexagonal Architecture)
```

## 📋 주요 기능

### 프론트엔드
- ✅ 이모티콘 메이커 (6가지 스타일)
- ✅ 실시간 뷰티 필터 (카메라 기능)
- ✅ AI 아바타 생성
- ✅ 사진 편집기
- ✅ 생성 히스토리 관리
- ✅ Zustand 상태 관리
- ✅ 로컬 스토리지 영속성

### 백엔드
- ✅ 헥사고날 아키텍처 (Ports & Adapters)
- ✅ Spring WebFlux (비동기/논블로킹)
- ✅ DDD (Domain-Driven Design)
- ✅ 리액티브 프로그래밍 (Mono/Flux)
- ✅ CORS 설정

## 🛠️ 기술 스택

### 프론트엔드
- **React 18.3** - UI 라이브러리
- **Vite 6.0** - 빌드 도구
- **React Router 7.1** - 라우팅
- **Zustand 5.0** - 상태 관리
- **CSS3** - 스타일링 (Glassmorphism)

### 백엔드
- **Kotlin** - 프로그래밍 언어
- **Spring Boot 3.2** - 프레임워크
- **Spring WebFlux** - 리액티브 웹
- **Gradle** - 빌드 도구
- **JDK 17** - Java 버전

## 🏗️ 아키텍처

### 헥사고날 아키텍처 (Hexagonal Architecture)

```
domain/              # 도메인 레이어 (비즈니스 로직)
├── emoji/
│   ├── Emoji.kt            # Aggregate Root
│   ├── EmojiStyle.kt       # Value Object
│   └── EmojiRepository.kt  # Port

application/         # 애플리케이션 레이어
├── port/
│   ├── input/              # Use Cases (인바운드 포트)
│   └── output/             # External Services (아웃바운드 포트)
└── service/                # Use Case 구현

adapter/             # 어댑터 레이어
├── input/web/              # REST Controllers
└── output/
    ├── persistence/        # Repository 구현
    └── ai/                 # AI Service 구현
```

## 🚀 실행 방법

### 프론트엔드

```powershell
cd creativeai-app
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

### 백엔드

```powershell
cd creativeai-backend
$env:PATH = "C:\Java\jdk-17.0.2\bin;$env:PATH"
.\gradlew.bat bootRun
```

서버는 `http://localhost:8080`에서 실행

## 📡 API 엔드포인트

```
GET  /api/health                    # Health Check
GET  /api/emoji/styles              # 이모티콘 스타일 목록
POST /api/emoji/generate            # 이모티콘 생성
GET  /api/emoji/generation/{id}     # 생성 상태 조회
GET  /api/creations/popular         # 인기 크리에이션
GET  /api/marketplace/items         # 마켓플레이스 아이템
```

## 📊 프로젝트 통계

- **프론트엔드**: ~2,500 라인
- **백엔드**: ~800 라인
- **페이지**: 8개
- **API 엔드포인트**: 6개

## 🎯 향후 계획

- [ ] 실제 AI 모델 통합 (Stable Diffusion)
- [ ] 데이터베이스 연결 (MongoDB/PostgreSQL)
- [ ] 사용자 인증 시스템
- [ ] PWA 지원
- [ ] 배포 (Docker + CI/CD)

## 📝 라이선스

MIT License

## 👨‍💻 개발자

joys1006-bit
