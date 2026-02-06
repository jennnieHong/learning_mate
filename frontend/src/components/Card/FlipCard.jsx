/**
 * @file FlipCard.jsx
 * @description '상세 설명 모드'에서 사용하는 3D 뒤집기 카드 컴포넌트입니다.
 * framer-motion을 사용하여 부드러운 애니메이션 효과를 제공합니다.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './FlipCard.css';

export const FlipCard = ({ problem, cardFront }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  /**
   * 문제가 바뀌면 카드를 다시 앞면(문제면)으로 초기화합니다.
   */
  useEffect(() => {
    setIsFlipped(false);
  }, [problem]);

  /**
   * 설정에 따라 앞면에 보여줄 텍스트와 뒷면에 보여줄 텍스트를 결정합니다.
   */
  const getCardContent = () => {
    // cardFront 설정에 따라 문제와 정답의 위치를 바꿀 수 있습니다.
    const showAnswerFirst = cardFront === 'answer' || (cardFront === 'random' && Math.random() > 0.5);
    
    return {
      front: showAnswerFirst ? problem.answer : problem.description,
      back: showAnswerFirst ? problem.description : problem.answer
    };
  };

  const { front, back } = getCardContent();

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
