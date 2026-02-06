# 🎓 LearningMate Frontend

LearningMate의 프론트엔드는 React 19와 Vite를 기반으로 구축되었으며, 모든 학습 로직과 데이터 저장을 브라우저 단에서 처리하는 클라이언트 우선(Client-First) 아키텍처를 따릅니다.

## 🛠️ 주요 기술 (Frontend Stack)

- **Framework**: React 19 + Vite
- **State Management**: Zustand (전역 상태 관리)
- **Database**: IndexedDB (localforage를 통한 비동기 저장)
- **Parsing**: xlsx (Excel), papaparse (CSV/TXT)
- **Styling**: Vanilla CSS (Modern CSS 3)
- **Animation**: Framer Motion
- **Toasts**: React Hot Toast

## 📂 폴더 구조

```
src/
├── components/      # 기능별 재사용 컴포넌트 (FileUpload, Card, Quiz 등)
├── pages/           # 각 화면 단위 컴포넌트 (StudyPage, EditorPage 등)
├── stores/          # Zustand 상태 스토어 (파일, 진행률, 설정 관리)
├── utils/           # 유틸리티 (스토리지 래퍼, 파일 파싱 엔진 등)
├── App.jsx          # 라우팅 및 전역 레이아웃
└── main.jsx         # 엔트리 포인트
```

## 🚀 개발 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 📖 문서

전역 프로젝트 문서는 루트 디렉토리를 참고하세요:
- [README.md](../README.md)
- [GUIDE_KR.md](../GUIDE_KR.md)

---
Created by LearningMate Team.
