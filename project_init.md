# 🏗️ LearningMate 프로젝트 구축 가이드 (A to Z)

이 문서는 빈 폴더에서 시작하여 현재의 **LearningMate** 프로젝트를 완성하기까지의 기술 설계와 여정을 기록합니다.

---

## 1. 아키텍처 개요

- **Frontend**: Vite + React기반 SPA. 사용자 경험을 극대화하기 위해 클라이언트 사이드에서 모든 로직(파싱, 저장, 학습)을 처리.
- **Storage**: IndexedDB (localforage 사용). 대용량 데이터를 브라우저에 안전하고 비동기적으로 저장.
- **State Management**: Zustand. 가볍고 직관적인 파일/진행 상황/설정 상태 관리.
- **Workflow**: 
  1. 사용자 파일 업로드 (Excel, CSV, TXT)
  2. 클라이언트 사이드 파싱 (xlsx.js, papaparse)
  3. IndexedDB 반영 및 UI 업데이트

---

## 2. 프로젝트 초기화 (Step by Step)

### Step 1: Frontend 구축 (Vite)
```bash
npm create vite@latest frontend -- --template react
cd frontend && npm install react-router-dom zustand localforage xlsx papaparse framer-motion react-hot-toast
```

### Step 2: 저장소 계층 설계 (IndexedDB)
- `files`: 제목, 생성일 등 메타데이터
- `problems`: 실제 문제 내용 및 선택지
- `progress`: 완료 여부, 오답 횟수 등 학습 데이터
- `settings`: 사용자 환경 설정

---

## 3. 디렉토리 구조 (Definitive)

```
learningMate/
├── frontend/
│   ├── src/
│   │   ├── components/      # FileUpload, Card, Quiz 등 기능별 컴포넌트
│   │   ├── pages/           # Home, Study, Editor, Settings, Trash 등 각 화면
│   │   ├── stores/          # Zustand 스토어 (useFileStore, useProgressStore 등)
│   │   ├── utils/           # storage.js(DB 래퍼), fileParser.js(파싱 엔진)
│   │   └── App.jsx          # 라우팅 및 전역 상태 레이아웃
├── README.md                # 메인 설명서
├── GUIDE_KR.md / GUIDE_EN.md # 사용자 매뉴얼 (한/영)
└── project_init.md          # 본 기술 설계서
```

---

## 4. 핵심 기술: 스마트 오답 노트 (Aggregation Logic)

LearningMate의 핵심 기술적 도전은 **여러 파일에 분산된 오답 데이터를 효율적으로 통합**하는 것이었습니다.
- **Logic**: `progressDB`를 전체 스캔하여 `isCorrect === false`인 항목의 `problemId`를 추출한 후, `problemsDB`에서 해당 데이터만 필터링하여 가상의 '오답 세션'을 생성합니다.
- **Performance**: 대용량 데이터에서도 실시간성을 유지하기 위해 비동기 이터레이터(localforage iterate)를 사용합니다.

---

## 5. 미래 확장 계획 (Phase 2 & 3)

1. **Phase 2 (Cloud)**: Supabase 또는 PostgreSQL을 연동하여 멀티 디바이스 동기화 지원.
2. **Phase 3 (Mobile)**: Capacitor를 통한 하이브리드 앱 출시 (안드로이드/iOS).

---
최종 업데이트: 2026-02-06 (LearningMate Phase 1 MVP 완성 버전)
