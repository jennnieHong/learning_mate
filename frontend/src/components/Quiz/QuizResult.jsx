/**
 * @file QuizResult.jsx
 * @description 학습 세션이 끝났을 때 정답률, 오답 개수 등의 통계를 보여주고 결과에 따른 후속 조치를 안내하는 컴포넌트입니다.
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './QuizResult.css';

export const QuizResult = ({ results, total, onRestart, filename }) => {
  const navigate = useNavigate();
  
  // 정답 개수 계산
  const correctCount = results.filter(r => r.isCorrect).length;
  // 정답률 계산
  const score = Math.round((correctCount / total) * 100);

  return (
    <motion.div 
      className="quiz-result-view"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="result-card">
        <header className="result-header">
          <h1>🎉 학습 완료!</h1>
          <p className="filename-display">{filename}</p>
        </header>

        <section className="score-section">
          <div className="score-circle">
            <span className="score-value">{score}</span>
            <span className="score-label">점</span>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="label">전체 문제</span>
              <span className="value">{total}</span>
            </div>
            <div className="stat-item correct">
              <span className="label">정답</span>
              <span className="value">{correctCount}</span>
            </div>
            <div className="stat-item wrong">
              <span className="label">오답</span>
              <span className="value">{total - correctCount}</span>
            </div>
          </div>
        </section>

        <section className="result-message">
          {score === 100 ? (
            <p>완벽합니다! 모든 문제를 맞히셨어요. ✨</p>
          ) : score >= 80 ? (
            <p>훌륭한 성적입니다! 조금만 더 하면 만점이에요. 👍</p>
          ) : (
            <p>복습이 필요해 보이네요. 오답 위주로 다시 시도해 보세요! 💪</p>
          )}
        </section>

        <footer className="result-footer">
          <button className="restart-btn" onClick={onRestart}>
            🔄 다시 학습하기
          </button>
          <button className="home-btn" onClick={() => navigate('/')}>
            🏠 메인으로
          </button>
        </footer>
      </div>
    </motion.div>
  );
};
