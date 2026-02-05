# Docker로 MySQL 데이터베이스 실행 가이드

CreativeAI 프로젝트의 MySQL 데이터베이스를 Docker로 실행하는 가이드입니다.

---

## 📋 사전 요구사항

### Docker Desktop 설치

**Windows:**
1. [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) 다운로드
2. 설치 프로그램 실행
3. 재부팅 후 Docker Desktop 실행
4. WSL 2 설정 완료 (자동)

**확인:**
```powershell
docker --version
docker-compose --version
```

---

## 🚀 빠른 시작

### 1단계: Docker 컨테이너 실행

프로젝트 루트에서 실행:

```powershell
# Docker Compose로 MySQL 시작
docker-compose up -d

# 상태 확인
docker-compose ps
```

**출력 예시:**
```
NAME                  IMAGE           STATUS
creativeai-mysql      mysql:8.0       Up (healthy)
creativeai-phpmyadmin phpmyadmin      Up
```

### 2단계: 데이터베이스 자동 생성 확인

Docker가 자동으로 다음을 실행합니다:
1. `database/schema.sql` - 테이블 생성
2. `database/indexes.sql` - 인덱스 추가
3. `database/seeds.sql` - 초기 데이터 삽입

**확인 방법:**

```powershell
# MySQL 컨테이너 접속
docker exec -it creativeai-mysql mysql -u root -pcreativeai_root_2024

# MySQL 명령어
USE creativeai_db;
SHOW TABLES;
SELECT COUNT(*) FROM styles;
exit
```

### 3단계: 환경 변수 설정

`.env` 파일 수정:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=creativeai_db
DB_USER=creativeai_user
DB_PASSWORD=creativeai_pass_2024
```

**또는 root 사용:**
```env
DB_USER=root
DB_PASSWORD=creativeai_root_2024
```

### 4단계: 백엔드 테스트

```powershell
cd backend
npm install
npm run test:db
```

---

## 🔧 Docker 명령어 모음

### 컨테이너 관리

```powershell
# 시작
docker-compose up -d

# 중지
docker-compose stop

# 재시작
docker-compose restart

# 완전 삭제 (데이터 유지)
docker-compose down

# 데이터까지 삭제
docker-compose down -v

# 로그 확인
docker-compose logs mysql
docker-compose logs -f mysql  # 실시간
```

### MySQL 접속

```powershell
# MySQL CLI 접속
docker exec -it creativeai-mysql mysql -u root -pcreativeai_root_2024

# 특정 데이터베이스로 바로 접속
docker exec -it creativeai-mysql mysql -u root -pcreativeai_root_2024 creativeai_db

# SQL 파일 실행
docker exec -i creativeai-mysql mysql -u root -pcreativeai_root_2024 creativeai_db < database/custom.sql
```

### 데이터 백업/복원

```powershell
# 백업
docker exec creativeai-mysql mysqldump -u root -pcreativeai_root_2024 creativeai_db > backup.sql

# 복원
docker exec -i creativeai-mysql mysql -u root -pcreativeai_root_2024 creativeai_db < backup.sql
```

---

## 🌐 phpMyAdmin 웹 접속

MySQL을 웹 브라우저로 관리할 수 있습니다:

**URL:** http://localhost:8081

**로그인:**
- 서버: `mysql`
- 사용자: `root`
- 비밀번호: `creativeai_root_2024`

**기능:**
- 테이블 조회/수정
- SQL 쿼리 실행
- 데이터 내보내기/가져오기
- 시각적 데이터베이스 관리

---

## 📊 Docker Compose 구성

### MySQL 서비스

- **이미지**: `mysql:8.0`
- **포트**: `3306` → `localhost:3306`
- **데이터베이스**: `creativeai_db`
- **사용자**: `creativeai_user` / `root`
- **영구 저장**: `mysql_data` 볼륨

### phpMyAdmin 서비스

- **이미지**: `phpmyadmin:latest`
- **포트**: `80` → `localhost:8081`
- **연결**: MySQL 서비스에 자동 연결

### 초기화 스크립트

컨테이너가 처음 시작될 때 자동 실행:
1. `01-schema.sql` - 테이블 생성
2. `02-indexes.sql` - 인덱스 추가
3. `03-seeds.sql` - 시드 데이터

---

## 🔍 문제 해결

### Docker Desktop이 시작되지 않을 때

```powershell
# WSL 업데이트
wsl --update

# Docker Desktop 재시작
# 작업 표시줄에서 Docker 아이콘 우클릭 → Restart
```

### 포트 3306이 이미 사용 중

**다른 프로그램이 3306 포트를 사용 중:**

```powershell
# 포트 사용 확인
netstat -ano | findstr :3306

# docker-compose.yml 수정
ports:
  - "3307:3306"  # 외부 포트 변경

# .env 수정
DB_PORT=3307
```

### 컨테이너가 계속 재시작될 때

```powershell
# 로그 확인
docker-compose logs mysql

# 컨테이너 상태 확인
docker-compose ps

# 완전히 재생성
docker-compose down -v
docker-compose up -d
```

### 데이터베이스 초기화 스크립트가 실행되지 않을 때

**이미 볼륨이 존재하면 초기화 스크립트를 건너뜁니다.**

```powershell
# 볼륨 삭제 후 재시작 (데이터 손실 주의!)
docker-compose down -v
docker-compose up -d

# 수동으로 스크립트 실행
docker exec -i creativeai-mysql mysql -u root -pcreativeai_root_2024 < database/schema.sql
docker exec -i creativeai-mysql mysql -u root -pcreativeai_root_2024 < database/indexes.sql
docker exec -i creativeai-mysql mysql -u root -pcreativeai_root_2024 < database/seeds.sql
```

---

## 🔒 보안 권장사항

### 프로덕션 환경

**docker-compose.prod.yml 생성:**

```yaml
version: '3.8'
services:
  mysql:
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    # phpMyAdmin 제거 (프로덕션에서는 사용 안 함)
```

**환경 변수 파일 (.env.docker):**
```env
MYSQL_ROOT_PASSWORD=강력한_비밀번호_설정
MYSQL_DATABASE=creativeai_db
MYSQL_USER=creativeai_user
MYSQL_PASSWORD=강력한_비밀번호_설정
```

---

## 📚 추가 자료

- [Docker Documentation](https://docs.docker.com/)
- [MySQL Docker Hub](https://hub.docker.com/_/mysql)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

## ✅ 체크리스트

데이터베이스 설정이 완료되었나요?

- [ ] Docker Desktop 설치 및 실행
- [ ] `docker-compose up -d` 실행
- [ ] MySQL 컨테이너 정상 동작 (`docker-compose ps`)
- [ ] 테이블 생성 확인 (`SHOW TABLES;`)
- [ ] 시드 데이터 확인 (`SELECT COUNT(*) FROM styles;`)
- [ ] `.env` 파일 설정
- [ ] `npm run test:db` 테스트 통과

**모두 완료되면 CreativeAI 데이터베이스가 준비되었습니다!** 🎉
