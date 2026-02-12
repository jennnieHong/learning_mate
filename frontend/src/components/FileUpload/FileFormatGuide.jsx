/**
 * @file FileFormatGuide.jsx
 * @description 사용자에게 업로드 가능한 파일 형식(Excel, CSV, TXT)과 데이터 구조를 안내하는 가이드 컴포넌트입니다.
 */

import { useState } from 'react';
import './FileFormatGuide.css';

export const FileFormatGuide = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="format-guide">
      <button 
        className="guide-toggle" 
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '❌ 가이드 닫기' : 'ℹ️ 파일 형식 가이드 보기'}
      </button>

      {isOpen && (
        <div className="guide-content">
          <h3>📁 지원 파일 및 데이터 구조</h3>
          <p>모든 파일의 <strong>첫 번째 행은 제목(헤더)</strong>으로 인식되어 제외됩니다.</p>
          
          <div className="format-grid">
            {/* Excel 가이드 */}
            <div className="format-item">
              <h4>📊 Excel (.xlsx, .xls)</h4>
              <ul>
                <li><strong>A열:</strong> 문제 내용 또는 설명</li>
                <li><strong>B열:</strong> 정답</li>
                <li><strong>C열 이후:</strong> 객관식 선택지 (있을 경우)</li>
              </ul>
            </div>

            {/* CSV 가이드 */}
            <div className="format-item">
              <h4>📄 CSV (.csv)</h4>
              <p>쉼표(,)로 구분된 형식</p>
              <code>문제,정답,선택지1,선택지2...</code>
            </div>

            {/* TXT 가이드 */}
            <div className="format-item">
              <h4>📝 TXT (.txt)</h4>
              <p>탭(Tab)으로 구분된 형식</p>
              <code>문제[TAB]정답[TAB]선택지1...</code>
            </div>

            {/* 붙여넣기 가이드 */}
            <div className="format-item">
              <h4>📋 붙여넣기</h4>
              <p>엑셀에서 복사한 내용을 그대로 붙여넣을 수 있습니다 (탭 구분).</p>
            </div>
          </div>

          <div className="guide-tip">
            <strong>💡 팁:</strong> 선택지가 없으면 자동으로 주관식 문제로 인식됩니다.
          </div>
        </div>
      )}
    </div>
  );
};
