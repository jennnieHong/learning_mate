/**
 * @file FontScaleWidget.jsx
 * @description 현재 페이지에서만 적용되는 임시 글자 크기를 조절하는 플로팅 위젯입니다.
 */

import { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import './FontScaleWidget.css';

export const FontScaleWidget = () => {
  const { 
    settings, 
    temporaryFontSize, 
    setTemporaryFontSize, 
    resetTemporaryFontSize,
    updateSetting 
  } = useSettingsStore();

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(settings.fontScaleWidgetPos || { top: 20, right: 20 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const widgetStartPos = useRef({ top: 0, right: 0 });

  // 설정에서 위치가 변경되면 로컬 상태도 동기화
  useEffect(() => {
    if (settings.fontScaleWidgetPos) {
      setPosition(settings.fontScaleWidgetPos);
    }
  }, [settings.fontScaleWidgetPos]);

  if (!settings.showFontScaleWidget) return null;

  const currentSize = temporaryFontSize || settings.fontSize || 5;

  const handleIncrease = (e) => {
    e.stopPropagation();
    if (currentSize < 10) setTemporaryFontSize(currentSize + 1);
  };

  const handleDecrease = (e) => {
    e.stopPropagation();
    if (currentSize > 1) setTemporaryFontSize(currentSize - 1);
  };

  const handleReset = (e) => {
    e.stopPropagation();
    resetTemporaryFontSize();
  };

  /**
   * 드래그 시작 핸들러
   */
  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    widgetStartPos.current = { ...position };
    
    // 글로벌 이벤트 등록
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  /**
   * 드래그 이동 핸들러
   */
  const handleMouseMove = (e) => {
    const deltaX = dragStartPos.current.x - e.clientX; // 오른쪽에서 시작하므로 clientX가 줄어들면 right는 늘어남
    const deltaY = e.clientY - dragStartPos.current.y;

    const newTop = Math.max(0, Math.min(window.innerHeight - 50, widgetStartPos.current.top + deltaY));
    const newRight = Math.max(0, Math.min(window.innerWidth - 100, widgetStartPos.current.right + deltaX));

    setPosition({ top: newTop, right: newRight });
  };

  /**
   * 드래그 종료 핸들러
   */
  const handleMouseUp = () => {
    setIsDragging(false);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    
    // 최종 위치를 설정에 저장
    updateSetting('fontScaleWidgetPos', position);
  };

  /**
   * 터치 이벤트 (모바일 대응)
   */
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartPos.current = { x: touch.clientX, y: touch.clientY };
    widgetStartPos.current = { ...position };
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaX = dragStartPos.current.x - touch.clientX;
    const deltaY = touch.clientY - dragStartPos.current.y;

    const newTop = Math.max(0, Math.min(window.innerHeight - 50, widgetStartPos.current.top + deltaY));
    const newRight = Math.max(0, Math.min(window.innerWidth - 100, widgetStartPos.current.right + deltaX));

    setPosition({ top: newTop, right: newRight });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    updateSetting('fontScaleWidgetPos', position);
  };

  return (
    <div 
      className={`font-scale-widget ${isDragging ? 'dragging' : ''}`}
      style={{ 
        top: `${position.top}px`, 
        right: `${position.right}px`,
        bottom: 'auto' // 기존 bottom 초기화
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="drag-handle">⋮⋮</div>
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
          onClick={handleReset}
          title="기본 크기로 복구"
        >
          🔄
        </button>
      )}
    </div>
  );
};
