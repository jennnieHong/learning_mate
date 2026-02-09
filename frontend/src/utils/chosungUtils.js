/**
 * @file chosungUtils.js
 * @description 한글 초성 검색을 위한 유틸리티 함수
 */

// 한글 초성 리스트
const CHOSUNG_LIST = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

/**
 * 한글 문자에서 초성을 추출합니다.
 * @param {string} char - 한글 문자 (한 글자)
 * @returns {string} 초성 문자
 */
function getChosung(char) {
  const code = char.charCodeAt(0) - 44032; // '가'의 유니코드 값
  if (code < 0 || code > 11171) return char; // 한글이 아니면 그대로 반환
  return CHOSUNG_LIST[Math.floor(code / 588)];
}

/**
 * 문자열의 모든 한글 문자를 초성으로 변환합니다.
 * @param {string} str - 변환할 문자열
 * @returns {string} 초성으로 변환된 문자열
 */
function getChosungString(str) {
  return str.split('').map(char => getChosung(char)).join('');
}

/**
 * 텍스트에 검색어(초성 포함)가 포함되어 있는지 확인합니다.
 * @param {string} text - 검색 대상 텍스트
 * @param {string} query - 검색어 (초성 가능)
 * @returns {boolean} 포함 여부
 */
export function chosungIncludes(text, query) {
  if (!text || !query) return false;
  
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // 1. 일반 검색 (정확한 문자열 매칭)
  if (textLower.includes(queryLower)) {
    return true;
  }
  
  // 2. 초성 검색
  const textChosung = getChosungString(text);
  const queryChosung = getChosungString(query);
  
  // 검색어가 초성으로만 이루어져 있는지 확인
  const isChosungQuery = query.split('').every(char => CHOSUNG_LIST.includes(char));
  
  if (isChosungQuery) {
    // 초성 검색: 텍스트의 초성에서 검색어 초성을 찾음
    return textChosung.includes(query);
  } else {
    // 혼합 검색: 텍스트의 초성에서 검색어의 초성을 찾음
    return textChosung.includes(queryChosung);
  }
}

/**
 * 텍스트가 검색어로 시작하는지 확인합니다 (초성 포함).
 * @param {string} text - 검색 대상 텍스트
 * @param {string} query - 검색어 (초성 가능)
 * @returns {boolean} 시작 여부
 */
export function chosungStartsWith(text, query) {
  if (!text || !query) return false;
  
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // 1. 일반 검색
  if (textLower.startsWith(queryLower)) {
    return true;
  }
  
  // 2. 초성 검색
  const textChosung = getChosungString(text);
  const isChosungQuery = query.split('').every(char => CHOSUNG_LIST.includes(char));
  
  if (isChosungQuery) {
    return textChosung.startsWith(query);
  }
  
  return false;
}
