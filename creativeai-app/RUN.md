# CreativeAI - 실행 가이드

프론트엔드와 백엔드를 실행하는 간단한 가이드입니다.

## 🚀 백엔드 실행

### 1. MySQL 데이터베이스 시작 (Docker)

```powershell
# Docker Desktop이 설치되어 있어야 합니다
docker-compose up -d

# 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs mysql
```

### 2. 백엔드 서버 시작

```powershell
cd backend
npm start
```

**서버가 정상 실행되면:**
```
🚀 CreativeAI API Server running on port 8080
📊 Environment: development
✅ MySQL 데이터베이스 연결 성공!
```

**API 테스트:**
```powershell
# Health check
curl http://localhost:8080/api/health

# 스타일 조회
curl http://localhost:8080/api/styles
```

---

## 🎨 프론트엔드 실행

```powershell
# 프로젝트 루트에서
npm run dev
```

**접속:** http://localhost:5173

---

## 📋 전체 실행 순서 (처음부터)

```powershell
# 1. Docker로 MySQL 시작
docker-compose up -d

# 2. 백엔드 패키지 설치 (처음만)
cd backend
npm install

# 3. 백엔드 서버 실행
npm start

# 4. 새 터미널에서 프론트엔드 실행
cd ..
npm run dev
```

---

## 🔧 문제 해결

### Docker가 실행되지 않을 때
- Docker Desktop을 먼저 설치하세요: https://www.docker.com/products/docker-desktop/

### 포트 충돌
- MySQL: 3306 포트가 사용 중이면 `docker-compose.yml`에서 변경
- 백엔드: 8080 포트가 사용 중이면 `.env`에서 `PORT` 변경
- 프론트엔드: 5173 포트가 사용 중이면 `vite.config.js`에서 변경

### 데이터베이스 연결 실패
```powershell
# MySQL 컨테이너 재시작
docker-compose restart mysql

# 또는 완전히 재생성
docker-compose down -v
docker-compose up -d
```

---

## 📚 API 엔드포인트

### 스타일
- `GET /api/styles` - 전체 스타일
- `GET /api/emoji/styles` - 이모지 스타일
- `GET /api/avatar/styles` - 아바타 스타일

### 이모지
- `POST /api/emoji/generate` - 생성 시작
- `GET /api/emoji/generation/:id` - 상태 조회

### 아바타
- `POST /api/avatar/generate` - 생성 시작
- `GET /api/avatar/generation/:id` - 상태 조회

### 사용자
- `GET /api/users/:id` - 정보 조회
- `GET /api/users/:id/creations` - 창작물 목록

### 크레딧
- `GET /api/credits/balance/:userId` - 잔액
- `GET /api/credits/transactions/:userId` - 거래 내역
