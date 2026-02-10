/**
 * @file ListStudy.jsx
 * @description 전체 문제를 리스트 형태로 한눈에 보여주는 학습 모드 컴포넌트입니다.
 * 주관식은 답을 스포일러 처리하고, 객관식은 선택지를 랜덤하게 섞어서 표시합니다.
 */

import { useState, useMemo, useEffect } from 'react';
import { useProgressStore } from '../../stores/useProgressStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useStudyStore } from '../../stores/useStudyStore';
import { chosungIncludes } from '../../utils/chosungUtils';
import toast from 'react-hot-toast';
import './ListStudy.css';

export default function ListStudy({ problems, fileId }) {
  const { progressMap, saveResult } = useProgressStore();
  const { settings } = useSettingsStore();
  const { 
    sessionAnswers, 
    setSessionAnswer, 
    problemChoices 
  } = useStudyStore();
  
  // 상태
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * 답 공개 토글 (주관식용) 및 학습 완료 처리
   */
  const toggleRevealAnswer = async (problem) => {
    const saved = sessionAnswers[problem.id];
    const isRevealing = !(saved?.isRevealed);
    
    // 세션 저장
    setSessionAnswer(problem.id, { isRevealed: isRevealing });

    // 정답을 볼 때 자동으로 완료 처리
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
      isCorrect: currentProgress?.isCorrect ?? null,
      isCompleted: newCompleteStatus
    });
  };
  
  /**
   * 객관식 선택 처리 (정답 체크만, 완료는 별도)
   */
  const handleChoiceSelect = async (problem, choice) => {
    const isCorrect = choice === problem.answer;
    
    // 세션 저장: 선택한 값을 index가 아닌 문자열(choice)로 저장하여 안정성 극대화
    setSessionAnswer(problem.id, { selectedChoice: choice, isCorrect });
    
    // 정답/오답 기록만 저장
    await saveResult(fileId, problem.id, {
      isCorrect,
      isCompleted: false
    });
  };
  
  /**
   * 문제 목록 전처리: 스토어에서 셔플된 보기를 가져와 연결합니다.
   */
  const problemsWithChoices = useMemo(() => {
    return problems.map(problem => {
      const isMultipleChoice = settings.questionType === 'multiple';
      
      // 스토어에서 이미 계산/셔플된 보기를 가져옵니다.
      // (StudyPage에서 startSession 호출 시점에 이미 준비됨)
      const choices = problemChoices[problem.id] || [];
      
      return { 
        ...problem, 
        shuffledChoices: choices, 
        isSubjective: !isMultipleChoice 
      };
    });
  }, [problems, settings.questionType, problemChoices]);
  
  /**
   * 검색 필터링
   */
  const filteredProblems = useMemo(() => {
    if (!searchQuery.trim()) return problemsWithChoices;
    
    const query = searchQuery.toLowerCase();
    
    return problemsWithChoices.filter(problem => {
      const desc = problem.description.toLowerCase();
      const ans = problem.answer.toLowerCase();
      const choicesText = (problem.shuffledChoices || []).map(c => c.toLowerCase()).join(' ');
      
      const exactMatch = desc.includes(query) || ans.includes(query) || choicesText.includes(query);
      const chosungMatch = chosungIncludes(problem.description, query) ||
                          chosungIncludes(problem.answer, query) ||
                          (problem.shuffledChoices || []).some(c => chosungIncludes(c, query));
      
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
              const wrongCount = progress?.wrongCount || 0;
              
              const saved = sessionAnswers[problem.id] || {};
              const isRevealed = saved.isRevealed || false;
              const selectedChoice = saved.selectedChoice || null;
              
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
                          const isSelected = selectedChoice === choice;
                          const isThisCorrect = choice === problem.answer;
                          const showResult = isSelected;
                          
                          return (
                            <button
                              key={idx}
                              className={`choice-btn ${isSelected ? 'selected' : ''} ${showResult && isThisCorrect ? 'correct' : ''} ${showResult && !isThisCorrect ? 'wrong' : ''}`}
                              onClick={() => handleChoiceSelect(problem, choice)}
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
