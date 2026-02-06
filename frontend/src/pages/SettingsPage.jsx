/**
 * @file SettingsPage.jsx
 * @description 애플리케이션의 전역 학습 설정을 관리하는 페이지입니다.
 * 학습 모드(설명/문제), 문제 유형(객관식/주관식), 카드 앞면 기준, 정렬 순서 등을 설정할 수 있습니다.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/useSettingsStore';
import toast from 'react-hot-toast';
import './SettingsPage.css';

export default function SettingsPage() {
  const navigate = useNavigate();
  
  // 스토어에서 설정 상태와 로드/업데이트 함수 추출
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
    // updateSetting은 스토어 내부에서 DB 저장까지 함께 수행합니다.
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
          {/* [1. 학습 모드 설정] */}
          <div className="setting-group">
            <h2>📚 학습 모드</h2>
            <p className="setting-description">지식을 습득할 기본 방식을 선택하세요</p>
            
            <div className="setting-options">
              {/* 설명 모드 선택 카드 */}
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
              
              {/* 문제 모드 선택 카드 */}
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
          
          {/* [2. 문제 유형 설정] - 문제 모드일 때만 노출 */}
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
          
          {/* [3. 카드 앞면 설정] - 설명 모드일 때만 노출 */}
          {settings.mode === 'explanation' && (
            <div className="setting-group">
              <h2>🎴 카드 앞면</h2>
              <p className="setting-description">카드 뒤집기 시 처음에 보여줄 내용을 선택하세요</p>
              
              <div className="setting-options">
                <label className={`option-card ${settings.cardFront === 'explanation' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="cardFront"
                    value="explanation"
                    checked={settings.cardFront === 'explanation'}
                    onChange={(e) => handleUpdate('cardFront', e.target.value)}
                  />
                  <div className="option-content">
                    <div className="option-icon">📖</div>
                    <div className="option-text">
                      <h3>설명 우선</h3>
                      <p>질문을 먼저 보고 답을 유추</p>
                    </div>
                  </div>
                </label>
                
                <label className={`option-card ${settings.cardFront === 'answer' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="cardFront"
                    value="answer"
                    checked={settings.cardFront === 'answer'}
                    onChange={(e) => handleUpdate('cardFront', e.target.value)}
                  />
                  <div className="option-content">
                    <div className="option-icon">💡</div>
                    <div className="option-text">
                      <h3>정답 우선</h3>
                      <p>정답을 보고 설명을 떠올려보기</p>
                    </div>
                  </div>
                </label>
                
                <label className={`option-card ${settings.cardFront === 'random' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="cardFront"
                    value="random"
                    checked={settings.cardFront === 'random'}
                    onChange={(e) => handleUpdate('cardFront', e.target.value)}
                  />
                  <div className="option-content">
                    <div className="option-icon">🎲</div>
                    <div className="option-text">
                      <h3>랜덤</h3>
                      <p>매번 앞뒤를 섞어서 출제</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}
          
          {/* [4. 문제 순서 설정] */}
          <div className="setting-group">
            <h2>🔀 문제 순서</h2>
            <p className="setting-description">문제가 나열되는 순서를 변경합니다</p>
            
            <div className="setting-options">
              <label className={`option-card ${settings.orderMode === 'sequential' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="orderMode"
                  value="sequential"
                  checked={settings.orderMode === 'sequential'}
                  onChange={(e) => handleUpdate('orderMode', e.target.value)}
                />
                <div className="option-content">
                  <div className="option-icon">1️⃣2️⃣3️⃣</div>
                  <div className="option-text">
                    <h3>순서대로</h3>
                    <p>파일에 저장된 원본 순서대로 진행</p>
                  </div>
                </div>
              </label>
              
              <label className={`option-card ${settings.orderMode === 'random' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="orderMode"
                  value="random"
                  checked={settings.orderMode === 'random'}
                  onChange={(e) => handleUpdate('orderMode', e.target.value)}
                />
                <div className="option-content">
                  <div className="option-icon">🔀</div>
                  <div className="option-text">
                    <h3>무작위</h3>
                    <p>문제를 무작위로 섞어서 출제</p>
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          {/* [5. 반복 학습 여부] */}
          <div className="setting-group">
            <h2>🔁 반복 모드</h2>
            <p className="setting-description">효율적인 복습을 위한 설정입니다</p>
            
            <label className="toggle-option">
              <input
                type="checkbox"
                checked={settings.repeatMode}
                onChange={(e) => handleUpdate('repeatMode', e.target.checked)}
              />
              <div className="toggle-content">
                <div>
                  <h3>오답 반복 학습</h3>
                  <p>한 세트가 끝나면 틀린 문제만 다시 풀기</p>
                </div>
                <div className={`toggle-switch ${settings.repeatMode ? 'on' : ''}`}>
                  <div className="toggle-slider"></div>
                </div>
              </div>
            </label>
          </div>
        </main>
      </div>
    </div>
  );
}
