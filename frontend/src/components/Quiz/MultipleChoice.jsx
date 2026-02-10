/**
 * @file MultipleChoice.jsx
 * @description 객관식 또는 주관식 퀴즈를 사용자에게 보여주고 정답 여부를 판단하는 컴포넌트입니다.
 * 선택지가 없는 경우(빈 배열), 외부에서 제공받은 answerPool을 바탕으로 자동으로 보기를 생성합니다.
 */

import { useState, useEffect, useMemo } from 'react';
import { useStudyStore } from '../../stores/useStudyStore';
import './MultipleChoice.css';

export const MultipleChoice = ({ 
  problem, 
  onAnswer, 
  questionType, 
  choices = [],
  isRevealed = false, 
  isAnswered = false, 
}) => {
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [subjectiveInput, setSubjectiveInput] = useState('');
  const [localIsAnswered, setLocalIsAnswered] = useState(false);
  const { sessionAnswers, setSessionAnswer } = useStudyStore();

  /**
   * 문제가 바뀔 때 또는 세션 데이터가 있을 때 로컬 상태를 동기화합니다.
   */
  useEffect(() => {
    const saved = sessionAnswers[problem.id];
    if (saved) {
      setSelectedChoice(saved.selectedChoice);
      setLocalIsAnswered(true);
    } else {
      setSelectedChoice(null);
      setSubjectiveInput('');
      setLocalIsAnswered(false);
    }
  }, [problem.id, sessionAnswers]);

  /**
   * 사용자가 제출 버튼(또는 선택지)을 클릭했을 때 정답을 확인합니다.
   * @param {string} value - 사용자 입력값 또는 선택한 항목
   */
  const handleSubmit = (value) => {
    if (localIsAnswered || isAnswered) return;
    
    const isCorrect = value.trim().toLowerCase() === problem.answer.trim().toLowerCase();
    setLocalIsAnswered(true);

    // 세션 기록: 선택된 보기와 정답 여부를 함께 저장
    setSessionAnswer(problem.id, { selectedChoice: value, isCorrect });
    
    // 약간의 딜레이를 주어 정답/오답 표시를 확인하게 한 뒤 다음 문제로 넘깁니다.
    setTimeout(() => {
      onAnswer(isCorrect);
    }, 400);
  };

  /**
   * [객관식 퀴즈 렌더링]
   */
  if (questionType === 'multiple' && (choices.length > 0)) {
    return (
      <div className="quiz-container">
        <div className="quiz-question">
          <div className="problem-label">질문</div>
          <h2>{problem.description}</h2>
        </div>
        <div className="choices-grid">
          {choices.map((choice, index) => {
            let statusClass = '';
            const isActiveAnswered = isAnswered || localIsAnswered;
            const normalizedChoice = choice.trim().toLowerCase();
            const normalizedAnswer = problem.answer.trim().toLowerCase();

            if (isActiveAnswered) {
              const isChoiceCorrect = normalizedChoice === normalizedAnswer;
              if (isChoiceCorrect) statusClass = 'correct';
              else if (choice === selectedChoice) statusClass = 'wrong';
            }

            return (
              <button
                key={`${problem.id}-${choice}`}
                className={`choice-btn ${statusClass} ${selectedChoice === choice ? 'selected' : ''}`}
                onClick={() => {
                  if (!isActiveAnswered) {
                    setSelectedChoice(choice);
                    handleSubmit(choice);
                  }
                }}
                disabled={isActiveAnswered}
              >
                <span className="choice-number">{index + 1}</span>
                <span className="choice-text">{choice}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /**
   * [주관식 퀴즈 렌더링] - 카드 뒤집기 형태 (컨트롤 버튼 없음)
   */
  return (
    <div className="quiz-container">
      <div className="quiz-question">
        <div className="problem-label">질문</div>
        <h2>{problem.description}</h2>
      </div>
      
      {isRevealed && (
        <div className="answer-display">
          <div className="answer-label">정답</div>
          <div className="answer-text">{problem.answer}</div>
        </div>
      )}

      {isAnswered && (
        <div className="answer-feedback processing">
          처리 중...
        </div>
      )}
    </div>
  );
};
