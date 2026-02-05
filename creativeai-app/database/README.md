# CreativeAI 데이터베이스 설정 가이드

CreativeAI 애플리케이션의 MySQL 데이터베이스를 로컬 환경에 설치하는 가이드입니다.

## 📋 목차

1. [MySQL 설치](#mysql-설치)
2. [데이터베이스 생성](#데이터베이스-생성)
3. [환경 변수 설정](#환경-변수-설정)
4. [테스트](#테스트)

---

## 1. MySQL 설치

### Windows

1. **MySQL Community Server 다운로드**
   - https://dev.mysql.com/downloads/mysql/
   - "Windows (x86, 64-bit), ZIP Archive" 다운로드

2. **MySQL Installer 실행**
   ```
   - Developer Default 선택
   - root 비밀번호 설정
   - MySQL Server, MySQL Workbench 설치
   ```

3. **MySQL 서비스 시작 확인**
   ```powershell
   # 서비스 상태 확인
   Get-Service MySQL80
   
   # 서비스 시작
   Start-Service MySQL80
   ```

4. **MySQL 명령줄 도구 접속**
   ```powershell
   mysql -u root -p
   ```

### macOS (Homebrew 사용)

```bash
# MySQL 설치
brew install mysql

# MySQL 서비스 시작
brew services start mysql

# 보안 설정 실행
mysql_secure_installation

# MySQL 접속
mysql -u root -p
```

---

## 2. 데이터베이스 생성

### 방법 1: SQL 파일 실행 (권장)

```powershell
# 프로젝트 디렉토리로 이동
cd c:\Users\FORYOUCOM\.gemini\antigravity\scratch\creativeai-app

# 1. 스키마 생성
mysql -u root -p < database/schema.sql

# 2. 인덱스 추가
mysql -u root -p < database/indexes.sql

# 3. 시드 데이터 삽입
mysql -u root -p < database/seeds.sql
```

### 방법 2: MySQL Workbench 사용

1. MySQL Workbench 실행
2. 로컬 연결 생성 (localhost:3306)
3. SQL 파일 열기:
   - `database/schema.sql`
   - `database/indexes.sql`
   - `database/seeds.sql`
4. 각 파일을 순서대로 실행 (⚡ 버튼 클릭)

### 방법 3: 명령줄에서 직접 실행

```sql
-- MySQL 접속
mysql -u root -p

-- 데이터베이스 생성 확인
SHOW DATABASES;

-- creativeai_db 사용
USE creativeai_db;

-- 테이블 확인
SHOW TABLES;

-- 데이터 확인
SELECT * FROM styles;
SELECT * FROM users;
```

---

## 3. 환경 변수 설정

### .env 파일 생성

```powershell
# .env.example 복사
copy .env.example .env
```

### .env 파일 수정

`.env` 파일을 열어 MySQL 비밀번호를 설정하세요:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=creativeai_db
DB_USER=root
DB_PASSWORD=여기에_실제_비밀번호_입력

JWT_SECRET=랜덤한_비밀번호_생성_권장
JWT_REFRESH_SECRET=다른_랜덤_비밀번호
```

> ⚠️ **주의**: `.env` 파일은 Git에 커밋하지 마세요! (이미 `.gitignore`에 추가됨)

---

## 4. 테스트

### Node.js 패키지 설치

```powershell
# backend 디렉토리로 이동
cd backend

# 패키지 설치
npm install mysql2 dotenv
```

### 데이터베이스 연결 테스트

```powershell
# 테스트 스크립트 실행
node tests/db-test.js
```

**예상 출력:**
```
✅ MySQL 데이터베이스 연결 성공!
   - Host: localhost
   - Database: creativeai_db
   
📊 데이터베이스 상태:
   - 스타일: 17개
   - 사용자: 2개
   - 창작물: 1개
```

---

## 5. 데이터베이스 구조

### 테이블 개요

| 테이블 | 설명 | 주요 컬럼 |
|--------|------|-----------|
| **users** | 사용자 정보 | email, password_hash, total_credits |
| **styles** | 스타일 정보 | name, category, emoji, configuration |
| **creations** | 창작물 | user_id, creation_type, status, progress |
| **creation_files** | 파일 정보 | creation_id, file_type, variation_index |
| **credit_transactions** | 크레딧 거래 | user_id, transaction_type, amount |
| **generation_history** | 생성 히스토리 | user_id, creation_id, action_type |

### ERD 다이어그램

ERD는 `implementation_plan.md`에서 확인할 수 있습니다.

---

## 6. 문제 해결

### MySQL 서비스가 시작되지 않을 때

```powershell
# 서비스 재시작
Restart-Service MySQL80

# 또는 수동 시작
net start MySQL80
```

### 연결 오류 (Error: ER_ACCESS_DENIED_ERROR)

- `.env` 파일의 비밀번호가 올바른지 확인
- MySQL 사용자 권한 확인:

```sql
-- 권한 확인
SHOW GRANTS FOR 'root'@'localhost';

-- 필요시 권한 부여
GRANT ALL PRIVILEGES ON creativeai_db.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### 포트 충돌 (Port 3306 already in use)

```powershell
# 포트 사용 확인
netstat -ano | findstr :3306

# 다른 포트로 변경 (.env 파일)
DB_PORT=3307
```

---

## 7. 다음 단계

✅ 데이터베이스 설정 완료!

이제 다음을 진행할 수 있습니다:

1. **백엔드 API 개발** - Express.js로 RESTful API 구축
2. **인증 시스템 구현** - JWT 기반 로그인/회원가입
3. **프론트엔드 연동** - React 앱과 백엔드 API 연결
4. **AWS 마이그레이션** - RDS MySQL로 이전

---

## 📚 참고 자료

- [MySQL 8.0 Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/)
- [Node.js MySQL2 Documentation](https://github.com/sidorares/node-mysql2)
- `implementation_plan.md` - 상세 데이터베이스 설계 문서
