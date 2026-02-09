/**
 * 딥 서치 디버그 유틸리티
 * 브라우저 콘솔에서 이 스크립트를 복사하여 실행하세요.
 * 
 * 사용법:
 * 1. 브라우저에서 F12를 눌러 개발자 도구를 엽니다
 * 2. Console 탭으로 이동합니다
 * 3. 이 파일의 전체 내용을 복사하여 붙여넣고 Enter를 누릅니다
 * 4. debugSearch('검색어') 함수를 호출합니다
 *    예: debugSearch('빌려온')
 */

async function debugSearch(keyword) {
  console.log('=== 딥 서치 디버그 시작 ===');
  console.log('검색 키워드:', keyword);
  
  // IndexedDB 열기
  const dbRequest = indexedDB.open('learningmate-problems');
  
  return new Promise((resolve, reject) => {
    dbRequest.onsuccess = async (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['problems'], 'readonly');
      const objectStore = transaction.objectStore('problems');
      const getAllRequest = objectStore.getAll();
      
      getAllRequest.onsuccess = () => {
        const allProblems = getAllRequest.result;
        console.log('전체 문제 개수:', allProblems.length);
        
        if (allProblems.length === 0) {
          console.warn('⚠️ IndexedDB에 문제 데이터가 없습니다!');
          console.log('파일을 먼저 업로드해주세요.');
          resolve({ found: [], total: 0 });
          return;
        }
        
        // 첫 3개 문제 샘플 출력
        console.log('\n--- 샘플 문제 데이터 (처음 3개) ---');
        allProblems.slice(0, 3).forEach((problem, idx) => {
          console.log(`\n문제 ${idx + 1}:`, {
            id: problem.id,
            fileSetId: problem.fileSetId,
            description: problem.description,
            answer: problem.answer,
            choices: problem.choices
          });
        });
        
        // 검색 수행
        const query = keyword.toLowerCase().trim();
        const matchingFileIds = new Set();
        const matchingProblems = [];
        
        allProblems.forEach((value) => {
          const description = String(value.description || '').toLowerCase();
          const answer = String(value.answer || '').toLowerCase();
          const choices = (value.choices || []).map(c => String(c).toLowerCase());
          
          const inDescription = description.includes(query);
          const inAnswer = answer.includes(query);
          const inChoices = choices.some(c => c.includes(query));
          
          if (inDescription || inAnswer || inChoices) {
            if (value.fileSetId) {
              matchingFileIds.add(value.fileSetId);
              matchingProblems.push({
                fileSetId: value.fileSetId,
                description: value.description,
                answer: value.answer,
                matchedIn: {
                  description: inDescription,
                  answer: inAnswer,
                  choices: inChoices
                }
              });
            }
          }
        });
        
        console.log('\n=== 검색 결과 ===');
        console.log('매칭된 문제 개수:', matchingProblems.length);
        console.log('매칭된 파일 ID 개수:', matchingFileIds.size);
        console.log('파일 ID 목록:', Array.from(matchingFileIds));
        
        if (matchingProblems.length > 0) {
          console.log('\n--- 매칭된 문제들 ---');
          matchingProblems.forEach((problem, idx) => {
            console.log(`\n매칭 ${idx + 1}:`, problem);
          });
        } else {
          console.warn('⚠️ 검색 결과가 없습니다!');
          console.log('힌트: 대소문자는 구분하지 않지만, 띄어쓰기와 정확한 철자는 일치해야 합니다.');
        }
        
        resolve({
          found: matchingProblems,
          fileIds: Array.from(matchingFileIds),
          total: allProblems.length
        });
      };
      
      getAllRequest.onerror = () => {
        console.error('❌ 문제 데이터 조회 실패');
        reject(getAllRequest.error);
      };
    };
    
    dbRequest.onerror = () => {
      console.error('❌ IndexedDB 열기 실패');
      reject(dbRequest.error);
    };
  });
}

// 파일 목록도 확인하는 함수
async function debugFiles() {
  console.log('=== 파일 목록 디버그 ===');
  
  const dbRequest = indexedDB.open('learningmate-files');
  
  return new Promise((resolve, reject) => {
    dbRequest.onsuccess = async (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['files'], 'readonly');
      const objectStore = transaction.objectStore('files');
      const getAllRequest = objectStore.getAll();
      
      getAllRequest.onsuccess = () => {
        const allFiles = getAllRequest.result;
        console.log('전체 파일 개수:', allFiles.length);
        
        allFiles.forEach((file, idx) => {
          console.log(`\n파일 ${idx + 1}:`, {
            id: file.id,
            name: file.originalFilename,
            totalProblems: file.totalProblems,
            fileType: file.fileType
          });
        });
        
        resolve(allFiles);
      };
      
      getAllRequest.onerror = () => {
        console.error('❌ 파일 데이터 조회 실패');
        reject(getAllRequest.error);
      };
    };
    
    dbRequest.onerror = () => {
      console.error('❌ IndexedDB 열기 실패');
      reject(dbRequest.error);
    };
  });
}

console.log('✅ 디버그 유틸리티 로드 완료!');
console.log('사용 가능한 함수:');
console.log('  - debugSearch("검색어") : 검색 기능 테스트');
console.log('  - debugFiles() : 업로드된 파일 목록 확인');
console.log('\n예시: debugSearch("빌려온")');
