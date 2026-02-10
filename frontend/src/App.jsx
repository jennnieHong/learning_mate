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
import { FontScaleWidget } from './components/Common/FontScaleWidget';
import './App.css';

/**
 * 페이지 이동 시 이전 스크롤 위치를 복원하거나 최상단으로 이동시키는 컴포넌트입니다.
 */
function ScrollRestoration() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. 현재 경로에 저장된 스크롤 위치 조회
    const savedPos = sessionStorage.getItem(`scrollPos:${pathname}`);
    
    if (savedPos) {
      // 페이지 렌더링 완료 후 스크롤 복원 (데이터 로딩 등을 고려하여 약간의 지연)
      const timer = setTimeout(() => {
        window.scrollTo({
          top: parseInt(savedPos, 10),
          behavior: 'instant'
        });
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // 저장된 위치가 없으면 최상단으로
      window.scrollTo(0, 0);
    }

    // 2. 스크롤 발생 시 현재 위치 저장
    const handleScroll = () => {
      // 설정 페이지 등 일부 페이지는 스크롤 저장을 제외할 수 있음
      if (pathname === '/settings') return;
      sessionStorage.setItem(`scrollPos:${pathname}`, window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  return null;
}

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
      <ScrollRestoration />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/study/:fileId" element={<StudyPage />} />
        <Route path="/editor/:fileId" element={<EditorPage />} />
        <Route path="/trash" element={<TrashPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      <FontScaleWidget />
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
