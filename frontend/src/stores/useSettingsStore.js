/**
 * @file useSettingsStore.js
 * @description 사용자 환경 설정(학습 모드, 테마, 글자 크기 등)을 관리하는 Zustand 스토어입니다.
 * 전역 설정 뿐만 아니라 페이지별 임시 글자 크기 조절 기능도 제공합니다.
 */

import { create } from 'zustand';
import { getSettings, saveSettings } from '../utils/storage';

export const useSettingsStore = create((set, get) => ({
  // --- 상태 (State) ---
  settings: {
    mode: 'problem',           // 'explanation' | 'problem'
    orderMode: 'random',       // 'sequential' | 'random'
    repeatMode: false,         // 반복 학습 여부
    questionType: 'multiple',  // 'multiple' | 'subjective'
    cardFront: 'explanation',   // 'explanation' | 'answer' | 'random'
    theme: 'light',            // 'light' | 'dark'
    fontSize: 5                // 1 ~ 10 단계 (기본값 5)
  },
  
  // 현재 페이지에만 적용되는 임시 글자 크기 (null이면 settings.fontSize 사용)
  temporaryFontSize: null,
  
  isLoading: true,

  // --- 액션 (Actions) ---

  /**
   * DB에서 설정을 로드합니다.
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
   * 전역 설정을 업데이트하고 DB에 저장합니다.
   */
  updateSetting: async (key, value) => {
    const newSettings = { ...get().settings, [key]: value };
    set({ settings: newSettings });
    
    // 만약 글자 크기를 변경했는데 임시 크기가 설정되어 있다면, 임시는 해제하지 않고 유지하거나 
    // 사용자의 의도에 따라 초기화할 수 있습니다. 여기서는 명시적 저장 시 임시는 유지합니다.
    
    try {
      await saveSettings(newSettings);
    } catch (error) {
      console.error('설정 저장 실패:', error);
    }
  },

  /**
   * 현재 페이지에서만 적용할 임시 글자 크기를 설정합니다.
   * @param {number} size - 1 ~ 10 단계
   */
  setTemporaryFontSize: (size) => {
    set({ temporaryFontSize: size });
  },

  /**
   * 페이지 이동 시 등을 위해 임시 글자 크기를 기본값으로 되돌립니다.
   */
  resetTemporaryFontSize: () => {
    set({ temporaryFontSize: null });
  }
}));
