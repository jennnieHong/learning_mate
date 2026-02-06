/**
 * @file App.jsx
 * @description 애플리케이션의 메인 레이아웃 및 라우팅 설정을 담당하는 컴포넌트입니다.
 * React Router를 사용하여 각 페이지(Home, Study, Editor, Trash, Settings) 간의 전환을 관리합니다.
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import StudyPage from './pages/StudyPage';
import EditorPage from './pages/EditorPage';
import TrashPage from './pages/TrashPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* 메인 화면: 파일 목록 및 업로드 */}
          <Route path="/" element={<HomePage />} />
          
          {/* 학습 화면: 선택된 파일의 문제를 풀거나 설명을 확인 */}
          <Route path="/study/:fileId" element={<StudyPage />} />
          
          {/* 편집 화면: 문제집 내용을 수정하거나 새로 생성 */}
          <Route path="/editor/:fileId" element={<EditorPage />} />
          
          {/* 휴지통: 삭제된 파일 복원 및 영구 삭제 */}
          <Route path="/trash" element={<TrashPage />} />
          
          {/* 설정: 학습 모드 및 사용자 환경 설정 */}
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
