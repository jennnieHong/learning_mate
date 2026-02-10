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
import ListStudy from '../components/Study/ListStudy';
import { FontScaleWidget } from '../components/Common/FontScaleWidget';
import toast, { Toaster } from 'react-hot-toast';
import './StudyPage.css';

export default function StudyPage() {
  const { fileId } = useParams();
  const navigate = useNavigate();
  
  // 스토어로부터 학습에 필요한 상태/함수 추출
  const { 
    currentFile, 
    selectFile, 
    loadAggregatedReview, 
    loadAggregatedAll, 
    isLoading: isFileLoading 
  } = useFileStore();
  const { settings, loadSettings, isLoading: isSettingsLoading } = useSettingsStore();
  const { saveResult, toggleComplete, progressMap, loadProgress, loadAllProgress, isLoading: isProgressLoading } = useProgressStore();

  // --- 내부 상태 (Local State) ---
  const [currentIndex, setCurrentIndex] = useState(0);       // 현재 풀고 있는 문제의 인덱스
  const [quizResults, setQuizResults] = useState([]);        // 이번 세션의 정답/오답 기록
  const [isFinished, setIsFinished] = useState(false);       // 학습 종료 여부
  const [shuffledProblems, setShuffledProblems] = useState([]); // (랜덤 모드일 경우) 섞인 문제 목록
  
  // 새로고침 시에도 필터 상태 유지 (sessionStorage 활용)
  const [activeFilters, setActiveFilters] = useState(() => {
    const saved = sessionStorage.getItem('study_active_filters');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    sessionStorage.setItem('study_active_filters', JSON.stringify(activeFilters));
  }, [activeFilters]);
  
  // 주관식 퀴즈용 상태
  const [isRevealed, setIsRevealed] = useState(false);
  const [localIsAnswered, setLocalIsAnswered] = useState(false);

  /**
   * 초기 설정 및 데이터 로딩
   */
  useEffect(() => {
    loadSettings();
    if (fileId === 'aggregated-review') {
      loadAllProgress();
      loadAggregatedReview();
    } else if (fileId === 'aggregated-all') {
      loadAllProgress();
      loadAggregatedAll();
    } else if (fileId) {
      selectFile(fileId);
      loadProgress(fileId);
    }
  }, [fileId]);

  /**
   * 문제가 로드되거나 필터/순서 설정이 변경되면 문제 배열을 준비합니다.
   * 모든 데이터(파일, 설정, 진행 상황)가 준비된 시점에 실행되도록 종속성을 강화했습니다.
   */
  useEffect(() => {
    // 필수 데이터가 로드 중이거나 없는 경우 건너뜁니다.
    if (!currentFile?.problems || isFileLoading || isProgressLoading || isSettingsLoading) {
      return;
    }

    let filtered = [...currentFile.problems];
    
    // 1. 진행 상태 기반 다중 필터링 적용 (단순 OR 논리: 선택된 필터 중 하나라도 해당되면 표시)
    if (activeFilters.length > 0) {
      filtered = filtered.filter(p => {
        const prog = progressMap[p.id];
        
        return activeFilters.some(filter => {
          if (filter === 'wrong') return (prog?.wrongCount || 0) > 0;
          if (filter === 'correct') return prog?.isCorrect === true;
          if (filter === 'incomplete') return !prog?.isCompleted;
          if (filter === 'complete') return prog?.isCompleted;
          return false;
        });
      });
    }

    // 2. 순서 모드(순차/랜덤) 적용
    if (!currentFile.isReviewMode && settings.orderMode === 'random') {
      filtered = filtered.sort(() => Math.random() - 0.5);
    }
    
    setShuffledProblems(filtered);
    setCurrentIndex(0);
    setQuizResults([]);
    setIsFinished(false);
    setIsRevealed(false);
    setLocalIsAnswered(false);
  }, [
    currentFile?.id, 
    currentFile?.problems, 
    settings.orderMode, 
    activeFilters, 
    isProgressLoading, 
    isFileLoading, 
    isSettingsLoading,
    progressMap
  ]);

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
    return currentFile.problems.map(p => ({
      answer: p.answer,
      isCalculation: p.description?.includes('[계산]')
    }));
  }, [currentFile]);

  /**
   * 주관식/객관식 퀴즈 정답 제출 시 호출되는 핸들러입니다.
   * @param {boolean} isCorrect - 정답 여부
   */
  const handleAnswer = async (isCorrect) => {
    if (localIsAnswered) return;
    
    const problemId = currentProblem.id;
    const fileSetId = currentProblem.fileSetId;

    // 1. 상태 업데이트 (주관식일 때 시각적 피드백 위해)
    setLocalIsAnswered(true);

    // 2. DB 및 스토어에 결과 저장
    await saveResult(fileSetId, problemId, isCorrect);
    
    // 3. 현재 세션 기록 업데이트
    setQuizResults([...quizResults, { problemId, isCorrect }]);

    // 4. 다음 문제로 이동 또는 학습 종료 (속도 개선: 딜레이 단축)
    setTimeout(() => {
      if (currentIndex < totalCount - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsRevealed(false);
        setLocalIsAnswered(false);
      } else {
        setIsFinished(true);
      }
    }, quizResults.length > 0 ? 200 : 300); 
  };

  /**
   * 필터 토글 핸들러
   */
  const toggleFilter = (filter) => {
    setActiveFilters(prev => {
      if (filter === 'all') return [];
      if (prev.includes(filter)) return prev.filter(f => f !== filter);
      return [...prev, filter];
    });
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
    setIsRevealed(false);
    setLocalIsAnswered(false);
  };

  // 데이터가 없거나 필터 결과가 없는 경우 처리
  if (isFileLoading || isSettingsLoading || isProgressLoading) return <div className="loading">준비 중...</div>;
  if (!currentFile) return <div className="error">파일 정보를 찾을 수 없습니다. 혹시 삭제되었거나 정보를 불러오는 데 실패했을 수 있습니다.</div>;
  
  if (shuffledProblems.length === 0) {
    return (
      <div className="study-page">
        <header className="study-header">
          <button className="back-btn" onClick={() => navigate('/')} title="홈으로">🏠 홈</button>
          <div className="study-info"><h3>{currentFile.originalFilename}</h3></div>
          <div className="study-filters">
            <div className="filter-group">
              <button 
                className={`filter-btn ${activeFilters.length === 0 ? 'active' : ''}`}
                onClick={() => toggleFilter('all')}
              >
                전체 ({currentFile.problems?.length})
              </button>
              <button 
                className={`filter-btn ${activeFilters.includes('wrong') ? 'active' : ''}`}
                onClick={() => toggleFilter('wrong')}
              >
                ❌ 오답 ({currentFile.problems?.filter(p => (progressMap[p.id]?.wrongCount || 0) > 0).length})
              </button>
              <button 
                className={`filter-btn ${activeFilters.includes('correct') ? 'active' : ''}`}
                onClick={() => toggleFilter('correct')}
              >
                ✅ 정답 ({currentFile.problems?.filter(p => progressMap[p.id]?.isCorrect === true).length})
              </button>
              <button 
                className={`filter-btn ${activeFilters.includes('incomplete') ? 'active' : ''}`}
                onClick={() => toggleFilter('incomplete')}
              >
                📖 미완료 ({currentFile.problems?.filter(p => !progressMap[p.id]?.isCompleted).length})
              </button>
              <button 
                className={`filter-btn ${activeFilters.includes('complete') ? 'active' : ''}`}
                onClick={() => toggleFilter('complete')}
              >
                🏁 완료 ({currentFile.problems?.filter(p => progressMap[p.id]?.isCompleted).length})
              </button>
            </div>
          </div>
          <button className="settings-shortcut" onClick={() => navigate('/settings')} title="학습 설정">
            ⚙️
          </button>
        </header>
        <div className="empty-filter-result">
          <div className="empty-icon">✨</div>
          <p>조건에 맞는 문제가 없습니다.</p>
          <button className="header-btn primary" onClick={() => setActiveFilters([])}>필터 초기화 (전체 보기)</button>
        </div>
      </div>
    );
  }

  // 리스트 모드 렌더링
  if (settings.mode === 'list') {
    return (
      <div className="study-page">
        <Toaster />
        <header className="study-header">
          <button className="back-btn" onClick={() => navigate('/')} title="학습 중단 및 홈으로">
            🏠 홈
          </button>
          <div className="study-info">
            <h3>{currentFile.originalFilename}</h3>
          </div>
          <div className="study-filters">
            <div className="filter-group">
              <button 
                className={`filter-btn ${activeFilters.length === 0 ? 'active' : ''}`}
                onClick={() => toggleFilter('all')}
              >
                전체 ({currentFile.problems?.length})
              </button>
              <button 
                className={`filter-btn ${activeFilters.includes('wrong') ? 'active' : ''}`}
                onClick={() => toggleFilter('wrong')}
              >
                ❌ 오답 ({currentFile.problems?.filter(p => (progressMap[p.id]?.wrongCount || 0) > 0).length})
              </button>
              <button 
                className={`filter-btn ${activeFilters.includes('correct') ? 'active' : ''}`}
                onClick={() => toggleFilter('correct')}
              >
                ✅ 정답 ({currentFile.problems?.filter(p => progressMap[p.id]?.isCorrect === true).length})
              </button>
              <button 
                className={`filter-btn ${activeFilters.includes('incomplete') ? 'active' : ''}`}
                onClick={() => toggleFilter('incomplete')}
              >
                📖 미완료 ({currentFile.problems?.filter(p => !progressMap[p.id]?.isCompleted).length})
              </button>
              <button 
                className={`filter-btn ${activeFilters.includes('complete') ? 'active' : ''}`}
                onClick={() => toggleFilter('complete')}
              >
                🏁 완료 ({currentFile.problems?.filter(p => progressMap[p.id]?.isCompleted).length})
              </button>
            </div>
          </div>
          <FontScaleWidget />
          <button className="settings-shortcut" onClick={() => navigate('/settings')} title="학습 설정">
            ⚙️
          </button>
        </header>
        <main className="study-content">
          <ListStudy problems={shuffledProblems} fileId={fileId} />
        </main>
      </div>
    );
  }

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
              (완료: {currentFile.problems?.filter(p => progressMap[p.id]?.isCompleted).length || 0}개)
            </div>
            <div className="progress-bar-mini">
              <div 
                className="progress-fill" 
                style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="study-filters">
          <div className="filter-group">
            <button 
              className={`filter-btn ${activeFilters.length === 0 ? 'active' : ''}`}
              onClick={() => toggleFilter('all')}
            >
              전체 ({currentFile.problems?.length})
            </button>
            <button 
              className={`filter-btn ${activeFilters.includes('wrong') ? 'active' : ''}`}
              onClick={() => toggleFilter('wrong')}
            >
              ❌ 오답 ({currentFile.problems?.filter(p => (progressMap[p.id]?.wrongCount || 0) > 0).length})
            </button>
            <button 
              className={`filter-btn ${activeFilters.includes('correct') ? 'active' : ''}`}
              onClick={() => toggleFilter('correct')}
            >
              ✅ 정답 ({currentFile.problems?.filter(p => progressMap[p.id]?.isCorrect === true).length})
            </button>
            <button 
              className={`filter-btn ${activeFilters.includes('incomplete') ? 'active' : ''}`}
              onClick={() => toggleFilter('incomplete')}
            >
              📖 미완료 ({currentFile.problems?.filter(p => !progressMap[p.id]?.isCompleted).length})
            </button>
            <button 
              className={`filter-btn ${activeFilters.includes('complete') ? 'active' : ''}`}
              onClick={() => toggleFilter('complete')}
            >
              🏁 완료 ({currentFile.problems?.filter(p => progressMap[p.id]?.isCompleted).length})
            </button>
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
              key={currentProblem.id}
              problem={currentProblem} 
              cardFront={settings.cardFront}
            />
          </div>
        ) : (
          /* [문제 모드: 퀴즈] */
          <MultipleChoice 
            problem={currentProblem}
            questionType={settings.questionType}
            onAnswer={handleAnswer}
            answerPool={answerPool}
            isRevealed={isRevealed}
            isAnswered={localIsAnswered}
          />
        )}
      </main>

      {/* 하단 고정 액션 바 */}
      <footer className="study-action-bar">
        <div className="bar-container">
          <button 
            className="action-nav-btn" 
            disabled={currentIndex === 0}
            onClick={() => {
              setCurrentIndex(currentIndex - 1);
              setIsRevealed(false);
              setLocalIsAnswered(false);
            }}
          >
            이전
          </button>

          <div className="center-actions">
            {settings.mode === 'explanation' ? (
              <button 
                className={`action-check-btn ${progressMap[currentProblem.id]?.isCompleted ? 'active' : ''}`}
                onClick={() => handleToggleComplete(!progressMap[currentProblem.id]?.isCompleted)}
              >
                {progressMap[currentProblem.id]?.isCompleted ? '✅ 완료' : '📑 완료 체크'}
              </button>
            ) : settings.questionType === 'subjective' ? (
              !isRevealed ? (
                <button className="action-reveal-btn" onClick={() => setIsRevealed(true)}>
                  🔒 정답 보기
                </button>
              ) : !localIsAnswered ? (
                <div className="self-check-group">
                  <button className="self-btn correct" onClick={() => handleAnswer(true)}>👍 맞음</button>
                  <button className="self-btn wrong" onClick={() => handleAnswer(false)}>👎 틀림</button>
                </div>
              ) : (
                <div className="action-status">기록 중...</div>
              )
            ) : null}
          </div>

          {currentIndex < totalCount - 1 ? (
            <button 
              className="action-nav-btn primary"
              onClick={() => {
                setCurrentIndex(currentIndex + 1);
                setIsRevealed(false);
                setLocalIsAnswered(false);
              }}
            >
              다음
            </button>
          ) : (
            <button className="action-nav-btn finish" onClick={() => setIsFinished(true)}>
              종료
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
