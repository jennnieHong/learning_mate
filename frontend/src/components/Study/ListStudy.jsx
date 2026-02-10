/**
 * @file ListStudy.jsx
 * @description 전체 문제를 리스트 형태로 한눈에 보여주는 학습 모드 컴포넌트입니다.
 * 주관식은 답을 스포일러 처리하고, 객관식은 선택지를 랜덤하게 섞어서 표시합니다.
 */

import { useState, useMemo, useEffect } from 'react';
import { useProgressStore } from '../../stores/useProgressStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { chosungIncludes } from '../../utils/chosungUtils';
import toast from 'react-hot-toast';
import './ListStudy.css';

export default function ListStudy({ problems, fileId }) {
  const { progressMap, saveResult } = useProgressStore();
  const { settings } = useSettingsStore();
  
  // 상태
  const [revealedAnswers, setRevealedAnswers] = useState(new Set());
  const [selectedChoices, setSelectedChoices] = useState(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  
  /**
   * 답 공개 토글 (주관식용) 및 학습 완료 처리
   */
  const toggleRevealAnswer = async (problem) => {
    const isRevealing = !revealedAnswers.has(problem.id);
    
    setRevealedAnswers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(problem.id)) {
        newSet.delete(problem.id);
      } else {
        newSet.add(problem.id);
      }
      return newSet;
    });

    // 정답을 볼 때 자동으로 완료 처리 (이미 완료된 경우는 생략 가능하나 명시적으로 처리)
    if (isRevealing) {
      const currentProgress = progressMap[problem.id];
      if (!currentProgress?.isCompleted) {
        await saveResult(fileId, problem.id, {
          isCorrect: currentProgress?.isCorrect ?? null,
          isCompleted: true
        });
      }
    }
  };
  
  /**
   * 완료 상태 토글 (모든 문제 타입)
   */
  const toggleComplete = async (problem) => {
    const currentProgress = progressMap[problem.id];
    const newCompleteStatus = !currentProgress?.isCompleted;
    
    await saveResult(fileId, problem.id, {
      isCorrect: currentProgress?.isCorrect ?? null, // 기존 정답 여부 유지
      isCompleted: newCompleteStatus
    });
  };
  
  /**
   * 객관식 선택 처리 (정답 체크만, 완료는 별도)
   */
  const handleChoiceSelect = async (problem, choiceIndex, shuffledChoices) => {
    const selectedAnswer = shuffledChoices[choiceIndex];
    const isCorrect = selectedAnswer === problem.answer;
    
    setSelectedChoices(prev => new Map(prev).set(problem.id, choiceIndex));
    
    // 정답/오답 기록만 저장, 완료 처리는 하지 않음
    await saveResult(fileId, problem.id, {
      isCorrect,
      isCompleted: false  // 사용자가 명시적으로 완료 버튼을 눌러야 함
    });
  };
  
  /**
   * 배열 셔플 함수
   */
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  /**
   * 자동 선택지 생성 (선택지가 없는 객관식 문제용)
   */
  const generateAutoChoices = (currentProblem, allProblems) => {
    // 현재 문제의 카테고리 (계산 문제 여부) 확인
    const isCurrentCalculation = currentProblem.description?.includes('[계산]');

    const otherAnswers = allProblems
      .filter(p => {
        const isThisCalculation = p.description?.includes('[계산]');
        return p.id !== currentProblem.id && 
               p.answer && p.answer.trim() && 
               isThisCalculation === isCurrentCalculation;
      })
      .map(p => p.answer.trim());
    
    const uniqueAnswers = [...new Set(otherAnswers)];
    const shuffled = shuffleArray(uniqueAnswers);
    const selected = shuffled.slice(0, 3);
    
    // 정답이 포함되지 않도록 확인 (대소문자 무시)
    const currentAnswerRef = currentProblem.answer.trim().toLowerCase();
    const filtered = selected.filter(ans => ans.toLowerCase() !== currentAnswerRef);
    
    return filtered.slice(0, 3);
  };
  
  /**
   * 각 문제에 대한 셔플된 선택지 생성 (메모이제이션)
   */
  const problemsWithChoices = useMemo(() => {
    return problems.map(problem => {
      const isMultipleChoice = settings.questionType === 'multiple';
      
      if (!isMultipleChoice) {
        // 주관식 모드
        return { ...problem, shuffledChoices: null, isSubjective: true };
      }
      
      // 객관식 모드
      let choices = problem.choices && problem.choices.length > 0
        ? [...problem.choices]
        : generateAutoChoices(problem, problems);
      
      // 정답 포함하여 셔플
      const allChoices = [...choices, problem.answer];
      const uniqueChoices = [...new Set(allChoices)];
      const shuffled = shuffleArray(uniqueChoices);
      
      return { ...problem, shuffledChoices: shuffled, isSubjective: false };
    });
  }, [problems, settings.questionType]);
  
  /**
   * 검색 필터링
   */
  const filteredProblems = useMemo(() => {
    if (!searchQuery.trim()) return problemsWithChoices;
    
    const query = searchQuery.toLowerCase();
    
    return problemsWithChoices.filter(problem => {
      const desc = problem.description.toLowerCase();
      const ans = problem.answer.toLowerCase();
      const choices = (problem.choices || []).map(c => c.toLowerCase()).join(' ');
      
      const exactMatch = desc.includes(query) || ans.includes(query) || choices.includes(query);
      const chosungMatch = chosungIncludes(problem.description, query) ||
                          chosungIncludes(problem.answer, query) ||
                          (problem.choices || []).some(c => chosungIncludes(c, query));
      
      return exactMatch || chosungMatch;
    });
  }, [problemsWithChoices, searchQuery]);
  
  return (
    <div className="list-study">
      {/* 검색 바 */}
      <div className="list-study-header">
        <input
          type="text"
          className="list-search-input"
          placeholder="문제 검색... (초성 가능)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="problem-count">
          {searchQuery ? `${filteredProblems.length} / ` : ''}{problems.length}개 문제
        </div>
      </div>
      
      {/* 문제 리스트 테이블 */}
      <div className="list-study-table-wrapper">
        <table className="list-study-table">
          <thead>
            <tr>
              <th className="col-num">#</th>
              <th className="col-status">상태</th>
              <th className="col-description">문제</th>
              <th className="col-answer">답 / 선택지</th>
              <th className="col-actions">작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredProblems.map((problem, index) => {
              const progress = progressMap[problem.id];
              const isCompleted = progress?.isCompleted || false;
              const isCorrect = progress?.isCorrect || false;
              const wrongCount = progress?.wrongCount || 0;
              const isRevealed = revealedAnswers.has(problem.id);
              const selectedChoice = selectedChoices.get(problem.id);
              
              return (
                <tr key={problem.id} className={`problem-row ${isCompleted ? 'completed' : ''}`}>
                  {/* 번호 */}
                  <td className="col-num">{problem.sequenceNumber || index + 1}</td>
                  
                  {/* 상태 */}
                  <td className="col-status">
                    <div className="status-badges">
                      {isCompleted && (
                        <span className="badge badge-completed">완료</span>
                      )}
                      {progress?.isCorrect === true && (
                        <span className="badge badge-correct">✓</span>
                      )}
                      {progress?.isCorrect === false && (
                        <span className="badge badge-wrong">✗</span>
                      )}
                      {wrongCount > 0 && (
                        <span className="badge badge-wrong-count">
                          오답 {wrongCount}
                        </span>
                      )}
                    </div>
                  </td>
                  
                  {/* 문제 설명 */}
                  <td className="col-description">
                    <div className="problem-text">{problem.description}</div>
                  </td>
                  
                  {/* 답 / 선택지 */}
                  <td className="col-answer">
                    {problem.isSubjective ? (
                      // 주관식: 스포일러 처리
                      <div className="subjective-answer">
                        {!isRevealed ? (
                          <button 
                            className="spoiler-btn"
                            onClick={() => toggleRevealAnswer(problem)}
                          >
                            🔒 클릭하여 정답 보기
                          </button>
                        ) : (
                          <div className="answer-revealed">
                            <strong>{problem.answer}</strong>
                          </div>
                        )}
                      </div>
                    ) : (
                      // 객관식: 선택지 표시
                      <div className="multiple-choices">
                        {problem.shuffledChoices.map((choice, idx) => {
                          const isSelected = selectedChoice === idx;
                          const isThisCorrect = choice === problem.answer;
                          const showResult = isSelected;
                          
                          return (
                            <button
                              key={idx}
                              className={`choice-btn ${isSelected ? 'selected' : ''} ${showResult && isThisCorrect ? 'correct' : ''} ${showResult && !isThisCorrect ? 'wrong' : ''}`}
                              onClick={() => handleChoiceSelect(problem, idx, problem.shuffledChoices)}
                            >
                              {choice}
                              {showResult && isThisCorrect && ' ✓'}
                              {showResult && !isThisCorrect && ' ✗'}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  
                  {/* 작업 (모든 문제 타입) */}
                  <td className="col-actions">
                    <button
                      className={`toggle-complete-btn ${isCompleted ? 'completed' : ''}`}
                      onClick={() => toggleComplete(problem)}
                    >
                      {isCompleted ? '✓ 완료' : '미완료'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {filteredProblems.length === 0 && (
        <div className="no-results">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
}
