/**
 * @file FlipCard.jsx
 * @description '상세 설명 모드'에서 사용하는 3D 뒤집기 카드 컴포넌트입니다.
 * framer-motion을 사용하여 부드러운 애니메이션 효과를 제공합니다.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './FlipCard.css';

export const FlipCard = ({ problem, cardFront }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  /**
   * 설정에 따라 앞면에 보여줄 텍스트와 뒷면에 보여줄 텍스트를 결정합니다.
   * key prop으로 컴포넌트가 재생성되므로 useEffect 없이도 초기화가 보장되지만,
   * 렌더링 시마다 텍스트가 바뀌지 않도록 useMemo를 사용합니다.
   */
  const { front, back } = useMemo(() => {
    let showAnswerFirst = false;

    if (cardFront === 'answer') {
      showAnswerFirst = true;
    } else if (cardFront === 'random') {
      // 문제 ID를 기반으로 하여 해당 문제에 대해서는 항상 일관된 랜덤 결과를 보여줌
      const hash = problem.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      showAnswerFirst = hash % 2 === 0;
    }
    
    return {
      front: showAnswerFirst ? problem.answer : problem.description,
      back: showAnswerFirst ? problem.description : problem.answer
    };
  }, [problem.id, problem.answer, problem.description, cardFront]);

  return (
    <div className="flip-card-container">
      <motion.div
        className={`flip-card ${isFlipped ? 'flipped' : ''}`}
        onClick={() => setIsFlipped(!isFlipped)}
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* 카드 앞면 */}
        <div className="card-face card-front">
          <div className="card-label">질문</div>
          <div className="card-content">
            <p>{front}</p>
          </div>
          <div className="card-hint">클릭하여 정답 확인</div>
        </div>

        {/* 카드 뒷면 */}
        <div className="card-face card-back">
          <div className="card-label">정답</div>
          <div className="card-content">
            <p>{back}</p>
          </div>
          <div className="card-hint">클릭하여 질문으로 돌아가기</div>
        </div>
      </motion.div>
    </div>
  );
};
