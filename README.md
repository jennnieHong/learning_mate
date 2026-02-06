# 🎓 LearningMate

LearningMate는 사용자 가 가진 파일(Excel, CSV, TXT)을 자동으로 문제집으로 변환하여 학습을 도와주는 인터랙티브 학습 관리 시스템입니다.

---

## 🚀 주요 기능 (Key Features)

### 📊 스마트 파일 업로드
- **Excel (.xlsx)**, **CSV (.csv)**, **TXT (.txt)** 파일 지원
- 헤더 행을 감지하여 자동으로 설명(문제), 정답, 선택지를 파싱
- 샘플 파일을 통해 손쉬운 구조 파악 지원

### 🧠 맞춤형 학습 모드
- **설명 모드 (Flip Card)**: 카드 뒤집기 애니메이션을 통해 보드를 외우듯이 학습
- **문제 모드 (Multiple Choice)**: 객관식 퀴즈 형태로 실력을 점검
- **설정 최적화**: 문제 순서(순차/랜덤), 반복 모드, 카드 앞면 설정 등 제공

### ✍️ 고도화된 오답 관리
- **스마트 오답 노트**: 틀린 문제들만 따로 모아서 학습 가능
- **선택적 복습**: 원하는 파일들만 선택하여 통합 오답 노트를 생성
- **실시간 통계**: 문제별 오답 횟수 및 완료 상태를 실시간 확인 및 관리

### 💾 안전한 로컬 저장소
- **IndexedDB 사용**: 데이터가 브라우저 내부에 안전하게 저장되며, 수백 MB 이상의 대용량 문제집도 지원
- **오프라인 지원**: 인터넷 연결 없이도 언제 어디서든 학습 가능

---

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend**: React (v19), Vite, React Router, Zustand (상태 관리)
- **파일 파싱**: xlsx, papaparse
- **저장소**: IndexedDB (localforage)
- **애니메이션/알림**: framer-motion, react-hot-toast

---

## 📦 설치 및 실행 (Installation & Run)

현재 버전(Phase 1)은 백엔드 없이 프론트엔드 단독으로 실행 가능합니다.

### 1. 사전 준비 (Prerequisites)
- [Node.js](https://nodejs.org/) (v18 이상 권장)

### 2. 의존성 설치 (Install Dependencies)

```bash
cd frontend
npm install
```

### 3. 개발 서버 실행 (Run Development Server)

```bash
cd frontend
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속합니다.

---

## 📚 문서 (Documentation)

자세한 사용 가이드는 다음 파일들을 참고하세요:
- [GUIDE_KR.md](./GUIDE_KR.md) (한국어 사용자 가이드)
- [GUIDE_EN.md](./GUIDE_EN.md) (English User Guide)

---
Created by LearningMate Team.
