/**
 * @file useSettingsStore.js
 * @description 사용자 환경 설정(학습 모드, 문제 순서, 반복 여부 등)을 관리하는 Zustand 스토어입니다.
 */

import { create } from 'zustand';
import { getSettings, saveSettings } from '../utils/storage';

export const useSettingsStore = create((set, get) => ({
  // --- 상태 (State) ---
  settings: {
    mode: 'problem',           // 'explanation' (설명/카드) | 'problem' (시험/퀴즈)
    orderMode: 'random',       // 'sequential' (순서대로) | 'random' (무작위)
    repeatMode: false,         // 반복 학습 모드 여부
    questionType: 'multiple',  // 'multiple' (객관식) | 'subjective' (주관식)
    cardFront: 'explanation'   // 카드 앞면 기준: 'explanation' (문제) | 'answer' (정답) | 'random' (번갈아)
  },
  isLoading: true,             // 초기 설정값 로딩 대기 상태

  // --- 액션 (Actions) ---

  /**
   * 데이터베이스(IndexedDB)에 저장된 사용자 설정을 불러옵니다.
   */
  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const saved = await getSettings();
      set({ settings: saved, isLoading: false });
    } catch (error) {
      console.error('설정 로드 실패:', error);
      set({ isLoading: false });
    }
  },

  /**
   * 특정 설정 항목의 값을 변경하고 즉시 데이터베이스에 영구 저장합니다.
   * @param {string} key - 변경할 설정 키 (예: 'mode', 'orderMode')
   * @param {any} value - 새로 적용할 값
   */
  updateSetting: async (key, value) => {
    const newSettings = { ...get().settings, [key]: value };
    
    // 1. 전역 상태 즉시 업데이트
    set({ settings: newSettings });
    
    // 2. DB에 동기화
    try {
      await saveSettings(newSettings);
    } catch (error) {
      console.error('설정 저장 실패:', error);
    }
  }
}));
