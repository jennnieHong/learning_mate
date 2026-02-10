/**
 * @file fileExporter.js
 * @description 데이터를 다양한 파일 형식(Excel, CSV, TXT, JSON)으로 변환하여 다운로드하는 유틸리티입니다.
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';

/**
 * 특정 형식으로 파일을 다운로드합니다.
 * @param {Object} fileMetadata - 파일의 메타데이터 (originalFilename 등)
 * @param {Array} problems - 문제 목록
 * @param {string} format - 다운로드 형식 ('json' | 'xlsx' | 'csv' | 'txt')
 */
export const exportFile = (fileMetadata, problems, format = 'json') => {
  const baseFilename = fileMetadata.originalFilename.split('.')[0];
  
  switch (format) {
    case 'xlsx':
      downloadExcel(baseFilename, problems);
      break;
    case 'csv':
      downloadCSV(baseFilename, problems);
      break;
    case 'txt':
      downloadTXT(baseFilename, problems);
      break;
    case 'json':
    default:
      downloadJSON(baseFilename, fileMetadata, problems);
      break;
  }
};

/**
 * [JSON 다운로드] - 시스템 메타데이터를 포함한 전체 구조 보존
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
 * [Excel 다운로드] - A:문제, B:정답, C~:선택지
 */
const downloadExcel = (filename, problems) => {
  const headers = ['문제/설명', '정답', '선택지1', '선택지2', '선택지3', '선택지4', '선택지5'];
  const rows = problems.map(p => [
    p.description,
    p.answer,
    ...(p.choices || [])
  ]);
  
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
const downloadCSV = (filename, problems) => {
  const rows = problems.map(p => [
    p.description,
    p.answer,
    ...(p.choices || [])
  ]);
  
  // 헤더 추가
  rows.unshift(['Description', 'Answer', 'Choice1', 'Choice2', 'Choice3', 'Choice4', 'Choice5']);
  
  const csv = Papa.unparse(rows);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // 한글 깨짐 방지 BOM 추가
  triggerDownload(blob, `${filename}_export.csv`);
};

/**
 * [TXT 다운로드] - 탭 구분 형식
 */
const downloadTXT = (filename, problems) => {
  const header = 'Description\tAnswer\tChoices...\n';
  const content = problems.map(p => {
    const row = [p.description, p.answer, ...(p.choices || [])];
    return row.join('\t');
  }).join('\n');
  
  const blob = new Blob([header + content], { type: 'text/plain;charset=utf-8' });
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
