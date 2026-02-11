/**
 * @file main.jsx
 * @description React 애플리케이션의 엔트리 포인트(시작점)입니다.
 * App 컴포넌트를 브라우저의 DOM(id="root")에 렌더링하고, 전역 스타일을 적용합니다.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css' // 전역 기본 스타일 및 디자인 토큰 정의

// PWA: Service Worker 자동 업데이트 스크립트 주입 (vite-plugin-pwa)
import { registerSW } from 'virtual:pwa-register'
registerSW({ immediate: true })

/**
 * React 18의 createRoot API를 사용하여 렌더링을 시작합니다.
 * StrictMode는 개발 중 잠재적인 문제를 감지하기 위한 도구입니다.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
