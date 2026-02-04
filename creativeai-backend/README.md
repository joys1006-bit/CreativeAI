# CreativeAI Backend

Kotlin + Spring Boot 기반 BFF(Backend For Frontend) 서버

## 🚀 실행 방법

### Gradle로 실행

```bash
cd creativeai-backend
./gradlew bootRun
```

Windows에서:
```powershell
cd creativeai-backend
.\gradlew.bat bootRun
```

서버는 `http://localhost:8080`에서 실행됩니다.

## 📡 API 엔드포인트

### Health Check
```
GET /api/health
```

### 이모티콘 스타일 목록
```
GET /api/emoji/styles
```

### 인기 크리에이션
```
GET /api/creations/popular
```

### 마켓플레이스 아이템
```
GET /api/marketplace/items
```

### 이모티콘 생성
```
POST /api/emoji/generate
Content-Type: application/json

{
  "imageData": "base64_encoded_image",
  "prompt": "optional_text_prompt",
  "styleId": "kakao",
  "generationType": "single"
}
```

### 생성 상태 조회
```
GET /api/emoji/generation/{id}
```

## 🛠️ 기술 스택

- **Kotlin 1.9.22**
- **Spring Boot 3.2.2**
- **Gradle**
- **Jackson (JSON 처리)**

## 📂 프로젝트 구조

```
creativeai-backend/
├── src/main/kotlin/com/creativeai/
│   ├── CreativeAiBackendApplication.kt
│   ├── config/
│   │   └── WebConfig.kt
│   ├── controller/
│   │   └── CreativeAiController.kt
│   ├── service/
│   │   └── CreativeAiService.kt
│   └── model/
│       └── Models.kt
├── src/main/resources/
│   └── application.properties
├── build.gradle.kts
└── settings.gradle.kts
```

## 🔧 개발 모드

CORS가 `http://localhost:3000` (React 앱)에 대해 활성화되어 있습니다.
