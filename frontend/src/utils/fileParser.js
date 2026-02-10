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
 * @returns {Promise<Array>} 파싱된 문제 목록
 */
export const parseFile = async (file, hasHeader = true) => {
  const extension = file.name.split('.').pop().toLowerCase();
  
  switch (extension) {
    case 'xlsx':
    case 'xls':
      return parseExcel(file, hasHeader);
    case 'csv':
      return parseCSV(file, hasHeader);
    case 'txt':
      return parseTXT(file, hasHeader);
    default:
      throw new Error('지원하지 않는 파일 형식입니다. (.xlsx, .csv, .txt만 가능)');
  }
};

/**
 * [Excel 파서]
 * xlsx 라이브러리를 사용하여 시트의 데이터를 읽어옵니다.
 * @param {File} file
 * @param {boolean} hasHeader
 */
export const parseExcel = (file, hasHeader = true) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0]; 
        const sheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // 헤더 여부에 따라 데이터 시작 위치 결정
        const dataRows = hasHeader ? jsonData.slice(1) : jsonData;

        const problems = dataRows
          .filter(row => row[0] && row[1]) 
          .map((row, index) => ({
            id: crypto.randomUUID(), 
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
 */
export const parseCSV = (file, hasHeader = true) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const dataRows = hasHeader ? results.data.slice(1) : results.data;

          const problems = dataRows
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
 */
export const parseTXT = (file, hasHeader = true) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/); 
        
        const rawRows = lines.filter(line => line.trim());
        const dataRows = hasHeader ? rawRows.slice(1) : rawRows;

        const problems = dataRows
          .map((line, index) => {
            const parts = line.split('\t'); 
            return {
              id: crypto.randomUUID(),
              sequenceNumber: index + 1,
              description: parts[0]?.trim() || '',
              answer: parts[1]?.trim() || '',
              choices: parts.slice(2).filter(p => p && p.trim()).map(p => p.trim())
            };
          })
          .filter(p => p.description && p.answer); 
          
        resolve(problems);
      } catch (error) {
        reject(new Error('TXT 파일을 파싱하는 중 오류가 발생했습니다.'));
      }
    };
    
    reader.onerror = () => reject(new Error('파일 읽기 오류가 발생했습니다.'));
    reader.readAsText(file, 'UTF-8');
  });
};
