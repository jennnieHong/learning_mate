/**
 * @file useProgressStore.js
 * @description 학습 진행 상황(정답 여부, 완료 상태, 오답 횟수 등)을 관리하는 Zustand 스토어입니다.
 */

import { create } from 'zustand';
import { progressDB } from '../utils/storage';

export const useProgressStore = create((set, get) => ({
  // --- 상태 (State) ---
  progressMap: {},        // 모든 문제의 진행 데이터를 담은 맵 { problemId: progressData }
  isLoading: false,       // 데이터 로드 중 여부
  
  // --- 액션 (Actions) ---

  /**
   * 데이터베이스에 저장된 모든 문제의 진행 상황을 한 번에 로드합니다.
   * 메인 화면의 대시보드(오답 개수 계산 등)에서 사용됩니다.
   */
  loadAllProgress: async () => {
    set({ isLoading: true });
    try {
      const progressMap = {};
      await progressDB.iterate((value) => {
        progressMap[value.problemId] = value;
      });
      set({ progressMap, isLoading: false });
    } catch (error) {
      console.error('전체 진행 상황 로드 실패:', error);
      set({ isLoading: false });
    }
  },

  /**
   * 특정 파일에 속한 문제들의 진행 상황을 로드합니다.
   * @param {string} fileId - 파일 ID
   */
  loadProgress: async (fileId) => {
    set({ isLoading: true });
    try {
      const currentProgress = {};
      await progressDB.iterate((value) => {
        if (value.fileSetId === fileId) {
          currentProgress[value.problemId] = value;
        }
      });
      
      // 기존 맵과 병합하여 상태 유지
      set((state) => ({ 
        progressMap: { ...state.progressMap, ...currentProgress }, 
        isLoading: false 
      }));
    } catch (error) {
      console.error('진행 상황 로드 실패:', error);
      set({ isLoading: false });
    }
  },

  /**
   * 특정 문제의 학습 결과를 기록합니다.
   * @param {string} fileSetId - 파일 ID
   * @param {string} problemId - 문제 ID
   * @param {boolean|object} isCorrectOrOptions - 정답 여부 (boolean) 또는 옵션 객체 {isCorrect, isCompleted}
   */
  saveResult: async (fileSetId, problemId, isCorrectOrOptions) => {
    // 1. 기존 진행 데이터 조회
    const existing = await progressDB.getItem(problemId);
    
    // 2. 매개변수 타입에 따라 처리
    let isCorrect, isCompleted;
    if (typeof isCorrectOrOptions === 'boolean') {
      // 기존 방식: boolean만 전달 (하위 호환성)
      isCorrect = isCorrectOrOptions;
      isCompleted = true;
    } else {
      // 새로운 방식: 객체 전달
      isCorrect = isCorrectOrOptions.isCorrect;
      isCompleted = isCorrectOrOptions.isCompleted !== undefined 
        ? isCorrectOrOptions.isCompleted 
        : true;
    }
    
    // 3. 새 데이터 생성 또는 기존 데이터 업데이트
    const newProgress = {
      id: existing?.id || crypto.randomUUID(),
      fileSetId,
      problemId,
      isCompleted,
      isCorrect,
      // wrongCount는 명시적으로 오답이고, 기존에 오답 기록이 없을 때만 증가
      // (같은 문제를 여러 번 틀려도 1번만 카운트)
      wrongCount: (isCorrect === false && !existing?.wrongCount) 
        ? 1 
        : (existing?.wrongCount || 0),
      lastAttemptedAt: new Date().toISOString()
    };
    
    // 4. DB 및 상태 반영
    await progressDB.setItem(problemId, newProgress);
    set((state) => ({
      progressMap: { ...state.progressMap, [problemId]: newProgress }
    }));
  },

  /**
   * 특정 문제를 '완료' 또는 '미완료' 상태로 전환합니다 (Flip Card 모드에서 사용).
   * @param {string} fileSetId - 파일 ID
   * @param {string} problemId - 문제 ID
   * @param {boolean} isCompleted - 완료 여부
   */
  toggleComplete: async (fileSetId, problemId, isCompleted) => {
    const existing = await progressDB.getItem(problemId);
    
    const newProgress = {
      id: existing?.id || crypto.randomUUID(),
      fileSetId,
      problemId,
      isCompleted,
      isCorrect: existing?.isCorrect ?? null,
      wrongCount: existing?.wrongCount || 0,
      lastAttemptedAt: existing?.lastAttemptedAt || null,
      completedAt: isCompleted ? new Date().toISOString() : null
    };
    
    await progressDB.setItem(problemId, newProgress);
    set((state) => ({
      progressMap: { ...state.progressMap, [problemId]: newProgress }
    }));
  },

  /**
   * 특정 파일의 모든 진행 데이터를 초기화합니다.
   * @param {string} fileId - 초기화할 파일 ID
   */
  resetProgress: async (fileId) => {
    const keysToDelete = [];
    await progressDB.iterate((value, key) => {
      if (value.fileSetId === fileId) {
        keysToDelete.push(key);
      }
    });

    for (const key of keysToDelete) {
      await progressDB.removeItem(key);
    }

    // 상태에서 제거
    set((state) => {
      const newMap = { ...state.progressMap };
      keysToDelete.forEach(key => delete newMap[key]);
      return { progressMap: newMap };
    });
  },

  /**
   * 특정 문제의 개별 진행 데이터를 초기화합니다.
   * @param {string} problemId - 초기화할 문제 ID
   */
  resetProblemProgress: async (problemId) => {
    await progressDB.removeItem(problemId);
    set((state) => {
      const newMap = { ...state.progressMap };
      delete newMap[problemId];
      return { progressMap: newMap };
    });
  },

  /**
   * [시딩/이동용] 대량의 진행 정보를 한 번에 저장합니다.
   * @param {Array} progressItems - { fileSetId, problemId, isCompleted, wrongCount } 배열
   */
  bulkSaveProgress: async (progressItems) => {
    if (!progressItems || progressItems.length === 0) return;
    
    const newProgressMap = { ...get().progressMap };
    
    for (const item of progressItems) {
      const { fileSetId, problemId, isCompleted, wrongCount } = item;
      
      const progressData = {
        id: crypto.randomUUID(),
        fileSetId,
        problemId,
        isCompleted: !!isCompleted,
        isCorrect: null, // 직접 기록 전까지는 알 수 없음
        wrongCount: parseInt(wrongCount, 10) || 0,
        lastAttemptedAt: isCompleted ? new Date().toISOString() : null,
        completedAt: isCompleted ? new Date().toISOString() : null
      };
      
      await progressDB.setItem(problemId, progressData);
      newProgressMap[problemId] = progressData;
    }
    
    set({ progressMap: newProgressMap });
  }
}));
