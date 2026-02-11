/**
 * @file useSettingsStore.js
 * @description 사용자 환경 설정(학습 모드, 테마, 글자 크기 등)을 관리하는 Zustand 스토어입니다.
 * 전역 설정 뿐만 아니라 페이지별 임시 글자 크기 조절 기능도 제공합니다.
 */

import { create } from 'zustand';
import { getSettings, saveSettings } from '../utils/storage';

const DEFAULT_SETTINGS = {
  mode: 'problem',           // 'explanation' | 'problem'
  orderMode: 'random',       // 'sequential' | 'random'
  repeatMode: false,         // 반복 학습 여부
  questionType: 'multiple',  // 'multiple' | 'subjective'
  cardFront: 'explanation',   // 'explanation' | 'answer' | 'random'
  theme: 'light',            // 'light' | 'dark'
  fontSize: 2,               // 1 ~ 20 단계 (기본값 8, 1.2배)
  cardColor: 'indigo',       // indigo, ocean, forest, sunset, rose, slate
  cardHue: 239,
  cardSaturation: 70,        // 0 ~ 100
  cardLightness: 60,         // 0 ~ 100
  showFontScaleWidget: false, // 글자 크기 조절 위젯 표시 여부
  fontScaleWidgetPos: { top: 20, right: 20 }, // 위젯 위치 (기본 우측 상단)
  hasHeaderRow: true,        // 파일 업로드 시 첫 줄 헤더 제외 여부
  
  // 파일 업로드(파서) 컬럼 매핑 (0부터 시작하는 인덱스, -1은 사용 안 함)
  parserMapping: {
    description: 0, // Column A (문제/설명)
    answer: 1,      // Column B (정답)
    hint: -1,       // 사용 안 함
    explanation: -1, // 사용 안 함
    isCompleted: -1, // 학습 완료 상태
    wrongCount: -1   // 오답 횟수
  },

  // 파일 내보내기(다운로드) 컬럼 매핑 및 포함 여부
  exportMapping: {
    description: 0,
    answer: 1,
    hint: -1, // 사용 안 함
    explanation: -1, // 사용 안 함
    isCompleted: -1, // 사용 안 함
    wrongCount: -1, // 사용 안 함
  }
};

export const useSettingsStore = create((set, get) => ({
  // --- 상태 (State) ---
  settings: { ...DEFAULT_SETTINGS },
  
  // 현재 페이지에만 적용되는 임시 글자 크기 (null이면 settings.fontSize 사용)
  temporaryFontSize: null,
  
  isLoading: true,

  // --- 액션 (Actions) ---

  /**
   * DB에서 설정을 로드합니다.
   */
  loadSettings: async (force = false) => {
    // 이미 로드되었고 강제 로드가 아니면 중복 로드 방지
    if (!force && !get().isLoading && get().settings !== DEFAULT_SETTINGS) {
      return;
    }

    set({ isLoading: true });
    try {
      const saved = await getSettings();
      // 기존 저장된 설정과 기본 설정을 병합하여 새로운 키가 누락되지 않도록 합니다.
      const mergedSettings = { ...DEFAULT_SETTINGS, ...saved };
      set({ settings: mergedSettings, isLoading: false });
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
  },

  /**
   * 모든 설정을 초기 기본값으로 되돌립니다.
   */
  resetSettings: async () => {
    set({ settings: { ...DEFAULT_SETTINGS } });
    try {
      await saveSettings(DEFAULT_SETTINGS);
      return { success: true };
    } catch (error) {
      console.error('설정 초기화 실패:', error);
      return { success: false, error: error.message };
    }
  }
}));
