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
    updateSetting 
  } = useSettingsStore();

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(settings.fontScaleWidgetPos || { top: 20, right: 20 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const widgetStartPos = useRef({ top: 0, right: 0 });
  // 드래그 중 최신 위치를 이벤트 리스너(클로저)에서 참조하기 위한 Ref
  const livePositionRef = useRef(position);

  // 설정에서 위치가 변경되면 로컬 상태도 동기화 (드래그 중이 아닐 때만)
  useEffect(() => {
    if (settings.fontScaleWidgetPos && !isDragging) {
      const newPos = settings.fontScaleWidgetPos;
      setPosition(newPos);
      livePositionRef.current = newPos;
    }
  }, [settings.fontScaleWidgetPos, isDragging]);

  if (!settings.showFontScaleWidget) return null;

  const currentSize = settings.fontSize || 8;

  const handleIncrease = (e) => {
    e.stopPropagation();
    if (currentSize < 20) updateSetting('fontSize', currentSize + 1);
  };

  const handleDecrease = (e) => {
    e.stopPropagation();
    if (currentSize > 1) updateSetting('fontSize', currentSize - 1);
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
    const deltaX = dragStartPos.current.x - e.clientX;
    const deltaY = e.clientY - dragStartPos.current.y;

    // 화면 경계 제한 (위젯 크기 약 200x60 고려)
    const newTop = Math.max(0, Math.min(window.innerHeight - 60, widgetStartPos.current.top + deltaY));
    const newRight = Math.max(0, Math.min(window.innerWidth - 200, widgetStartPos.current.right + deltaX));

    const newPos = { top: newTop, right: newRight };
    setPosition(newPos);
    livePositionRef.current = newPos; // 클로저가 최신 값을 볼 수 있게 Ref 업데이트
  };

  /**
   * 드래그 종료 핸들러
   */
  const handleMouseUp = () => {
    setIsDragging(false);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    
    // stale closure 방지를 위해 Ref의 현재 값을 저장
    updateSetting('fontScaleWidgetPos', livePositionRef.current);
  };

  /**
   * 터치 이벤트 (모바일 대응)
   */
  const handleTouchStart = (e) => {
    // 이벤트 전파 차단 및 배경 스크롤 방지
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();

    const touch = e.touches[0];
    if (touch.target.closest('button')) return; // 버튼 클릭 시엔 드래그 방지

    setIsDragging(true);
    dragStartPos.current = { x: touch.clientX, y: touch.clientY };
    widgetStartPos.current = { ...position };
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    // 드래그 중 배경 스크롤 방지
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();

    const touch = e.touches[0];
    const deltaX = dragStartPos.current.x - touch.clientX;
    const deltaY = touch.clientY - dragStartPos.current.y;

    const newTop = Math.max(0, Math.min(window.innerHeight - 60, widgetStartPos.current.top + deltaY));
    const newRight = Math.max(0, Math.min(window.innerWidth - 200, widgetStartPos.current.right + deltaX));

    const newPos = { top: newTop, right: newRight };
    setPosition(newPos);
    livePositionRef.current = newPos;
  };

  const handleTouchEnd = (e) => {
    e.stopPropagation();
    setIsDragging(false);
    updateSetting('fontScaleWidgetPos', livePositionRef.current);
  };

  return (
    <div 
      className={`font-scale-widget ${isDragging ? 'dragging' : ''}`}
      style={{ 
        top: `${position.top}px`, 
        right: `${position.right}px`,
        bottom: 'auto',
        touchAction: 'none' // CSS 레벨에서 터치 동작 제한
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="drag-handle"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        ⋮⋮
      </div>
      <button 
        className="scale-btn" 
        onClick={handleDecrease} 
        onMouseDown={(e) => e.stopPropagation()} // 드래그 시작 방지
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
        onMouseDown={(e) => e.stopPropagation()} // 드래그 시작 방지
        disabled={currentSize >= 20}
        title="글자 크게"
      >
        A+
      </button>
    </div>
  );
};
