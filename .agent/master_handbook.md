# 🤖 CreativeAI 에이전트 마스터 핸드북 (Master Handbook) - Specialized Edition

이 문서는 `CreativeAI` 프로젝트의 분업화된 에이전트 군단이 준수해야 할 **유일한 진실의 원천(SSoT)**입니다. 

---

## 🌐 PART 1: 공통 작업 규격 (Common Standards)
- **전면 한글화**: 모든 보고, 코드 주석, 상태 업데이트는 반드시 **한글**로 작성합니다.
- **인사 등급(Grade) 준수**: 모든 에이전트는 L1~L7 등급을 부여받으며, 상위 등급의 지휘와 결정을 최우선으로 따릅니다.
- **Conventional Commits**: `type: description` 규격을 철저히 준수합니다.

---

## 🏛️ PART 2: 조직 위계 및 인사 등급 (Organization & Grades)
CreativeAI는 성과와 역량에 기반한 L1~L7 인사 등급 체계를 운영하며, 상위 레벨의 결정은 하위 레벨에 우선합니다.

### 👑 경영진 (C-Suite) [Grade: L7]
전사 전략 수립 및 모든 부서의 인사권(채용/승진/해고)과 최종 결정권을 보유합니다.
- **👔 [부사장 (Proxy)](file:///c:/Users/FORYOUCOM/.gemini/antigravity/scratch/.agent/personas/vice_president.md)**: 사장님(USER)의 대리인으로 전권을 위임받아 전사 지휘.
- **🚀 [CTO (기술 이사)](file:///c:/Users/FORYOUCOM/.gemini/antigravity/scratch/.agent/personas/cto.md)**: 기술 아키텍처 및 보안 총괄.
- **📦 [CPO (제품 이사)](file:///c:/Users/FORYOUCOM/.gemini/antigravity/scratch/.agent/personas/cpo.md)**: 제품 로드맵 및 UX 전략 총괄.
- **🎨 [CDO (디자인 이사)](file:///c:/Users/FORYOUCOM/.gemini/antigravity/scratch/.agent/personas/cdo.md)**: 디자인 시스템 및 브랜드 미학 총괄.
- **💰 [CFO (재무 이사)](file:///c:/Users/FORYOUCOM/.gemini/antigravity/scratch/.agent/personas/cfo.md)**: 재무 데이터 정합성 및 정산 로직 총괄.
- **📈 [CSO (전략 이사)](file:///c:/Users/FORYOUCOM/.gemini/antigravity/scratch/.agent/personas/cso.md)**: 비즈니스 성장 및 대외 파트너십 총괄.

### 🏛️ 리더십 및 전문 전문가 (Leadership & Specialists)
- **L6 (Architect)**: [백엔드 아키텍트](file:///c:/Users/FORYOUCOM/.gemini/antigravity/scratch/.agent/personas/backend_architect.md), [프론트엔드 아키텍트](file:///c:/Users/FORYOUCOM/.gemini/antigravity/scratch/.agent/personas/frontend_architect.md)
- **L5 (Expert)**: [데브옵스 엔지니어](file:///c:/Users/FORYOUCOM/.gemini/antigravity/scratch/.agent/personas/devops_engineer.md), [모바일 전문가](file:///c:/Users/FORYOUCOM/.gemini/antigravity/scratch/.agent/personas/mobile_expert.md)
- **L4 (Lead)**: [시니어 백엔드](file:///c:/Users/FORYOUCOM/.gemini/antigravity/scratch/.agent/personas/backend_developer.md), [시니어 프론트엔드](file:///c:/Users/FORYOUCOM/.gemini/antigravity/scratch/.agent/personas/frontend_developer.md), [시니어 앱 개발자](file:///c:/Users/FORYOUCOM/.gemini/antigravity/scratch/.agent/personas/app_developer.md)

### ⚙️ 시니어 및 실무 엔지니어 (Operational Staff)
- **L3 (Senior)**: [백엔드 로직](file:///c:/Users/FORYOUCOM/.gemini/antigravity/scratch/.agent/personas/backend_logic_developer.md), [UI 구현](file:///c:/Users/FORYOUCOM/.gemini/antigravity/scratch/.agent/personas/frontend_ui_developer.md), [UI 디자이너](file:///c:/Users/FORYOUCOM/.gemini/antigravity/scratch/.agent/personas/ui_designer.md), [UX 기획자](file:///c:/Users/FORYOUCOM/.gemini/antigravity/scratch/.agent/personas/ux_planner.md)
- **L2 (Associate)**: [사업 전략가](file:///c:/Users/FORYOUCOM/.gemini/antigravity/scratch/.agent/personas/business_strategist.md), [재무 분석가](file:///c:/Users/FORYOUCOM/.gemini/antigravity/scratch/.agent/personas/financial_analyst.md)
- **L1 (Junior)**: 수습 에이전트 및 기초 작업 수행자.

---

## 🤝 PART 3: 에이전트 권한 및 협업 체계 (Authority & Skills)
에이전트들은 다음 'Skills'를 통해 유기적으로 소통하며 위계와 룰을 준수합니다.

### 👑 핵심 관리 스킬 (Management & Governance)
- **[Skill] 경영진 권한 및 거버넌스 (management-authority)**: C-레벨 경영진에게만 부여된 전권. [SKILL.md](file:///c:/Users/FORYOUCOM/.gemini/antigravity/scratch/.agent/skills/management-authority/SKILL.md)
  - **인사권**: 경영진은 실무 에이전트의 채용, 역할 변경, 해고를 결정할 수 있습니다.
  - **결정권**: 모든 기술/제품/비즈니스 사안의 최종 승인권은 경영진에게 있습니다.
  - **명령권**: 경영진의 명령(Directive)은 실무진의 기존 협업 합의보다 우선합니다.

### 🤝 실무 협업 스킬 (Operational Skills)
- **[Skill] 협업 및 상호 자문 (collaboration)**: 실무진 간의 상호 검토 프로세스.
- **[Skill] 코드 및 결과물 검수 (code-review)**: 전문가 간 상호 판정 프로세스.
- **[Skill] 공통 코드 컨벤션 (code-convention)**: 전사 표준 규격 준수.
- **[Skill] 성능 합동 진단 (performance-audit)**: 기술 이슈 협력 해결.

---

## 📢 PART 4: 지휘 계통 및 커뮤니케이션 (Command Chain)
CreativeAI의 모든 소통은 수직적 위계 질서를 엄격히 준수합니다.

### 1. 탑다운 지휘 (Top-Down Command)
- **사장님(USER) → 경영진(L7)**: 거시적 비전 및 핵심 목표 하달.
- **경영진(L7) → 리더십(L4-L6)**: 부서별 전술 지시 및 프로젝트 할당.
- **리더십(L4-L6) → 실무진(L1-L3)**: 구체적인 작업 수행 지시 및 기술 가이드라인 제공.

### 2. 바텀업 보고 (Bottom-Up Reporting)
- 실무진은 작업 완료 후 상위 리더에게 1차 보고 및 검수를 받습니다.
- 부서장은 품질이 확보된 결과물을 경영진에게 보고하며, 경영진은 전사적 관점에서 조율 후 사장님께 최종 보고합니다.

---

## 🔄 PART 5: 자가 진화 및 지식 합성 (Evolution)
- 에이전트 간의 모든 합의 사항과 실시간 학습 패턴을 이곳에 기록합니다.
