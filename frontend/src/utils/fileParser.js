/**
 * @file fileParser.js
 * @description 업로드된 외부 파일(Excel, CSV, TXT)을 읽고 시스템에서 사용하는 문제 데이터 구조로 변환하는 유틸리티입니다.
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';

/**
 * 파일 확장명에 따라 적절한 파서 함수를 호출합니다.
 * @param {File} file - 브라우저로부터 받은 File 객체
 * @returns {Promise<Array>} 파싱된 문제 목록
 */
export const parseFile = async (file) => {
  const extension = file.name.split('.').pop().toLowerCase();
  
  switch (extension) {
    case 'xlsx':
    case 'xls':
      return parseExcel(file);
    case 'csv':
      return parseCSV(file);
    case 'txt':
      return parseTXT(file);
    default:
      throw new Error('지원하지 않는 파일 형식입니다. (.xlsx, .csv, .txt만 가능)');
  }
};

/**
 * [Excel 파서]
 * xlsx 라이브러리를 사용하여 시트의 데이터를 읽어옵니다.
 * - 첫 번째 행은 헤더로 간주하여 데이터에서 제외합니다.
 * - 설계: A열(문제/설명), B열(정답), C열 이후(선택지)
 */
export const parseExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0]; // 첫 번째 시트만 사용
        const sheet = workbook.Sheets[sheetName];
        
        // 2차원 배열 형태로 변환 ([[A1, B1, C1], [A2, B2, C2], ...])
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // 유효한 데이터가 있는 행만 필터링 (A, B열은 필수)
        const problems = jsonData.slice(1) // 헤더 제외
          .filter(row => row[0] && row[1]) 
          .map((row, index) => ({
            id: crypto.randomUUID(), // 로컬에서 고유 식별을 위한 ID 생성
            sequenceNumber: index + 1,
            description: String(row[0]).trim(),
            answer: String(row[1]).trim(),
            choices: row.slice(2).filter(c => c !== undefined && c !== null && String(c).trim() !== '')
              .map(c => String(c).trim())
          }));
        
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
 * [CSV 파서]
 * papaparse 라이브러리를 사용하여 쉼표 구분 데이터를 읽어옵니다.
 */
export const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        try {
          // 첫 줄이 헤더가 아닌 경우를 대비해 간단한 값 체크 후 필터링 가능
          const problems = results.data.slice(1)
            .filter(row => row[0] && row[1])
            .map((row, index) => ({
              id: crypto.randomUUID(),
              sequenceNumber: index + 1,
              description: row[0].trim(),
              answer: row[1].trim(),
              choices: row.slice(2).filter(c => c && c.trim()).map(c => c.trim())
            }));
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
 * [TXT 파서]
 * 탭(Tab)으로 구분된 텍스트 파일을 읽어옵니다.
 */
export const parseTXT = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/); // 줄바꿈 기준으로 분리
        
        const problems = lines.slice(1) // 첫 줄 헤더 제외
          .filter(line => line.trim())
          .map((line, index) => {
            const parts = line.split('\t'); // 탭 구분자 사용
            return {
              id: crypto.randomUUID(),
              sequenceNumber: index + 1,
              description: parts[0]?.trim() || '',
              answer: parts[1]?.trim() || '',
              choices: parts.slice(2).filter(p => p && p.trim()).map(p => p.trim())
            };
          })
          .filter(p => p.description && p.answer); // 유효한 데이터만 남김
          
        resolve(problems);
      } catch (error) {
        reject(new Error('TXT 파일을 파싱하는 중 오류가 발생했습니다.'));
      }
    };
    
    reader.onerror = () => reject(new Error('파일 읽기 오류가 발생했습니다.'));
    reader.readAsText(file, 'UTF-8');
  });
};
