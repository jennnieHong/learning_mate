// es-hangul API 테스트 스크립트
// 브라우저 콘솔에서 실행하여 사용 가능한 함수 확인

import * as hangul from 'es-hangul';

console.log('=== es-hangul 라이브러리 함수 목록 ===');
console.log(Object.keys(hangul));

// 초성 검색 관련 함수 찾기
const chosungFunctions = Object.keys(hangul).filter(key => 
  key.toLowerCase().includes('chosung') || 
  key.toLowerCase().includes('initial') ||
  key.toLowerCase().includes('search')
);

console.log('\n초성 관련 함수:', chosungFunctions);

// 사용 가능한 모든 함수 출력
console.log('\n전체 함수 목록:');
Object.keys(hangul).forEach(key => {
  console.log(`- ${key}:`, typeof hangul[key]);
});
