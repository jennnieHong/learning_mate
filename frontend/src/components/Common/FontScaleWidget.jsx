/**
 * @file FontScaleWidget.jsx
 * @description 현재 페이지에서만 적용되는 임시 글자 크기를 조절하는 플로팅 위젯입니다.
 */

import { useSettingsStore } from '../../stores/useSettingsStore';
import './FontScaleWidget.css';

export const FontScaleWidget = () => {
  const { settings, temporaryFontSize, setTemporaryFontSize, resetTemporaryFontSize } = useSettingsStore();

  const currentSize = temporaryFontSize || settings.fontSize || 5;

  const handleIncrease = () => {
    if (currentSize < 10) setTemporaryFontSize(currentSize + 1);
  };

  const handleDecrease = () => {
    if (currentSize > 1) setTemporaryFontSize(currentSize - 1);
  };

  return (
    <div className="font-scale-widget">
      <button 
        className="scale-btn" 
        onClick={handleDecrease} 
        disabled={currentSize <= 1}
        title="글자 작게"
      >
        A-
      </button>
      <div className="current-scale-display">
        {currentSize}
      </div>
      <button 
        className="scale-btn" 
        onClick={handleIncrease} 
        disabled={currentSize >= 10}
        title="글자 크게"
      >
        A+
      </button>
      {temporaryFontSize !== null && (
        <button 
          className="reset-scale-btn" 
          onClick={resetTemporaryFontSize}
          title="기본 크기로 복구"
        >
          🔄
        </button>
      )}
    </div>
  );
};
