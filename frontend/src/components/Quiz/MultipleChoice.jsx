/**
 * @file MultipleChoice.jsx
 * @description 객관식 또는 주관식 퀴즈를 사용자에게 보여주고 정답 여부를 판단하는 컴포넌트입니다.
 * 선택지가 없는 경우(빈 배열), 외부에서 제공받은 answerPool을 바탕으로 자동으로 보기를 생성합니다.
 */

import { useState, useEffect } from 'react';
import './MultipleChoice.css';

export const MultipleChoice = ({ problem, onAnswer, questionType, answerPool = [] }) => {
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [subjectiveInput, setSubjectiveInput] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [shuffleChoices, setShuffleChoices] = useState([]);

  /**
   * 문제가 바뀔 때마다 입력값과 정답 상태를 초기화하고,
   * 객관식의 경우 선택지를 준비합니다.
   */
  useEffect(() => {
    setSelectedChoice(null);
    setSubjectiveInput('');
    setIsAnswered(false);
    
    if (questionType === 'multiple') {
      let finalChoices = [];

      // 1. 문제 자체에 선택지가 이미 있는 경우
      if (problem.choices && problem.choices.length > 0) {
        finalChoices = [...problem.choices];
        // 정답이 선택지에 포함되어 있지 않다면 추가
        if (!finalChoices.some(c => c.trim().toLowerCase() === problem.answer.trim().toLowerCase())) {
          finalChoices.push(problem.answer);
        }
      } 
      // 2. 선택지가 아예 없는 경우 (자동 생성 로직)
      else if (answerPool.length > 0) {
        // 현재 정답과 다른 내용의 정답들만 추출 (대소문자 및 공백 무시 비교)
        const currentAnswerRef = problem.answer.trim().toLowerCase();
        
        // 1) 전체 중 유니크한 정답들만 추림
        const uniqueAnswers = [...new Set(answerPool.map(a => a.trim()))];
        
        // 2) 현재 정답과 텍스트가 겹치는 오답들 제외
        const otherAnswers = uniqueAnswers.filter(ans => 
          ans.toLowerCase() !== currentAnswerRef
        );
        
        // 3) 무작위 셔플 후 최대 3개 선택
        const fakeChoices = otherAnswers
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        
        finalChoices = [problem.answer, ...fakeChoices];
      }

      // 3. 최종 선택지 목록을 무작위로 섞음 (중복 제거 보장)
      const uniqueFinalChoices = [...new Set(finalChoices.map(c => c.trim()))];
      setShuffleChoices(uniqueFinalChoices.sort(() => Math.random() - 0.5));
    }
  }, [problem, questionType, answerPool]);

  /**
   * 사용자가 제출 버튼(또는 선택지)을 클릭했을 때 정답을 확인합니다.
   * @param {string} value - 사용자 입력값 또는 선택한 항목
   */
  const handleSubmit = (value) => {
    if (isAnswered) return;
    
    setIsAnswered(true);
    const isCorrect = value.trim().toLowerCase() === problem.answer.trim().toLowerCase();
    
    // 약간의 딜레이를 주어 정답/오답 표시를 확인하게 한 뒤 다음 문제로 넘깁니다.
    setTimeout(() => {
      onAnswer(isCorrect);
    }, 1200);
  };

  /**
   * [객관식 퀴즈 렌더링]
   */
  if (questionType === 'multiple' && (shuffleChoices.length > 0)) {
    return (
      <div className="quiz-container">
        <div className="quiz-question">
          <div className="problem-label">질문</div>
          <h2>{problem.description}</h2>
        </div>
        <div className="choices-grid">
          {shuffleChoices.map((choice, index) => {
            let statusClass = '';
            if (isAnswered) {
              const isChoiceCorrect = choice.trim().toLowerCase() === problem.answer.trim().toLowerCase();
              if (isChoiceCorrect) statusClass = 'correct';
              else if (choice === selectedChoice) statusClass = 'wrong';
            }

            return (
              <button
                key={index}
                className={`choice-btn ${statusClass} ${selectedChoice === choice ? 'selected' : ''}`}
                onClick={() => {
                  if (!isAnswered) {
                    setSelectedChoice(choice);
                    handleSubmit(choice);
                  }
                }}
                disabled={isAnswered}
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
   * [주관식 퀴즈 렌더링] - 카드 뒤집기 형태
   */
  const [isRevealed, setIsRevealed] = useState(false);
  
  return (
    <div className="quiz-container">
      <div className="quiz-question">
        <div className="problem-label">질문</div>
        <h2>{problem.description}</h2>
      </div>
      
      {!isRevealed ? (
        <div className="reveal-answer-area">
          <button 
            className="reveal-btn"
            onClick={() => setIsRevealed(true)}
          >
            🔒 클릭하여 정답 보기
          </button>
        </div>
      ) : (
        <>
          <div className="answer-display">
            <div className="answer-label">정답</div>
            <div className="answer-text">{problem.answer}</div>
          </div>
          
          {!isAnswered && (
            <div className="self-check-buttons">
              <button 
                className="check-btn correct-btn"
                onClick={() => {
                  setIsAnswered(true);
                  setTimeout(() => onAnswer(true), 800);
                }}
              >
                <span className="btn-icon">👍</span>
                <span className="btn-text">맞았어요</span>
              </button>
              <button 
                className="check-btn wrong-btn"
                onClick={() => {
                  setIsAnswered(true);
                  setTimeout(() => onAnswer(false), 800);
                }}
              >
                <span className="btn-icon">👎</span>
                <span className="btn-text">틀렸어요</span>
              </button>
            </div>
          )}
          
          {isAnswered && (
            <div className="answer-feedback processing">
              처리 중...
            </div>
          )}
        </>
      )}
    </div>
  );
};
