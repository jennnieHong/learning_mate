/**
 * @file SettingsPage.jsx
 * @description 애플리케이션의 전역 학습 설정 및 개인화(테마, 글자 크기)를 관리하는 페이지입니다.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/useSettingsStore';
import toast from 'react-hot-toast';
import './SettingsPage.css';

/**
 * 인덱스를 엑셀 컬럼 문자(A, B, C...)로 변환합니다.
 */
const indexToLetter = (index) => {
  if (index === -1 || index === undefined) return '-';
  return String.fromCharCode(65 + index);
};

/**
 * [컴포넌트] 개별 컬럼 매핑 항목
 */
const MappingItem = ({ label, sub, value, onChange, isMandatory = false }) => {
  return (
    <div className="mapping-row">
      <div className="mapping-label">
        <h4>
          {label}
          {isMandatory && <span className="mandatory-badge">필수</span>}
        </h4>
        {sub && <span>{sub}</span>}
      </div>
      <div className="mapping-control">
        <div className="letter-badge">{indexToLetter(value)}</div>
        <select 
          className="col-select"
          value={value ?? -1} 
          onChange={(e) => onChange(parseInt(e.target.value))}
        >
          <option value="-1">사용 안 함</option>
          {Array.from({ length: 26 }).map((_, i) => (
            <option key={i} value={i}>컬럼 {String.fromCharCode(65 + i)}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default function SettingsPage() {
  const navigate = useNavigate();
  
  // 스토어에서 설정 상태와 업데이트 함수 추출
  const { settings, loadSettings, updateSetting, resetSettings } = useSettingsStore();
  
  
  /**
   * 설정을 저장하고 홈으로 돌아갑니다.
   */
  const handleSave = () => {
    toast.success('설정이 저장되었습니다!');
    navigate(-1);
  };

  /**
   * 모든 설정을 초기 기본값으로 되돌립니다.
   */
  const handleReset = async () => {
    if (confirm('모든 설정을 초기화하시겠습니까?\n\n테마, 글자 크기, 카드 색상 등이 기본 상태로 복구됩니다.')) {
      const result = await resetSettings();
      if (result.success) {
        toast.success('모든 설정이 초기화되었습니다.');
      } else {
        toast.error('초기화 중 오류가 발생했습니다.');
      }
    }
  };

  /**
   * 컬럼 매핑 설정을 업데이트합니다.
   */
  const handleMappingUpdate = (mappingKey, field, value) => {
    const currentMapping = settings[mappingKey] || {};
    updateSetting(mappingKey, {
      ...currentMapping,
      [field]: value
    });
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
          <h1>⚙️ 설정</h1>
        </header>

        {/* 상단 고정 버튼 영역 */}
        <div className="settings-action-bar">
          <button className="back-btn-fixed" onClick={() => navigate(-1)}>
            ← 돌아가기
          </button>
          <button className="save-btn-fixed" onClick={handleSave}>
            💾 설정 저장
          </button>
        </div>
        
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
                    max="20" 
                    step="1"
                    value={settings.fontSize || 8}
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

              {/* 글자 크기 조절 위젯 노출 여부 */}
              <div className="setting-sub-item">
                <label className="toggle-option">
                  <input
                    type="checkbox"
                    checked={settings.showFontScaleWidget ?? true}
                    onChange={(e) => handleUpdate('showFontScaleWidget', e.target.checked)}
                  />
                  <div className="toggle-content">
                    <div>
                      <h3 className="toggle-label-text">글자 크기 위젯 표시</h3>
                      <p className="sub-description">화면 위에 조절 버튼을 항상 표시합니다.</p>
                    </div>
                    <div className={`toggle-switch ${settings.showFontScaleWidget ? 'on' : ''}`}>
                      <div className="toggle-slider"></div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* 카드 색상 테마 선택 */}
            <div className="setting-sub-item full-width">
              <label>학습 카드 색상 테마</label>
              <div className="card-color-picker">
                {[
                  { id: 'indigo', name: 'Indigo', hue: 239, start: '#6366f1', end: '#a855f7' },
                  { id: 'ocean', name: 'Ocean', hue: 199, start: '#0ea5e9', end: '#2563eb' },
                  { id: 'forest', name: 'Forest', hue: 160, start: '#10b981', end: '#059669' },
                  { id: 'sunset', name: 'Sunset', hue: 25, start: '#f59e0b', end: '#ea580c' },
                  { id: 'rose', name: 'Rose', hue: 350, start: '#f43f5e', end: '#e11d48' },
                  { id: 'slate', name: 'Slate', hue: 215, start: '#475569', end: '#1e293b' }
                ].map((color) => (
                  <button
                    key={color.id}
                    className={`color-preset-btn ${settings.cardColor === color.id ? 'active' : ''}`}
                    onClick={() => {
                      updateSetting('cardColor', color.id);
                      updateSetting('cardHue', color.hue);
                    }}
                    title={color.name}
                  >
                    <div 
                      className="color-preview" 
                      style={{ background: `linear-gradient(135deg, ${color.start} 0%, ${color.end} 100%)` }}
                    >
                      {settings.cardColor === color.id && <span className="check-icon">✓</span>}
                    </div>
                    <span>{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 카드 색상 상세 조절 (채도, 명도) */}
            <div className="setting-sub-item full-width">
              <div className="color-detail-adjust">
                <div className="adjust-group">
                  <div className="adjust-header">
                    <label>카드 색상 (Hue)</label>
                    <span className="value-badge">{settings.cardHue}°</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="360" 
                    value={settings.cardHue ?? 239} 
                    onChange={(e) => handleUpdate('cardHue', parseInt(e.target.value))}
                    className="color-slider hue-slider"
                  />
                </div>

                <div className="adjust-group">
                  <div className="adjust-header">
                    <label>카드 채도 (Saturation)</label>
                    <span className="value-badge">{settings.cardSaturation}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={settings.cardSaturation ?? 70} 
                    onChange={(e) => handleUpdate('cardSaturation', parseInt(e.target.value))}
                    className="color-slider"
                  />
                </div>
                
                <div className="adjust-group">
                  <div className="adjust-header">
                    <label>카드 명도 (Lightness)</label>
                    <span className="value-badge">{settings.cardLightness}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={settings.cardLightness ?? 60} 
                    onChange={(e) => handleUpdate('cardLightness', parseInt(e.target.value))}
                    className="color-slider"
                  />
                </div>
              </div>
              
              {/* 시각적 확인을 위한 실시간 프리뷰 카드 (미니 버전) */}
              <div className="card-mini-preview-container">
                <div className="preview-label">실시간 미리보기</div>
                <div className={`mini-card-preview card-theme-${settings.cardColor}`}>
                  <div className="mini-card-face">샘플 카드</div>
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
              
              <label className={`option-card ${settings.mode === 'list' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="mode"
                  value="list"
                  checked={settings.mode === 'list'}
                  onChange={(e) => handleUpdate('mode', e.target.value)}
                />
                <div className="option-content">
                  <div className="option-icon">📋</div>
                  <div className="option-text">
                    <h3>리스트 모드</h3>
                    <p>전체 문제를 한눈에 보며 학습</p>
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          {/* [3. 문제 유형 설정] */}
          <div className={`question-type-wrapper ${(settings.mode === 'problem' || settings.mode === 'list') ? 'visible' : 'hidden'}`}>
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
                    onChange={(e) => handleUpdate('questionType', e.target.value)}
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
          </div>
          
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
              <h2>🔁 탐색 설정</h2>
              <label className="toggle-option">
                <input
                  type="checkbox"
                  checked={settings.repeatMode}
                  onChange={(e) => handleUpdate('repeatMode', e.target.checked)}
                />
                <div className="toggle-content">
                  <div>
                    <h3>순환 탐색 (무한 루프)</h3>
                    <p>마지막에서 처음으로, 처음에서 마지막으로 연결</p>
                  </div>
                  <div className={`toggle-switch ${settings.repeatMode ? 'on' : ''}`}>
                    <div className="toggle-slider"></div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* [5. 컬럼 매핑 설정] */}
          <section className="setting-group">
            <h2>📊 컬럼 매핑</h2>
            <p className="setting-description">파일 업로드 및 내보내기 시 각 열(Column)의 의미를 지정하세요</p>
            
            <div className="mapping-grid grid-2">
              {/* 업로드(파서) 매핑 */}
              <div className="mapping-section">
                <h3>📥 업로드 설정</h3>
                <p className="sub-description">파일을 읽을 때 사용할 컬럼 위치</p>
                <div className="mapping-container">
                  <MappingItem 
                    label="문제/설명" 
                    sub="필수" 
                    value={settings.parserMapping?.description} 
                    onChange={(val) => handleMappingUpdate('parserMapping', 'description', val)}
                    isMandatory
                  />
                  <MappingItem 
                    label="정답" 
                    sub="필수" 
                    value={settings.parserMapping?.answer} 
                    onChange={(val) => handleMappingUpdate('parserMapping', 'answer', val)}
                    isMandatory
                  />
                  <MappingItem 
                    label="힌트" 
                    value={settings.parserMapping?.hint} 
                    onChange={(val) => handleMappingUpdate('parserMapping', 'hint', val)}
                  />
                  <MappingItem 
                    label="해설" 
                    value={settings.parserMapping?.explanation} 
                    onChange={(val) => handleMappingUpdate('parserMapping', 'explanation', val)}
                  />
                  <MappingItem 
                    label="학습완료상태" 
                    value={settings.parserMapping?.isCompleted} 
                    onChange={(val) => handleMappingUpdate('parserMapping', 'isCompleted', val)}
                  />
                  <MappingItem 
                    label="오답횟수" 
                    value={settings.parserMapping?.wrongCount} 
                    onChange={(val) => handleMappingUpdate('parserMapping', 'wrongCount', val)}
                  />
                </div>
              </div>

              {/* 내보내기(내보내기) 매핑 */}
              <div className="mapping-section">
                <h3>📤 내보내기 설정</h3>
                <p className="sub-description">파일로 저장할 때의 컬럼 순서</p>
                <div className="mapping-container">
                  <MappingItem 
                    label="문제/설명" 
                    value={settings.exportMapping?.description} 
                    onChange={(val) => handleMappingUpdate('exportMapping', 'description', val)}
                    isMandatory
                  />
                  <MappingItem 
                    label="정답" 
                    value={settings.exportMapping?.answer} 
                    onChange={(val) => handleMappingUpdate('exportMapping', 'answer', val)}
                    isMandatory
                  />
                  <MappingItem 
                    label="힌트" 
                    value={settings.exportMapping?.hint} 
                    onChange={(val) => handleMappingUpdate('exportMapping', 'hint', val)}
                  />
                  <MappingItem 
                    label="해설" 
                    value={settings.exportMapping?.explanation} 
                    onChange={(val) => handleMappingUpdate('exportMapping', 'explanation', val)}
                  />
                  <MappingItem 
                    label="학습완료상태" 
                    value={settings.exportMapping?.isCompleted} 
                    onChange={(val) => handleMappingUpdate('exportMapping', 'isCompleted', val)}
                  />
                  <MappingItem 
                    label="오답횟수" 
                    value={settings.exportMapping?.wrongCount} 
                    onChange={(val) => handleMappingUpdate('exportMapping', 'wrongCount', val)}
                  />
                </div>
              </div>
            </div>
            <p className="sub-description" style={{ marginTop: '12px' }}>
              💡 선택지(보기)는 지정된 컬럼들 이후에 자동으로 배치됩니다.
            </p>
          </section>

          {/* [6. 데이터 및 업로드 설정] */}
          <div className="setting-group">
            <h2>💾 데이터 및 업로드</h2>
            <p className="setting-description">파일 업로드 및 처리 방식을 설정합니다</p>
            
            <div className="setting-options">
              <label className="toggle-option">
                <input
                  type="checkbox"
                  checked={settings.hasHeaderRow ?? true}
                  onChange={(e) => handleUpdate('hasHeaderRow', e.target.checked)}
                />
                <div className="toggle-content">
                  <div>
                    <h3>첫 줄은 헤더로 처리</h3>
                    <p className="sub-description">업로드한 파일의 첫 번째 행을 제목(헤더)으로 보고 데이터에서 제외합니다.</p>
                  </div>
                  <div className={`toggle-switch ${settings.hasHeaderRow ? 'on' : ''}`}>
                    <div className="toggle-slider"></div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* [7. 위험 구역] */}
          <section className="setting-group danger-zone">
            <h2>⚠️ 위험 구역</h2>
            <div className="danger-zone-content">
              <div className="danger-text">
                <h3>모든 설정 초기화</h3>
                <p>애플리케이션의 모든 설정을 초기 상태로 되돌립니다. 이 작업은 취소할 수 없습니다.</p>
              </div>
              <button className="reset-all-btn" onClick={handleReset}>
                초기화 실행
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
