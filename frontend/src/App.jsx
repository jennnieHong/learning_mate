/**
 * @file App.jsx
 * @description 애플리케이션의 메인 레이아웃, 라우팅, 그리고 전역 테마 및 폰트 크기 조절을 관리합니다.
 */

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useSettingsStore } from './stores/useSettingsStore';
import HomePage from './pages/HomePage';
import StudyPage from './pages/StudyPage';
import EditorPage from './pages/EditorPage';
import TrashPage from './pages/TrashPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

/**
 * 전역 설정을 실제 DOM 요소에 반영하고 페이지 이동을 감지하는 컴포넌트입니다.
 * BrowserRouter 내부에서 실행되어야 하므로 App 컴포넌트의 하위로 배치합니다.
 */
function AppContent() {
  const location = useLocation();
  const { settings, loadSettings, temporaryFontSize, resetTemporaryFontSize } = useSettingsStore();

  // 1. 초기 설정 로드
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // 2. 페이지 이동 시 임시 글자 크기 초기화
  useEffect(() => {
    resetTemporaryFontSize();
  }, [location.pathname, resetTemporaryFontSize]);

  /**
   * 글자 크기 단계(1~10)를 CSS 변수 스케일 비율로 변환합니다.
   * 1단계: 0.8배 ~ 10단계: 1.7배 (0.1씩 증가)
   * 기본값(5단계): 1.2배 -> 기존 디자인이 작게 보였으므로 약간 보정
   */
  const getScaleFactor = (step) => {
    return 0.7 + (step * 0.1);
  };

  const currentScale = temporaryFontSize || settings.fontSize || 5;
  const scaleFactor = getScaleFactor(currentScale);

  // 3. 실제 DOM의 root(html) 요소에 전역 변수 반영 (폰트 스케일, 카드 색상 조절)
  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale-factor', scaleFactor);
    document.documentElement.style.setProperty('--card-saturation', `${settings.cardSaturation}%`);
    document.documentElement.style.setProperty('--card-lightness', `${settings.cardLightness}%`);
  }, [scaleFactor, settings.cardSaturation, settings.cardLightness]);

  return (
    <div className={`app-container theme-${settings.theme || 'light'} card-theme-${settings.cardColor || 'indigo'}`}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/study/:fileId" element={<StudyPage />} />
        <Route path="/editor/:fileId" element={<EditorPage />} />
        <Route path="/trash" element={<TrashPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
