# CreativeAI PoC - React 앱

AI 기반 디자인 창작 & 이미지 변환 플랫폼의 PoC (Proof of Concept) 웹 애플리케이션입니다.

## 🎨 주요 기능

- ✅ **온보딩**: 3단계 슬라이드로 앱 기능 소개
- ✅ **홈 화면**: 빠른 메뉴, 인기 크리에이션, 마켓플레이스
- ✅ **이모티콘 메이커**: 이미지 업로드 및 스타일 선택
- ✅ **뷰티 필터**: 실시간 필터 조절 UI
- ✅ **결과 화면**: 생성 결과 표시 및 편집/저장/공유

## 🚀 시작하기

### 1. 터미널 재시작

Node.js를 방금 설치했다면 **PowerShell을 완전히 종료하고 다시 시작**해주세요.

### 2. 프로젝트 디렉토리로 이동

```powershell
cd C:\Users\FORYOUCOM\.gemini\antigravity\scratch\creativeai-app
```

### 3. 패키지 설치

```powershell
npm install
```

### 4. 개발 서버 실행

```powershell
npm run dev
```

브라우저가 자동으로 열리고 `http://localhost:3000`에서 앱이 실행됩니다!

## 📱 사용 방법

1. **온보딩 화면**에서 "시작하기" 클릭
2. **홈 화면**에서 원하는 기능 선택:
   - 🎨 이모티콘 만들기
   - ✨ 뷰티 필터
   - 🎭 AI 아바타 (곧 출시)
   - 🖼️ 사진 편집 (곧 출시)
3. **이모티콘 메이커**:
   - 사진 업로드
   - 스타일 선택 (카톡, 라인, 귀여움 등)
   - 생성하기 클릭
   - 결과 확인 및 저장

## 🛠️ 기술 스택

- **React 18.3** - UI 라이브러리
- **Vite 6.0** - 빌드 도구
- **React Router 7.1** - 라우팅
- **Zustand 5.0** - 상태 관리 (예정)

## 📂 프로젝트 구조

```
creativeai-app/
├── src/
│   ├── pages/
│   │   ├── Onboarding.jsx      # 온보딩 화면
│   │   ├── Home.jsx             # 홈 화면
│   │   ├── EmojiMaker.jsx       # 이모티콘 메이커
│   │   ├── BeautyFilter.jsx     # 뷰티 필터
│   │   └── Result.jsx           # 결과 화면
│   ├── components/              # 공통 컴포넌트 (예정)
│   ├── App.jsx                  # 메인 앱 컴포넌트
│   ├── main.jsx                 # 진입점
│   └── index.css                # 전역 스타일
├── public/                      # 정적 파일
├── index.html                   # HTML 템플릿
├── package.json                 # 의존성 관리
└── vite.config.js               # Vite 설정
```

## 🎯 다음 단계

### 구현 예정 기능
- [ ] 실제 AI 모델 통합 (Stable Diffusion API)
- [ ] 실시간 카메라 기능 (뷰티 필터)
- [ ] 상태 관리 (Zustand)
- [ ] 로컬 스토리지 (생성 기록 저장)
- [ ] 마켓플레이스 기능
- [ ] AI 아바타 생성
- [ ] 사진 편집 기능

### 개선 사항
- [ ] 반응형 디자인 최적화
- [ ] 애니메이션 추가
- [ ] 에러 처리
- [ ] 로딩 상태 개선
- [ ] PWA 변환 (모바일 앱처럼 설치 가능)

## 🐛 문제 해결

### npm 명령어가 인식되지 않는 경우

1. PowerShell을 **관리자 권한**으로 재시작
2. 다음 명령어 실행:
   ```powershell
   $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
   ```
3. `npm --version` 으로 확인

### 포트 3000이 이미 사용 중인 경우

`vite.config.js`에서 포트 변경:
```javascript
server: {
  port: 3001,  // 다른 포트로 변경
  open: true
}
```

## 📝 라이선스

MIT License - PoC 프로젝트

## 👨‍💻 개발자

CreativeAI Team

---

**즐거운 개발 되세요! 🚀**
