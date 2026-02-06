/**
 * @file SettingsPage.jsx
 * @description 애플리케이션의 전역 학습 설정 및 개인화(테마, 글자 크기)를 관리하는 페이지입니다.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/useSettingsStore';
import toast from 'react-hot-toast';
import './SettingsPage.css';

export default function SettingsPage() {
  const navigate = useNavigate();
  
  // 스토어에서 설정 상태와 업데이트 함수 추출
  const { settings, loadSettings, updateSetting } = useSettingsStore();
  
  /**
   * 페이지 진입 시 저장된 설정을 불러옵니다.
   */
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);
  
  /**
   * 설정을 저장하고 홈으로 돌아갑니다.
   */
  const handleSave = () => {
    toast.success('설정이 저장되었습니다!');
    navigate('/');
  };

  /**
   * 개별 설정값을 변경합니다.
   * @param {string} key - 설정 키
   * @param {any} value - 적용할 값
   */
  const handleUpdate = (key, value) => {
    updateSetting(key, value);
  };
  
  return (
    <div className="settings-page">
      <div className="settings-container">
        <header className="settings-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← 돌아가기
          </button>
          <h1>⚙️ 설정</h1>
          <button className="save-btn" onClick={handleSave}>
            저장
          </button>
        </header>
        
        <main className="settings-content">
          {/* [1. 테마 및 디자인 설정] */}
          <section className="setting-group">
            <h2>🎨 테마 및 디자인</h2>
            <p className="setting-description">애플리케이션의 분위기와 글자 크기를 설정하세요</p>
            
            <div className="setting-options grid-2">
              {/* 테마 선택 */}
              <div className="setting-sub-item">
                <label>화면 테마</label>
                <div className="theme-toggle">
                  <button 
                    className={`theme-btn ${settings.theme === 'light' ? 'active' : ''}`}
                    onClick={() => handleUpdate('theme', 'light')}
                  >
                    ☀️ 라이트
                  </button>
                  <button 
                    className={`theme-btn ${settings.theme === 'dark' ? 'active' : ''}`}
                    onClick={() => handleUpdate('theme', 'dark')}
                  >
                    🌙 다크
                  </button>
                </div>
              </div>

              {/* 글자 크기 조절 (슬라이더) */}
              <div className="setting-sub-item">
                <label>기본 글자 크기 (현재 {settings.fontSize}단계)</label>
                <div className="font-size-slider-container">
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    step="1"
                    value={settings.fontSize || 5}
                    onChange={(e) => handleUpdate('fontSize', parseInt(e.target.value))}
                    className="font-size-slider"
                  />
                  <div className="slider-labels">
                    <span>작게</span>
                    <span>보통</span>
                    <span>크게</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* [2. 학습 모드 설정] */}
          <div className="setting-group">
            <h2>📚 학습 모드</h2>
            <p className="setting-description">지식을 습득할 기본 방식을 선택하세요</p>
            
            <div className="setting-options">
              <label className={`option-card ${settings.mode === 'explanation' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="mode"
                  value="explanation"
                  checked={settings.mode === 'explanation'}
                  onChange={(e) => handleUpdate('mode', e.target.value)}
                />
                <div className="option-content">
                  <div className="option-icon">🔄</div>
                  <div className="option-text">
                    <h3>설명 모드</h3>
                    <p>카드를 뒤집어서 설명과 정답을 확인</p>
                  </div>
                </div>
              </label>
              
              <label className={`option-card ${settings.mode === 'problem' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="mode"
                  value="problem"
                  checked={settings.mode === 'problem'}
                  onChange={(e) => handleUpdate('mode', e.target.value)}
                />
                <div className="option-content">
                  <div className="option-icon">✏️</div>
                  <div className="option-text">
                    <h3>문제 모드</h3>
                    <p>문제(퀴즈)를 풀면서 실력을 테스트</p>
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          {/* [3. 문제 유형 설정] */}
          {settings.mode === 'problem' && (
            <div className="setting-group">
              <h2>📝 문제 유형</h2>
              <p className="setting-description">문제를 풀 때의 정답 입력 방식을 결정합니다</p>
              
              <div className="setting-options">
                <label className={`option-card ${settings.questionType === 'multiple' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="questionType"
                    value="multiple"
                    checked={settings.questionType === 'multiple'}
                    onChange={(e) => handleUpdate('questionType', e.target.value)}
                  />
                  <div className="option-content">
                    <div className="option-icon">🔢</div>
                    <div className="option-text">
                      <h3>객관식</h3>
                      <p>여러 선택지 중에서 하나를 선택</p>
                    </div>
                  </div>
                </label>
                
                <label className={`option-card ${settings.questionType === 'subjective' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="questionType"
                    value="subjective"
                    checked={settings.questionType === 'subjective'}
                    onChange={(e) => handleUpdate('subjective', e.target.value)}
                  />
                  <div className="option-content">
                    <div className="option-icon">✍️</div>
                    <div className="option-text">
                      <h3>주관식</h3>
                      <p>정답을 직접 텍스트로 입력</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}
          
          {/* [4. 문제 순서 및 반복] */}
          <div className="setting-group grid-2">
            <div>
              <h2>🔀 문제 순서</h2>
              <div className="setting-options">
                <label className={`option-card compact ${settings.orderMode === 'sequential' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="orderMode"
                    value="sequential"
                    checked={settings.orderMode === 'sequential'}
                    onChange={(e) => handleUpdate('orderMode', e.target.value)}
                  />
                  <div className="option-content">
                    <span>1️⃣2️⃣3️⃣ 순서대로</span>
                  </div>
                </label>
                
                <label className={`option-card compact ${settings.orderMode === 'random' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="orderMode"
                    value="random"
                    checked={settings.orderMode === 'random'}
                    onChange={(e) => handleUpdate('orderMode', e.target.value)}
                  />
                  <div className="option-content">
                    <span>🔀 무작위 섞기</span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <h2>🔁 반복 설정</h2>
              <label className="toggle-option">
                <input
                  type="checkbox"
                  checked={settings.repeatMode}
                  onChange={(e) => handleUpdate('repeatMode', e.target.checked)}
                />
                <div className="toggle-content">
                  <div>
                    <h3>오답 반복 학습</h3>
                    <p>틀린 문제만 다시 풀기</p>
                  </div>
                  <div className={`toggle-switch ${settings.repeatMode ? 'on' : ''}`}>
                    <div className="toggle-slider"></div>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
