/**
 * @file fileExporter.js
 * @description 데이터를 다양한 파일 형식(Excel, CSV, TXT, JSON)으로 변환하여 다운로드하는 유틸리티입니다.
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';

/**
 * 특정 형식으로 파일을 다운로드합니다.
 * @param {Object} fileMetadata - 파일의 메타데이터
 * @param {Array} problems - 문제 목록
 * @param {string} format - 다운로드 형식 ('json' | 'xlsx' | 'csv' | 'txt')
 * @param {Object} mapping - 내보내기 컬럼 매핑 정보
 */
export const exportFile = (fileMetadata, problems, format = 'json', mapping) => {
  const baseFilename = fileMetadata.originalFilename.split('.')[0];
  
  switch (format) {
    case 'xlsx':
      downloadExcel(baseFilename, problems, mapping);
      break;
    case 'csv':
      downloadCSV(baseFilename, problems, mapping);
      break;
    case 'txt':
      downloadTXT(baseFilename, problems, mapping);
      break;
    case 'json':
    default:
      downloadJSON(baseFilename, fileMetadata, problems);
      break;
  }
};

/**
 * [공통] 매핑 정보를 바탕으로 행 데이터를 생성합니다.
 */
const createExportRow = (p, mapping) => {
  const row = [];
  
  // 매핑 객체에서 활성화된(-1이 아닌) 필드들만 처리
  Object.entries(mapping).forEach(([field, colIdx]) => {
    if (colIdx === -1) return;
    
    let val = '';
    switch (field) {
      case 'description': val = p.description; break;
      case 'answer': val = p.answer; break;
      case 'hint': val = p.hint || ''; break;
      case 'explanation': val = p.explanation || ''; break;
      case 'isCompleted': val = p.isCompleted ? 'O' : 'X'; break;
      case 'wrongCount': val = p.wrongCount || 0; break;
    }
    row[colIdx] = val;
  });

  // 보기(choices) 처리: 매핑된 컬럼 중 가장 큰 인덱스 다음부터 배치
  const maxIdx = Math.max(...Object.values(mapping));
  const choiceStartIdx = maxIdx + 1;
  
  if (p.choices && p.choices.length > 0) {
    p.choices.forEach((choice, i) => {
      row[choiceStartIdx + i] = choice;
    });
  }

  return row;
};

/**
 * [공통] 매핑 정보를 바탕으로 헤더를 생성합니다.
 */
const createHeaders = (mapping) => {
  const headers = [];
  const fieldLabels = {
    description: '문제/설명',
    answer: '정답',
    hint: '힌트',
    explanation: '해설',
    isCompleted: '완료여부',
    wrongCount: '오답횟수'
  };

  Object.entries(mapping).forEach(([field, colIdx]) => {
    if (colIdx !== -1) {
      headers[colIdx] = fieldLabels[field];
    }
  });

  const maxIdx = Math.max(...Object.values(mapping));
  for (let i = 1; i <= 5; i++) {
    headers[maxIdx + i] = `선택지${i}`;
  }

  return headers;
};

/**
 * [JSON 다운로드] - 시스템 메타데이터를 포함한 전체 구조 보존 (매핑 영향 없음)
 */
const downloadJSON = (filename, metadata, problems) => {
  const data = {
    metadata,
    problems: problems.map(({ id, fileSetId, ...rest }) => rest)
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `${filename}_export.json`);
};

/**
 * [Excel 다운로드]
 */
const downloadExcel = (filename, problems, mapping) => {
  const headers = createHeaders(mapping);
  const rows = problems.map(p => createExportRow(p, mapping));
  
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Problems');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, `${filename}_export.xlsx`);
};

/**
 * [CSV 다운로드]
 */
const downloadCSV = (filename, problems, mapping) => {
  const headers = createHeaders(mapping);
  const rows = problems.map(p => createExportRow(p, mapping));
  
  const csv = Papa.unparse([headers, ...rows]);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename}_export.csv`);
};

/**
 * [TXT 다운로드]
 */
const downloadTXT = (filename, problems, mapping) => {
  const headers = createHeaders(mapping);
  const rows = problems.map(p => createExportRow(p, mapping));
  
  const content = [headers, ...rows].map(row => row.join('\t')).join('\n');
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, `${filename}_export.txt`);
};

/**
 * 브라우저 다운로드를 실행합니다.
 */
const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
