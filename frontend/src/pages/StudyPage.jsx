/**
 * @file StudyPage.jsx
 * @description 실제 학습이 진행되는 페이지입니다.
 * 설정된 모드(설명/퀴즈)와 순서(순차/랜덤)에 따라 문제를 출제하고 진행 상황을 업데이트합니다.
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFileStore } from '../stores/useFileStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useProgressStore } from '../stores/useProgressStore';
import { FlipCard } from '../components/Card/FlipCard';
import { MultipleChoice } from '../components/Quiz/MultipleChoice';
import { QuizResult } from '../components/Quiz/QuizResult';
import { FontScaleWidget } from '../components/Common/FontScaleWidget';
import toast, { Toaster } from 'react-hot-toast';
import './StudyPage.css';

export default function StudyPage() {
  const { fileId } = useParams();
  const navigate = useNavigate();
  
  // 스토어로부터 학습에 필요한 상태/함수 추출
  const { currentFile, selectFile, isLoading: isFileLoading } = useFileStore();
  const { settings, loadSettings, isLoading: isSettingsLoading } = useSettingsStore();
  const { saveResult, toggleComplete, progressMap, loadProgress, isLoading: isProgressLoading } = useProgressStore();

  // --- 내부 상태 (Local State) ---
  const [currentIndex, setCurrentIndex] = useState(0);       // 현재 풀고 있는 문제의 인덱스
  const [quizResults, setQuizResults] = useState([]);        // 이번 세션의 정답/오답 기록
  const [isFinished, setIsFinished] = useState(false);       // 학습 종료 여부
  const [shuffledProblems, setShuffledProblems] = useState([]); // (랜덤 모드일 경우) 섞인 문제 목록

  /**
   * 초기 설정 및 데이터 로딩
   */
  useEffect(() => {
    loadSettings();
    if (fileId !== 'aggregated-review') {
      selectFile(fileId);
      loadProgress(fileId);
    }
  }, [fileId]);

  /**
   * 문제가 로드되면 설정된 순서 모드(순차/랜덤)에 따라 문제 배열을 준비합니다.
   */
  useEffect(() => {
    if (currentFile?.problems) {
      let filtered = [...currentFile.problems];
      
      // 오답 모드가 아니고 랜덤 모드라면 셔플
      if (!currentFile.isReviewMode && settings.orderMode === 'random') {
        filtered = filtered.sort(() => Math.random() - 0.5);
      }
      
      setShuffledProblems(filtered);
      setCurrentIndex(0);
      setQuizResults([]);
      setIsFinished(false);
    }
  }, [currentFile, settings.orderMode]);

  // 현재 활성화된 문제 객체
  const currentProblem = shuffledProblems[currentIndex];
  // 전체 문제 수
  const totalCount = shuffledProblems.length;

  /**
   * [자동 보기 생성을 위한 정답 풀 생성]
   * 현재 파일에 들어있는 모든 문제의 정답 목록을 추출합니다.
   * MultipleChoice 컴포넌트에서 보기가 없을 때 오답 보기를 생성하는 용도로 사용됩니다.
   */
  const answerPool = useMemo(() => {
    if (!currentFile?.problems) return [];
    return currentFile.problems.map(p => p.answer);
  }, [currentFile]);

  /**
   * 주관식/객관식 퀴즈 정답 제출 시 호출되는 핸들러입니다.
   * @param {boolean} isCorrect - 정답 여부
   */
  const handleAnswer = async (isCorrect) => {
    const problemId = currentProblem.id;
    const fileSetId = currentProblem.fileSetId;

    // 1. DB 및 스토어에 결과 저장
    await saveResult(fileSetId, problemId, isCorrect);
    
    // 2. 현재 세션 기록 업데이트
    setQuizResults([...quizResults, { problemId, isCorrect }]);

    // 3. 다음 문제로 이동 또는 학습 종료
    if (currentIndex < totalCount - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFinished(true);
    }
  };

  /**
   * 설명(카드 뒤집기) 모드에서 '완료/미완료' 상태를 토글합니다.
   * @param {boolean} completed - 완료 상태값
   */
  const handleToggleComplete = async (completed) => {
    await toggleComplete(currentProblem.fileSetId, currentProblem.id, completed);
    
    // 설명 모드에서는 상태 표시를 위해 세션 기록에도 남김
    const newResults = [...quizResults];
    const existingIdx = newResults.findIndex(r => r.problemId === currentProblem.id);
    if (existingIdx > -1) {
      newResults[existingIdx] = { ...newResults[existingIdx], isCompleted: completed };
    } else {
      newResults.push({ problemId: currentProblem.id, isCompleted: completed });
    }
    setQuizResults(newResults);
  };

  /**
   * 처음부터 다시 학습하기를 눌렀을 때의 처리입니다.
   */
  const handleRestart = () => {
    if (settings.orderMode === 'random') {
      setShuffledProblems([...shuffledProblems].sort(() => Math.random() - 0.5));
    }
    setCurrentIndex(0);
    setQuizResults([]);
    setIsFinished(false);
  };

  // 로딩 상태 처리
  if (isFileLoading || isSettingsLoading) return <div className="loading">준비 중...</div>;
  if (!currentFile || !currentProblem) return <div className="error">문제를 찾을 수 없습니다.</div>;

  // 결과 화면 렌더링
  if (isFinished) {
    return (
      <QuizResult 
        results={quizResults} 
        total={totalCount} 
        onRestart={handleRestart}
        filename={currentFile.originalFilename}
      />
    );
  }

  return (
    <div className="study-page">
      <Toaster />
      <header className="study-header">
        <button className="back-btn" onClick={() => navigate('/')} title="학습 중단 및 홈으로">
          🏠 홈
        </button>
        <div className="study-info">
          <h3>{currentFile.originalFilename}</h3>
          <div className="progress-indicator">
            <div className="progress-text">
              진행: {currentIndex + 1} / {totalCount} 
              (완료: {Object.values(progressMap).filter(p => p.fileSetId === currentFile.id && p.isCompleted).length}개)
            </div>
            <div className="progress-bar-mini">
              <div 
                className="progress-fill" 
                style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        <button className="settings-shortcut" onClick={() => navigate('/settings')} title="학습 설정">
          ⚙️
        </button>
      </header>

      <main className="study-content">
        {settings.mode === 'explanation' ? (
          /* [설명 모드: 카드 뒤집기] */
          <div className="explanation-view">
            <FlipCard 
              problem={currentProblem} 
              cardFront={settings.cardFront}
            />
            
            <div className="card-controls">
              <button 
                className="nav-btn prev" 
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(currentIndex - 1)}
              >
                ◀ 이전
              </button>
              
              <div className="status-actions">
                <button 
                  className={`complete-btn ${progressMap[currentProblem.id]?.isCompleted ? 'active' : ''}`}
                  onClick={() => handleToggleComplete(!progressMap[currentProblem.id]?.isCompleted)}
                >
                  {progressMap[currentProblem.id]?.isCompleted ? '✅ 완료됨' : '📑 완료 체크'}
                </button>
              </div>

              <button 
                className="nav-btn next"
                disabled={currentIndex === totalCount - 1}
                onClick={() => setCurrentIndex(currentIndex + 1)}
              >
                다음 ▶
              </button>
            </div>
            
            {currentIndex === totalCount - 1 && (
              <button className="finish-btn" onClick={() => setIsFinished(true)}>
                🏁 학습 종료
              </button>
            )}
          </div>
        ) : (
          /* [문제 모드: 퀴즈] */
          <MultipleChoice 
            problem={currentProblem}
            questionType={settings.questionType}
            onAnswer={handleAnswer}
            answerPool={answerPool} // 보기가 없는 경우를 위해 정답 풀 전달
          />
        )}
      </main>
      <FontScaleWidget />
    </div>
  );
}
