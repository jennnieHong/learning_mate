/**
 * @file GestureWidget.jsx
 * @description 학습 페이지에서 스와이프 제스처를 인식하는 플로팅 위젯입니다.
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '../../stores/useSettingsStore';
import './GestureWidget.css';

export const GestureWidget = ({ onSwipe }) => {
  const { settings, updateSetting } = useSettingsStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(settings.gestureWidgetPos || { top: 20, right: 20 });
  const containerRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const widgetStartPos = useRef({ top: 0, right: 0 });
  const livePositionRef = useRef(position);

  // 설정 변화(크기/너비/높이) 시 화면 밖으로 나가는지 체크하여 보정
  useEffect(() => {
    if (containerRef.current && !isDragging) {
      const rect = containerRef.current.getBoundingClientRect();
      let adjusted = false;
      const newPos = { ...livePositionRef.current };

      const MARGIN = 10;

      // 우측/좌측 경계 체크 (Viewport 기준)
      if (rect.left < MARGIN) {
        // 너무 왼쪽으로 갔으면 (right 값이 너무 커진 것)
        const overflow = MARGIN - rect.left;
        newPos.right = Math.max(0, newPos.right - overflow);
        adjusted = true;
      } else if (rect.right > window.innerWidth - MARGIN) {
        // 너무 오른쪽으로 갔으면 (right 값이 너무 작아진 것)
        const overflow = rect.right - (window.innerWidth - MARGIN);
        newPos.right = Math.max(0, newPos.right + overflow);
        adjusted = true;
      }

      // 상단/하단 경계 체크
      if (rect.top < MARGIN) {
        const overflow = MARGIN - rect.top;
        newPos.top = Math.max(0, newPos.top + overflow);
        adjusted = true;
      } else if (rect.bottom > window.innerHeight - MARGIN) {
        const overflow = rect.bottom - (window.innerHeight - MARGIN);
        newPos.top = Math.max(0, newPos.top - overflow);
        adjusted = true;
      }

      if (adjusted) {
        // 소수점 제거 및 상태 업데이트
        newPos.top = Math.round(newPos.top);
        newPos.right = Math.round(newPos.right);
        setPosition(newPos);
        livePositionRef.current = newPos;
        updateSetting('gestureWidgetPos', newPos);
      }
    }
  }, [settings.gestureWidgetSize, settings.gestureWidgetWidth, settings.gestureWidgetHeight]);

  // 설정에서 위치 동기화 (외부에서 변경될 때 - 초기화 등)
  useEffect(() => {
    if (settings.gestureWidgetPos && !isDragging) {
      setPosition(settings.gestureWidgetPos);
      livePositionRef.current = settings.gestureWidgetPos;
    }
  }, [settings.gestureWidgetPos, isDragging]);

  const handleDragEnd = (event, info) => {
    if (onSwipe) {
      onSwipe(event, info);
    }
  };

  /**
   * 플로팅 위치 드래그 시작 (핸들 영역)
   */
  const handleDragStartPos = (e) => {
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    setIsDragging(true);
    dragStartPos.current = { x: clientX, y: clientY };
    widgetStartPos.current = { ...position };

    const moveHandler = (moveEvent) => {
      if (!containerRef.current) return;
      
      const moveX = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0].clientX);
      const moveY = moveEvent.clientY || (moveEvent.touches && moveEvent.touches[0].clientY);
      
      const deltaX = dragStartPos.current.x - moveX;
      const deltaY = moveY - dragStartPos.current.y;

      const rect = containerRef.current.getBoundingClientRect();
      const widgetWidth = rect.width;
      const widgetHeight = rect.height;

      // 실제 렌더링된 크기를 기준으로 경계 계산
      const MARGIN = 10;
      const newTop = Math.max(MARGIN, Math.min(window.innerHeight - widgetHeight - MARGIN, widgetStartPos.current.top + deltaY));
      const newRight = Math.max(MARGIN, Math.min(window.innerWidth - widgetWidth - MARGIN, widgetStartPos.current.right + deltaX));

      const newPos = { top: Math.round(newTop), right: Math.round(newRight) };
      setPosition(newPos);
      livePositionRef.current = newPos;
    };

    const upHandler = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('mouseup', upHandler);
      window.removeEventListener('touchmove', moveHandler);
      window.removeEventListener('touchend', upHandler);
      
      updateSetting('gestureWidgetPos', livePositionRef.current);
    };

    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseup', upHandler);
    window.addEventListener('touchmove', moveHandler, { passive: false });
    window.addEventListener('touchend', upHandler);
  };

  const widgetSize = settings.gestureWidgetSize || 1;
  const widgetWidthFactor = settings.gestureWidgetWidth || 1;
  const widgetHeightFactor = settings.gestureWidgetHeight || 1;
  const widgetOpacity = settings.gestureWidgetOpacity ?? 0.8;

  return (
    <div 
      ref={containerRef}
      className={`gesture-widget-container ${isDragging ? 'dragging' : ''}`}
      style={{ 
        top: `${position.top}px`, 
        right: `${position.right}px`,
        opacity: widgetOpacity,
        transform: `scale(${widgetSize})`,
        transformOrigin: 'top right',
        willChange: 'transform, top, right'
      }}
    >
      {/* 위치 이동 핸들 */}
      <div 
        className="widget-drag-handle"
        onMouseDown={handleDragStartPos}
        onTouchStart={handleDragStartPos}
      >
        ⋮⋮
      </div>

      {/* 실제 제스처 인식 영역 */}
      <motion.div 
        className="gesture-action-area"
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.95 }}
        style={{ 
          minWidth: `${80 * widgetWidthFactor}px`,
          minHeight: `${60 * widgetHeightFactor}px`
        }}
      >
        <div className="gesture-icon">↔ ↕</div>
        <div className="gesture-label">Gesture</div>
      </motion.div>
    </div>
  );
};
