/**
 * @file useFileStore.js
 * @description 파일(문제집)과 관련된 전역 상태를 관리하는 Zustand 스토어입니다.
 * 파일 업로드, 목록 조회, 선택, 휴지통 관리 등의 기능을 제공합니다.
 */

import { create } from 'zustand';
import {
  saveFile,
  getActiveFiles,
  getTrashFiles,
  moveToTrash,
  restoreFile,
  permanentDelete,
  saveProblems,
  getProblemsByFileId,
  getWrongProblemsFromFiles,
  getAllProblemsFromFiles,
  filesDB
} from '../utils/storage';
import { parseFile, parseText } from '../utils/fileParser';
import { exportFile } from '../utils/fileExporter';
import { useSettingsStore } from './useSettingsStore';
import { useProgressStore } from './useProgressStore';

export const useFileStore = create((set, get) => ({
  // --- 상태 (State) ---
  files: [],              // 활성 상태의 파일 목록
  trashedFiles: [],       // 휴지통에 있는 파일 목록
  selectedFileIds: [],    // 메인 화면에서 다중 선택된 파일 ID들
  selectedTrashedFileIds: [], // 휴지통에서 다중 선택된 파일 ID들
  currentFile: null,      // 현재 학습 또는 편집 중인 파일 (문제 정보 포함 가능)
  isLoading: false,       // 비동기 작업 로딩 상태
  error: null,            // 에러 메시지 데이터
  
  // --- 액션 (Actions) ---

  /**
   * 데이터베이스에서 활성 파일 목록을 로드하여 상태를 업데이트합니다.
   */
  loadFiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const files = await getActiveFiles();
      set({ files, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  /**
   * 메인 화면에서 특정 파일의 선택 상태를 토글합니다.
   * @param {string} fileId - 토글할 파일 ID
   */
  toggleFileSelection: (fileId) => {
    set((state) => {
      const isSelected = state.selectedFileIds.includes(fileId);
      if (isSelected) {
        return { selectedFileIds: state.selectedFileIds.filter(id => id !== fileId) };
      } else {
        return { selectedFileIds: [...state.selectedFileIds, fileId] };
      }
    });
  },

  /**
   * 모든 활성 파일을 한 번에 선택하거나 선택 해제합니다.
   * @param {boolean} select - 전체 선택 여부
   */
  selectAllFiles: (select) => {
    if (select) {
      const allIds = get().files.map(f => f.id);
      set({ selectedFileIds: allIds });
    } else {
      set({ selectedFileIds: [] });
    }
  },

  /**
   * 선택된 파일들(혹은 전체)의 오답들을 모아 '오답 세션' 전용 currentFile을 생성합니다.
   * @returns {Promise<Object>} 성공 여부와 메시지를 담은 결과 객체
   */
  loadAggregatedReview: async () => {
    set({ isLoading: true, error: null });
    try {
      const selectedIds = get().selectedFileIds;
      const wrongProblems = await getWrongProblemsFromFiles(selectedIds);
      
      if (wrongProblems.length === 0) {
        set({ isLoading: false });
        return { success: false, message: '틀린 문제가 없습니다.' };
      }

      // 'aggregated-review'라는 가상의 ID를 가진 세션 파일 생성
      set({ 
        currentFile: { 
          id: 'aggregated-review',
          originalFilename: selectedIds.length === 0 ? '전체 오답 노트' : '선택된 파일 오답 노트',
          problems: wrongProblems,
          isReviewMode: true
        },
        isLoading: false 
      });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },
  
  /**
   * 선택된 파일들(혹은 전체)의 모든 문제를 모아 '전체 학습 세션'을 생성합니다.
   * @returns {Promise<Object>} 성공 여부와 메시지를 담은 결과 객체
   */
  loadAggregatedAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const selectedIds = get().selectedFileIds;
      const allProblems = await getAllProblemsFromFiles(selectedIds);
      
      if (allProblems.length === 0) {
        set({ isLoading: false });
        return { success: false, message: '문제가 없습니다.' };
      }

      // 'aggregated-all'이라는 가상의 ID를 가진 세션 파일 생성
      set({ 
        currentFile: { 
          id: 'aggregated-all',
          originalFilename: selectedIds.length === 0 ? '전체 문제' : '선택된 파일 전체 문제',
          problems: allProblems,
          isReviewMode: false
        },
        isLoading: false 
      });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * 휴지통 목록을 로드합니다.
   */
  loadTrash: async () => {
    set({ isLoading: true, error: null });
    try {
      const trashedFiles = await getTrashFiles();
      set({ trashedFiles, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  /**
   * 텍스트 내용을 파싱하여 DB에 저장합니다.
   * @param {string} text - 처리할 텍스트 내용
   * @param {string} fileName - 저장할 파일 이름
   * @param {string} format - 파싱 형식 ('csv', 'tsv')
   * @param {Object} customMapping - (선택) 사용자 지정 컬럼 매핑
   */
  uploadRawText: async (text, fileName, format = 'tsv', customMapping = null) => {
    set({ isLoading: true, error: null });
    try {
      const { hasHeaderRow, parserMapping } = useSettingsStore.getState().settings;
      const mapping = customMapping || parserMapping;
      
      const problems = await parseText(text, format, hasHeaderRow, mapping);
      
      if (problems.length === 0) {
        throw new Error('파싱된 문제가 없습니다. 형식을 확인해주세요.');
      }

      const fileData = {
        id: crypto.randomUUID(),
        originalFilename: fileName || `직접입력_${new Date().toLocaleDateString()}`,
        fileType: format,
        totalProblems: problems.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
      };
      
      await saveFile(fileData);
      
      const problemsWithFileId = problems.map(p => ({
        ...p,
        fileSetId: fileData.id
      }));
      await saveProblems(fileData.id, problemsWithFileId);

      await get().loadFiles();
      set({ isLoading: false });
      return { success: true, file: fileData, problemCount: problems.length };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * 여러 파일을 동시에 업로드하고 파싱하여 DB에 저장합니다.
   * @param {Array<File>} files - 업로드된 브라우저 File 객체 배열
   */
  uploadMultipleFiles: async (files) => {
    set({ isLoading: true, error: null });
    const results = [];
    
    try {
      const { hasHeaderRow, parserMapping } = useSettingsStore.getState().settings;

      // 모든 파일을 병렬로 처리 (하나가 실패해도 나머지는 계속 진행하도록 allSettled 사용)
      const uploadPromises = files.map(async (file) => {
        try {
          const problems = await parseFile(file, hasHeaderRow, parserMapping);
          const fileData = {
            id: crypto.randomUUID(),
            originalFilename: file.name,
            fileType: file.name.split('.').pop().toLowerCase(),
            totalProblems: problems.length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null
          };
          
          await saveFile(fileData);
          const problemsWithFileId = problems.map(p => ({
            ...p,
            fileSetId: fileData.id
          }));
          await saveProblems(fileData.id, problemsWithFileId);
          
          // 진행 상황 데이터 복원 (이동용)
          const progressItems = problemsWithFileId
            .filter(p => p.isCompleted || p.wrongCount > 0)
            .map(p => ({
              fileSetId: fileData.id,
              problemId: p.id,
              isCompleted: p.isCompleted,
              wrongCount: p.wrongCount
            }));
            
          if (progressItems.length > 0) {
            await useProgressStore.getState().bulkSaveProgress(progressItems);
          }
          
          return { success: true, fileName: file.name, count: problems.length };
        } catch (err) {
          return { success: false, fileName: file.name, error: err.message };
        }
      });

      const settledResults = await Promise.all(uploadPromises);
      
      // 목록 및 진행 상황 새로고침
      await get().loadFiles();
      await useProgressStore.getState().loadAllProgress();
      
      set({ isLoading: false });
      return { 
        total: files.length,
        successCount: settledResults.filter(r => r.success).length,
        failCount: settledResults.filter(r => !r.success).length,
        details: settledResults
      };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * 파일을 업로드하고 파싱하여 DB에 저장합니다. (단일 파일용 - 하위 호환성 유지)
   * @param {File} file - 업로드된 브라우저 File 객체
   */
  uploadFile: async (file) => {
    set({ isLoading: true, error: null });
    try {
      // 1. 확장자에 따라 파싱 수행
      const { hasHeaderRow, parserMapping } = useSettingsStore.getState().settings;
      const problems = await parseFile(file, hasHeaderRow, parserMapping);
      
      // 2. 파일 메타데이터 생성
      const fileData = {
        id: crypto.randomUUID(),
        originalFilename: file.name,
        fileType: file.name.split('.').pop().toLowerCase(),
        totalProblems: problems.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
      };
      
      // 3. 파일 메타데이터 및 문제 리스트를 DB에 영구 저장
      await saveFile(fileData);
      
      const problemsWithFileId = problems.map(p => ({
        ...p,
        fileSetId: fileData.id
      }));
      await saveProblems(fileData.id, problemsWithFileId);

      // 4. 진행 상황 데이터 복원
      const progressItems = problemsWithFileId
        .filter(p => p.isCompleted || p.wrongCount > 0)
        .map(p => ({
          fileSetId: fileData.id,
          problemId: p.id,
          isCompleted: p.isCompleted,
          wrongCount: p.wrongCount
        }));
        
      if (progressItems.length > 0) {
        await useProgressStore.getState().bulkSaveProgress(progressItems);
      }
      
      // 5. 목록 및 진행 상황 새로고침
      await get().loadFiles();
      await useProgressStore.getState().loadAllProgress();
      
      set({ isLoading: false });
      return { success: true, file: fileData, problemCount: problems.length };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },
  
  /**
   * 특정 파일을 현재 작업 대상으로 선택하고 해당 파일의 문제들을 로드합니다.
   * @param {string} fileId - 선택할 파일 ID
   */
  selectFile: async (fileId) => {
    set({ isLoading: true, error: null });
    try {
      const file = get().files.find(f => f.id === fileId);
      const problems = await getProblemsByFileId(fileId);
      
      set({ 
        currentFile: { ...file, problems },
        isLoading: false 
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  /**
   * 파일을 휴지통으로 보냅니다.
   * @param {string} fileId - 삭제할 파일 ID
   */
  deleteFile: async (fileId) => {
    set({ isLoading: true, error: null });
    try {
      await moveToTrash(fileId);
      await get().loadFiles();
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * 선택된 모든 파일을 휴지통으로 보냅니다.
   */
  deleteSelectedFiles: async () => {
    const { selectedFileIds } = get();
    if (selectedFileIds.length === 0) return { success: false, message: '선택된 파일이 없습니다.' };

    set({ isLoading: true, error: null });
    try {
      // 모든 선택된 파일을 휴지통으로 이동 (병렬 처리)
      await Promise.all(selectedFileIds.map(id => moveToTrash(id)));
      
      // 상태 업데이트
      set({ selectedFileIds: [] });
      await get().loadFiles();
      
      set({ isLoading: false });
      return { success: true, count: selectedFileIds.length };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },
  
  /**
   * 휴지통에 있는 파일을 복원합니다.
   * @param {string} fileId - 복원할 파일 ID
   */
  restoreFileFromTrash: async (fileId) => {
    set({ isLoading: true, error: null });
    try {
      await restoreFile(fileId);
      await get().loadFiles();
      await get().loadTrash();
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },
  
  /**
   * 파일을 DB에서 영구적으로 삭제합니다.
   * @param {string} fileId - 영구 삭제할 파일 ID
   */
  deletePermanently: async (fileId) => {
    set({ isLoading: true, error: null });
    try {
      await permanentDelete(fileId);
      await get().loadTrash();
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * 휴지통 아이템의 선택 상태를 토글합니다.
   */
  toggleTrashedFileSelection: (fileId) => {
    const { selectedTrashedFileIds } = get();
    if (selectedTrashedFileIds.includes(fileId)) {
      set({ selectedTrashedFileIds: selectedTrashedFileIds.filter(id => id !== fileId) });
    } else {
      set({ selectedTrashedFileIds: [...selectedTrashedFileIds, fileId] });
    }
  },

  /**
   * 휴지통의 모든 아이템을 선택합니다.
   */
  selectAllTrashedFiles: () => {
    const { trashedFiles } = get();
    set({ selectedTrashedFileIds: trashedFiles.map(f => f.id) });
  },

  /**
   * 휴지통 선택을 모두 해제합니다.
   */
  clearTrashedSelection: () => {
    set({ selectedTrashedFileIds: [] });
  },

  /**
   * 선택된 모든 휴지통 파일을 복원합니다.
   */
  restoreSelectedTrashedFiles: async () => {
    const { selectedTrashedFileIds } = get();
    if (selectedTrashedFileIds.length === 0) return { success: false, message: '선택된 파일이 없습니다.' };

    set({ isLoading: true, error: null });
    try {
      await Promise.all(selectedTrashedFileIds.map(id => restoreFile(id)));
      
      set({ selectedTrashedFileIds: [] });
      await get().loadFiles();
      await get().loadTrash();
      
      set({ isLoading: false });
      return { success: true, count: selectedTrashedFileIds.length };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * 선택된 모든 휴지통 파일을 영구 삭제합니다.
   */
  deletePermanentlySelectedFiles: async () => {
    const { selectedTrashedFileIds } = get();
    if (selectedTrashedFileIds.length === 0) return { success: false, message: '선택된 파일이 없습니다.' };

    set({ isLoading: true, error: null });
    try {
      await Promise.all(selectedTrashedFileIds.map(id => permanentDelete(id)));
      
      set({ selectedTrashedFileIds: [] });
      await get().loadTrash();
      
      set({ isLoading: false });
      return { success: true, count: selectedTrashedFileIds.length };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },
  
  /**
   * 특정 파일을 원하는 형식으로 다운로드합니다.
   * @param {string} fileId - 다운로드할 파일 ID
   * @param {string} format - 다운로드 형식 ('xlsx', 'csv', 'txt', 'json')
   */
  downloadFile: async (fileId, format = 'json') => {
    try {
      const file = await filesDB.getItem(fileId);
      if (!file) throw new Error('파일을 찾을 수 없습니다.');
      
      const problems = await getProblemsByFileId(fileId);
      const { exportMapping } = useSettingsStore.getState().settings;
      
      exportFile(file, problems, format, exportMapping);
      
      return { success: true };
    } catch (error) {
      console.error('Download failed:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * 에러 상태를 초기화합니다.
   */
  clearError: () => set({ error: null })
}));
