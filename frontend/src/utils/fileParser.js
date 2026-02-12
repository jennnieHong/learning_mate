/**
 * @file fileParser.js
 * @description 업로드된 외부 파일(Excel, CSV, TXT)을 읽고 시스템에서 사용하는 문제 데이터 구조로 변환하는 유틸리티입니다.
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';

/**
 * 파일 확장명에 따라 적절한 파서 함수를 호출합니다.
 * @param {File} file - 브라우저로부터 받은 File 객체
 * @param {boolean} hasHeader - 첫 줄을 헤더로 처리할지 여부
 * @param {Object} mapping - 컬럼 매핑 {description: index, answer: index, ...}
 * @returns {Promise<Array>} 파싱된 문제 목록
 */
export const parseFile = async (file, hasHeader = true, mapping = { description: 0, answer: 1 }) => {
  const extension = file.name.split('.').pop().toLowerCase();

  switch (extension) {
    case 'xlsx':
    case 'xls':
      return parseExcel(file, hasHeader, mapping);
    case 'csv':
      return parseCSV(file, hasHeader, mapping);
    case 'txt':
      return parseTXT(file, hasHeader, mapping);
    default:
      throw new Error('지원하지 않는 파일 형식입니다. (.xlsx, .csv, .txt만 가능)');
  }
};

/**
 * 텍스트 형식에 따라 적절한 파서 함수를 호출합니다.
 * @param {string} text - 처리할 텍스트 내용
 * @param {string} formatOrDelimiter - 형식 ('csv', 'tsv', 'txt') 또는 사용자 지정 구분자
 * @param {boolean} hasHeader - 첫 줄을 헤더로 처리할지 여부
 * @param {Object} mapping - 컬럼 매핑
 * @returns {Array} 파싱된 문제 목록
 */
export const parseText = (text, formatOrDelimiter = 'tsv', hasHeader = true, mapping = { description: 0, answer: 1 }) => {
  switch (formatOrDelimiter) {
    case 'csv':
      return parseCSVText(text, hasHeader, mapping);
    case 'tsv':
    case 'txt':
    case '\t':
      return parseTXTText(text, hasHeader, mapping);
    default:
      // 형식이 명시되지 않은 경우 사용자 지정 구분자로 간주
      return parseCustomText(text, formatOrDelimiter, hasHeader, mapping);
  }
};

/**
 * 사용자 지정 구분자를 사용하여 텍스트를 파싱합니다.
 */
export const parseCustomText = (text, delimiter, hasHeader = true, mapping) => {
  const lines = text.split(/\r?\n/);
  const rawRows = lines.filter(line => line.trim());
  const dataRows = hasHeader ? rawRows.slice(1) : rawRows;

  return dataRows
    .map((line, index) => {
      const row = line.split(delimiter);
      return mapRowToProblem(row, mapping, index);
    })
    .filter(p => p.description && p.answer);
};

/**
 * [공통] 행 데이터에서 매핑 정보를 바탕으로 문제 객체를 생성합니다.
 */
const mapRowToProblem = (row, mapping, index) => {
  const getVal = (idx) => (idx !== undefined && idx !== -1 && row[idx] !== undefined) ? String(row[idx]).trim() : '';

  // 기본 필드 추출
  const description = getVal(mapping.description);
  const answer = getVal(mapping.answer);
  const hint = getVal(mapping.hint);
  const explanation = getVal(mapping.explanation);

  // 학습 상태 추출 (O/X 또는 true/false 문자열 처리)
  const isCompletedVal = getVal(mapping.isCompleted).toUpperCase();
  const isCompleted = isCompletedVal === 'O' || isCompletedVal === 'TRUE' || isCompletedVal === '1';

  // 오답 횟수 추출 (숫자형)
  const wrongCountVal = getVal(mapping.wrongCount);
  const wrongCount = parseInt(wrongCountVal, 10) || 0;

  /**
   * 보기(choices) 처리 로직:
   * 1. 힌트(hint)와 설명(explanation)이 매핑되지 않은 경우(-1), 
   *    해당 필드가 위치할 수 있는 모든 컬럼(일반적으로 문제/정답 이후)은 보기 후보가 됨.
   * 2. 명시적으로 매핑된 컬럼(문제, 정답, 힌트, 설명, 완료여부, 오답수)은 보기에서 제외함.
   * 3. 값이 비어있는 컬럼은 보기에서 제외함.
   */
  const mappedIndices = Object.values(mapping).filter(v => v !== -1);
  const choices = row
    .filter((_, idx) => !mappedIndices.includes(idx))
    .filter(c => c !== undefined && c !== null && String(c).trim() !== '')
    .map(c => String(c).trim());

  return {
    id: crypto.randomUUID(),
    sequenceNumber: index + 1,
    description,
    answer,
    hint,
    explanation,
    isCompleted,
    wrongCount,
    choices
  };
};

/**
 * [Excel 파서]
 */
export const parseExcel = (file, hasHeader = true, mapping) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const dataRows = hasHeader ? jsonData.slice(1) : jsonData;

        const problems = dataRows
          .filter(row => row[mapping.description] && row[mapping.answer])
          .map((row, index) => mapRowToProblem(row, mapping, index));

        resolve(problems);
      } catch (error) {
        reject(new Error('Excel 파일을 읽는 중 오류가 발생했습니다.'));
      }
    };

    reader.onerror = () => reject(new Error('파일 읽기 오류가 발생했습니다.'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * [CSV 파서 - 파일용]
 */
export const parseCSV = (file, hasHeader = true, mapping) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const dataRows = hasHeader ? results.data.slice(1) : results.data;

          const problems = dataRows
            .filter(row => row[mapping.description] && row[mapping.answer])
            .map((row, index) => mapRowToProblem(row, mapping, index));
          resolve(problems);
        } catch (error) {
          reject(new Error('CSV 파싱 중 오류가 발생했습니다.'));
        }
      },
      error: () => reject(new Error('CSV 파일을 읽는 중 오류가 발생했습니다.'))
    });
  });
};

/**
 * [CSV 파서 - 텍스트용]
 */
export const parseCSVText = (text, hasHeader = true, mapping) => {
  const results = Papa.parse(text, { skipEmptyLines: true });
  const dataRows = hasHeader ? results.data.slice(1) : results.data;

  return dataRows
    .filter(row => row[mapping.description] && row[mapping.answer])
    .map((row, index) => mapRowToProblem(row, mapping, index));
};

/**
 * [TXT 파서 - 파일용]
 */
export const parseTXT = (file, hasHeader = true, mapping) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const problems = parseTXTText(text, hasHeader, mapping);
        resolve(problems);
      } catch (error) {
        reject(new Error('TXT 파일을 파싱하는 중 오류가 발생했습니다.'));
      }
    };

    reader.onerror = () => reject(new Error('파일 읽기 오류가 발생했습니다.'));
    reader.readAsText(file, 'UTF-8');
  });
};

/**
 * [TXT 파서 - 텍스트용]
 */
export const parseTXTText = (text, hasHeader = true, mapping) => {
  const lines = text.split(/\r?\n/);
  const rawRows = lines.filter(line => line.trim());
  const dataRows = hasHeader ? rawRows.slice(1) : rawRows;

  return dataRows
    .map((line, index) => {
      const row = line.split('\t');
      return mapRowToProblem(row, mapping, index);
    })
    .filter(p => p.description && p.answer);
};
