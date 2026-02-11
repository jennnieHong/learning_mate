/**
 * @file useStudyStore.js
 * @description 학습 세션 전역 상태(문제 순서, 현재 인덱스, 세션 내 답변 기록 등)를 관리합니다.
 * 이 스토어의 데이터는 페이지 이동(설정 등) 중에도 유지되며, 홈 화면으로 이동 시 초기화됩니다.
 */

import { create } from 'zustand';

/**
 * [결정론적 셔플] 세션 시드를 기반으로 배열을 항상 동일한 무작위 순서로 섞습니다.
 */
const deterministicShuffle = (array, seed) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.abs(seed + i) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const useStudyStore = create((set, get) => ({
  // --- 상태 (State) ---
  fileId: null,             // 현재 학습 중인 파일 ID (또는 aggregated ID)
  shuffledProblems: [],     // 현재 세션의 (섞인) 문제 목록
  currentIndex: 0,          // 현재 진행 중인 인덱스
  sessionAnswers: {},       // 세션 내 답변 기록 { problemId: { selectedChoice, isCorrect } }
  problemChoices: {},       // 각 문제의 셔플된 선택지 { problemId: choices[] }
  orderMode: null,          // 세션 시작 당시의 순서 모드
  activeFilters: [],        // 세션 시작 당시의 필터
  sessionID: null,          // 세션 고유 ID (상태 초기화 강제용)

  // --- 액션 (Actions) ---

  /**
   * 새로운 학습 세션을 시작합니다.
   * 기존 세션과 조건(파일, 모드, 필터)이 같으면 기존 상태를 유지합니다.
   */
  startSession: (fileId, problems, orderMode, filters, answerPool = []) => {
    const state = get();
    const filterKey = JSON.stringify(filters);
    
    if (
      state.fileId === fileId && 
      state.orderMode === orderMode && 
      JSON.stringify(state.activeFilters) === filterKey
    ) {
      return;
    }

    const { sortedProblems, problemChoices } = prepareProblemsAndChoices(fileId, problems, orderMode, answerPool);

    set({
      fileId,
      shuffledProblems: sortedProblems,
      currentIndex: 0,
      sessionAnswers: {},
      problemChoices,
      orderMode,
      activeFilters: filters,
      sessionID: Date.now(),
    });
  },

  /**
   * 진행 중인 세션을 강제로 초기화하고 다시 시작합니다.
   */
  restartSession: (fileId, problems, orderMode, filters, answerPool = []) => {
    const { sortedProblems, problemChoices } = prepareProblemsAndChoices(fileId, problems, orderMode, answerPool, true);

    set({
      fileId,
      shuffledProblems: sortedProblems,
      currentIndex: 0,
      sessionAnswers: {},
      problemChoices,
      orderMode,
      activeFilters: filters,
      sessionID: Date.now(),
    });
  },

  /**
   * 현재 인덱스를 업데이트합니다.
   */
  setCurrentIndex: (index) => {
    if (index >= 0 && index < get().shuffledProblems.length) {
      set({ currentIndex: index });
    }
  },

  /**
   * 특정 문제에 대한 사용자의 선택/답변을 기록합니다 (병합 수행).
   */
  setSessionAnswer: (problemId, answerData) => {
    set((state) => ({
      sessionAnswers: {
        ...state.sessionAnswers,
        [problemId]: { 
          ...(state.sessionAnswers[problemId] || {}), 
          ...answerData 
        }
      }
    }));
  },

  /**
   * 모든 세션 데이터를 초기화합니다.
   */
  clearSession: () => {
    set({
      fileId: null,
      shuffledProblems: [],
      currentIndex: 0,
      sessionAnswers: {},
      problemChoices: {},
      orderMode: null,
      activeFilters: [],
    });
  }
}));

/**
 * [내부 유틸리티] 문제 목록과 선택지를 준비합니다.
 */
function prepareProblemsAndChoices(fileId, problems, orderMode, answerPool, forceNewSeed = false) {
  let sortedProblems = [...problems];
  // 세션 시드 (fileId가 없으면 빈 문자열 기초로 계산하여 에러 방지)
  const safeFileId = String(fileId || '');
  const sessionSeed = safeFileId.split('').reduce((acc, char) => acc + char.charCodeAt(0), forceNewSeed ? Date.now() : 0);

  // 1. 문제 순서 결정론적 셔플
  if (orderMode === 'random') {
    sortedProblems = deterministicShuffle(sortedProblems, sessionSeed);
  }

  // 2. 각 문제별 선택지 생성 및 셔플 (고정)
  const problemChoices = {};
  sortedProblems.forEach(problem => {
    let finalChoices = [];
    // 문제 ID 기반의 고유 시드 (방어적 코드 추가)
    const safeProblemId = String(problem.id || Math.random());
    const problemSeed = safeProblemId.split('').reduce((acc, char) => acc + char.charCodeAt(0), sessionSeed);

    if (problem.choices && problem.choices.length > 0) {
      finalChoices = [...problem.choices];
      const normalizedAnswer = problem.answer.trim().toLowerCase();
      if (!finalChoices.some(c => c.trim().toLowerCase() === normalizedAnswer)) {
        finalChoices.push(problem.answer);
      }
    } else if (answerPool.length > 0) {
      const isCurrentCalculation = problem.description?.includes('[계산]');
      const currentAnswerRef = problem.answer.trim().toLowerCase();
      const filteredPool = answerPool.filter(p => !!p.isCalculation === !!isCurrentCalculation);
      const uniqueAnswers = [...new Set(filteredPool.map(p => p.answer.trim()))].sort();
      const otherAnswers = uniqueAnswers.filter(ans => ans.toLowerCase() !== currentAnswerRef);
      const fakeChoices = deterministicShuffle(otherAnswers, problemSeed).slice(0, 3);
      finalChoices = [problem.answer, ...fakeChoices];
    }

    const uniqueAndSorted = [...new Set(finalChoices.map(c => c.trim()))].sort();
    problemChoices[problem.id] = deterministicShuffle(uniqueAndSorted, problemSeed);
  });

  return { sortedProblems, problemChoices };
}
