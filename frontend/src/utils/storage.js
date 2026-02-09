/**
 * @file storage.js
 * @description IndexedDB를 활용한 데이터 영구 저장 로직을 담당하는 유틸리티 파일입니다.
 * localforage 라이브러리를 사용하여 브라우저 스토리지에 파일, 문제, 진행 상황, 설정을 저장합니다.
 */

import localforage from 'localforage';
import { chosungIncludes } from './chosungUtils';

/**
 * [파일 메타데이터 DB 인스턴스]
 * - Key: fileId (UUID)
 * - Value: { id, originalFilename, fileType, totalProblems, createdAt, updatedAt, deletedAt }
 */
export const filesDB = localforage.createInstance({
  name: 'learningmate-files',
  storeName: 'files'
});

/**
 * [문제 데이터 DB 인스턴스]
 * - Key: problemId (UUID)
 * - Value: { id, fileSetId, sequenceNumber, description, answer, choices, createdAt }
 */
export const problemsDB = localforage.createInstance({
  name: 'learningmate-problems',
  storeName: 'problems'
});

/**
 * [학습 진행 상황 DB 인스턴스]
 * - Key: problemId (문제와 1:1 대응)
 * - Value: { id, problemId, fileSetId, isCompleted, isCorrect, wrongCount, lastAttemptedAt, completedAt }
 */
export const progressDB = localforage.createInstance({
  name: 'learningmate-progress',
  storeName: 'progress'
});

/**
 * [사용자 설정 DB 인스턴스]
 * - Key: 'userSettings'
 * - Value: { mode, orderMode, repeatMode, questionType, cardFront }
 */
export const settingsDB = localforage.createInstance({
  name: 'learningmate-settings',
  storeName: 'settings'
});

/**
 * 새로운 파일(문제집) 메타데이터를 저장하거나 기존 정보를 업데이트합니다.
 * @param {Object} fileData - 저장할 파일 메타데이터 객체
 */
export const saveFile = async (fileData) => {
  await filesDB.setItem(fileData.id, fileData);
  return fileData;
};

/**
 * 휴지통에 있지 않은(활성 상태) 모든 파일 목록을 가져옵니다.
 * @returns {Promise<Array>} 생성일 기준 내림차순으로 정렬된 파일 목록
 */
export const getActiveFiles = async () => {
  const files = [];
  await filesDB.iterate((value) => {
    if (!value.deletedAt) {
      files.push(value);
    }
  });
  return files.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/**
 * 휴지통에 담긴(삭제 대기 상태) 모든 파일 목록을 가져옵니다.
 * @returns {Promise<Array>} 삭제일 기준 내림차순으로 정렬된 파일 목록
 */
export const getTrashFiles = async () => {
  const files = [];
  await filesDB.iterate((value) => {
    if (value.deletedAt) {
      files.push(value);
    }
  });
  return files.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));
};

/**
 * 특정 파일을 휴지통으로 이동시킵니다 (삭제일 설정).
 * @param {string} fileId - 이동할 파일의 ID
 */
export const moveToTrash = async (fileId) => {
  const file = await filesDB.getItem(fileId);
  if (file) {
    file.deletedAt = new Date().toISOString();
    await filesDB.setItem(fileId, file);
  }
  return file;
};

/**
 * 휴지통에 있는 파일을 다시 활성 상태로 복원합니다.
 * @param {string} fileId - 복원할 파일의 ID
 */
export const restoreFile = async (fileId) => {
  const file = await filesDB.getItem(fileId);
  if (file) {
    file.deletedAt = null;
    await filesDB.setItem(fileId, file);
  }
  return file;
};

/**
 * 파일을 데이터베이스에서 완전히 삭제합니다.
 * 연결된 모든 문제와 진행 상황 데이터도 함께 연쇄 삭제됩니다.
 * @param {string} fileId - 영구 삭제할 파일의 ID
 */
export const permanentDelete = async (fileId) => {
  // 1. 파일 메타데이터 삭제
  await filesDB.removeItem(fileId);
  
  // 2. 해당 파일에 속한 모든 문제 식별 및 삭제
  const problemsToDelete = [];
  await problemsDB.iterate((value, key) => {
    if (value.fileSetId === fileId) {
      problemsToDelete.push(key);
    }
  });
  
  for (const problemId of problemsToDelete) {
    await problemsDB.removeItem(problemId);
    
    // 3. 문제와 연결된 학습 진행 상황 데이터 삭제
    const progressToDelete = [];
    await progressDB.iterate((value, key) => {
      if (value.problemId === problemId) {
        progressToDelete.push(key);
      }
    });
    
    for (const progressId of progressToDelete) {
      await progressDB.removeItem(progressId);
    }
  }
};

/**
 * 문제 목록을 저장하고, 기존 데이터와 동기화합니다.
 * 에디터에서 삭제된 문제는 DB에서도 제거하고, 관련 진행 상황도 삭제합니다.
 * @param {string} fileId - 파일(문제집) ID
 * @param {Array} newProblems - 현재 에디터 상태의 전체 문제 목록
 */
export const saveProblems = async (fileId, newProblems) => {
  // 1. 현재 DB에 저장된 해당 파일의 모든 문제 ID 조회
  const existingProblemIds = [];
  await problemsDB.iterate((value) => {
    if (value.fileSetId === fileId) {
      existingProblemIds.push(value.id);
    }
  });

  // 2. 전달받은 새 목록에 없는 ID를 삭제 대상으로 분류
  const newProblemIds = newProblems.map(p => p.id);
  const idsToDelete = existingProblemIds.filter(id => !newProblemIds.includes(id));

  // 3. 삭제 대상 문제 및 진행 데이터 제거
  for (const id of idsToDelete) {
    await problemsDB.removeItem(id);
    
    const progressKeys = [];
    await progressDB.iterate((value, key) => {
      if (value.problemId === id) {
        progressKeys.push(key);
      }
    });
    for (const key of progressKeys) {
      await progressDB.removeItem(key);
    }
  }

  // 4. 최신 문제 데이터 저장/업데이트
  for (const problem of newProblems) {
    await problemsDB.setItem(problem.id, problem);
  }
};

/**
 * 특정 파일에 속한 모든 문제 목록을 조회합니다.
 * @param {string} fileId - 조회할 파일 ID
 * @returns {Promise<Array>} 순서(sequenceNumber) 순으로 정렬된 문제 목록
 */
export const getProblemsByFileId = async (fileId) => {
  const problems = [];
  await problemsDB.iterate((value) => {
    if (value.fileSetId === fileId) {
      problems.push(value);
    }
  });
  return problems.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
};

/**
 * 사용자 학습 설정(모드, 순서 등)을 저장합니다.
 * @param {Object} settings - 설정 객체
 */
export const saveSettings = async (settings) => {
  await settingsDB.setItem('userSettings', settings);
  return settings;
};

/**
 * 현재 저장된 설정을 조회합니다. 저장된 값이 없으면 기본값을 반환합니다.
 * @returns {Promise<Object>} 사용자 설정 객체
 */
export const getSettings = async () => {
  const settings = await settingsDB.getItem('userSettings');
  
  return settings || {
    mode: 'problem',
    orderMode: 'random',
    repeatMode: false,
    questionType: 'multiple',
    cardFront: 'explanation',
    theme: 'light',
    fontSize: 5,
    cardColor: 'indigo',
    cardSaturation: 70,
    cardLightness: 60
  };
};

/**
 * 선택된 파일들 혹은 전체에서 오답(isCorrect === false)인 문제들만 추출합니다.
 * @param {Array} fileIds - 필터링할 파일 ID 목록 (빈 배열이면 전체 파일 대상)
 * @returns {Promise<Array>} 틀린 문제들의 상세 정보 목록
 */
export const getWrongProblemsFromFiles = async (fileIds = []) => {
  const wrongProblemDetails = [];
  const wrongProblemIds = [];
  
  // 1. 진행 상황 DB를 순회하며 조건에 맞는 오답 문제 ID 수집
  await progressDB.iterate((value) => {
    const isTargetFile = fileIds.length === 0 || fileIds.includes(value.fileSetId);
    if (isTargetFile && value.isCorrect === false) {
      wrongProblemIds.push(value.problemId);
    }
  });
  
  // 2. 수집된 ID를 바탕으로 문제 상세 데이터 조회
  if (wrongProblemIds.length > 0) {
    await problemsDB.iterate((value) => {
      if (wrongProblemIds.includes(value.id)) {
        wrongProblemDetails.push(value);
      }
    });
  }
  
  return wrongProblemDetails;
};
/**
 * 전체 문제 데이터베이스에서 특정 키워드를 포함하는 문제의 파일 ID 목록을 검색합니다 (딥 서치).
 * 한글 초성 검색도 지원합니다 (예: 'ㅂㄹㅇ' → '빌려온').
 * @param {string} keyword - 검색할 키워드
 * @returns {Promise<Set<string>>} 키워드를 포함하는 문제들이 속한 파일 ID들의 집합
 */
export const searchProblemsByKeyword = async (keyword) => {
  const matchingFileIds = new Set();
  const query = keyword.toLowerCase().trim();
  
  if (!query) return matchingFileIds;

  await problemsDB.iterate((value) => {
    const description = String(value.description || '');
    const answer = String(value.answer || '');
    const choices = (value.choices || []).map(c => String(c));

    // 일반 검색 (대소문자 무시)
    const descLower = description.toLowerCase();
    const ansLower = answer.toLowerCase();
    const choicesLower = choices.map(c => c.toLowerCase());

    const exactInDescription = descLower.includes(query);
    const exactInAnswer = ansLower.includes(query);
    const exactInChoices = choicesLower.some(c => c.includes(query));

    // 초성 검색 (한글인 경우)
    const chosungInDescription = chosungIncludes(description, query);
    const chosungInAnswer = chosungIncludes(answer, query);
    const chosungInChoices = choices.some(c => chosungIncludes(c, query));

    const matched = exactInDescription || exactInAnswer || exactInChoices ||
                    chosungInDescription || chosungInAnswer || chosungInChoices;

    if (matched && value.fileSetId) {
      matchingFileIds.add(value.fileSetId);
    }
  });

  return matchingFileIds;
};
