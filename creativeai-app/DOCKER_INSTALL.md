# Docker Desktop 설치 가이드

## 자동 다운로드 (PowerShell)

Docker Desktop을 자동으로 다운로드하고 설치하는 스크립트입니다.

```powershell
# 1. Docker Desktop Installer 다운로드
$DownloadUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
$InstallerPath = "$env:TEMP\DockerDesktopInstaller.exe"

Write-Host "Docker Desktop 다운로드 중..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $DownloadUrl -OutFile $InstallerPath

# 2. 설치 실행
Write-Host "Docker Desktop 설치 중..." -ForegroundColor Cyan
Start-Process -FilePath $InstallerPath -ArgumentList "install", "--quiet" -Wait

Write-Host "Docker Desktop 설치 완료!" -ForegroundColor Green
Write-Host "컴퓨터를 재부팅해야 할 수 있습니다." -ForegroundColor Yellow
```

## 수동 설치 방법

### 1단계: 다운로드

**다운로드 링크:** https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe

또는 공식 페이지에서 다운로드:
https://www.docker.com/products/docker-desktop/

### 2단계: 설치 실행

1. 다운로드한 `Docker Desktop Installer.exe` 실행
2. "Use WSL 2 instead of Hyper-V" 옵션 체크 (권장)
3. "Install" 클릭
4. 설치 완료 후 컴퓨터 재부팅

### 3단계: Docker Desktop 실행

1. 재부팅 후 Docker Desktop 자동 실행
2. 작업 표시줄에 Docker 아이콘 확인
3. 로그인 (선택사항)

### 4단계: 설치 확인

PowerShell에서 확인:
```powershell
docker --version
docker-compose --version
```

예상 출력:
```
Docker version 24.0.x
Docker Compose version 2.x.x
```

---

## 설치 후 CreativeAI 실행

### 1. MySQL 컨테이너 시작

```powershell
cd c:\Users\FORYOUCOM\.gemini\antigravity\scratch\creativeai-app
docker-compose up -d
```

### 2. 컨테이너 상태 확인

```powershell
docker-compose ps
```

예상 출력:
```
NAME                  IMAGE           STATUS
creativeai-mysql      mysql:8.0       Up (healthy)
creativeai-phpmyadmin phpmyadmin      Up
```

### 3. 로그 확인

```powershell
docker-compose logs mysql
```

### 4. 백엔드 서버 재시작

현재 실행 중인 백엔드를 중지하고 재시작:
```powershell
# 백엔드 터미널에서 Ctrl+C로 중지 후
cd backend
npm start
```

예상 출력:
```
🚀 CreativeAI API Server running on port 8080
📊 Environment: development
✅ MySQL 데이터베이스 연결 성공!
```

---

## 문제 해결

### "WSL 2 installation is incomplete" 오류

```powershell
# WSL 2 업데이트
wsl --update

# WSL 기본 버전 설정
wsl --set-default-version 2
```

### "Docker Desktop requires Windows 10/11" 오류

- Windows 10 버전 2004 이상 필요
- Windows 업데이트 실행

### Docker Desktop이 시작되지 않음

1. Docker Desktop 재시작
2. 관리자 권한으로 실행
3. Hyper-V 또는 WSL 2 설정 확인

---

## 빠른 설치 명령어 (관리자 PowerShell)

```powershell
# 한 번에 다운로드 및 설치
irm https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe -OutFile DockerInstaller.exe; .\DockerInstaller.exe install --quiet
```

설치 완료 후 **재부팅**하세요!
