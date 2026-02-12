/**
 * @file PasteRowModal.jsx
 * @description 에디터에서 텍스트 붙여넣기를 통해 대량의 문제를 한 번에 추가할 수 있게 해주는 모달입니다.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseText } from '../../utils/fileParser';
import { useSettingsStore } from '../../stores/useSettingsStore';
import toast from 'react-hot-toast';
import './PasteRowModal.css';

export default function PasteRowModal({ isOpen, onClose, onAdd }) {
  const { settings } = useSettingsStore();
  
  const [text, setText] = useState('');
  const [format, setFormat] = useState('tsv');
  const [customDelimiter, setCustomDelimiter] = useState('');
  const [customMapping, setCustomMapping] = useState(settings.parserMapping);

  const handleAdd = () => {
    if (!text.trim()) {
      toast.error('붙여넣을 텍스트가 없습니다.');
      return;
    }

    const delimiter = format === 'custom' ? customDelimiter : format;
    if (format === 'custom' && !delimiter) {
      toast.error('구분자를 입력해주세요.');
      return;
    }

    try {
      // 에디터에서는 헤더가 없는 순수 데이터만 붙여넣는 경우가 많으므로 hasHeader를 false로 기본 설정할 수도 있지만,
      // 기존 파서와 일관성을 위해 설정을 따르거나 옵션을 줄 수 있습니다.
      // 여기서는 일단 설정값을 따릅니다.
      const parsedProblems = parseText(text, delimiter, settings.hasHeaderRow, customMapping);
      
      if (parsedProblems.length === 0) {
        toast.error('파싱된 데이터가 없습니다. 형식을 확인해주세요.');
        return;
      }

      onAdd(parsedProblems);
      toast.success(`${parsedProblems.length}개의 문제가 추가되었습니다.`);
      setText('');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('파싱 중 오류가 발생했습니다.');
    }
  };

  const handleMappingChange = (key, value) => {
    setCustomMapping(prev => ({
      ...prev,
      [key]: parseInt(value, 10)
    }));
  };

  const [isExpanded, setIsExpanded] = useState(false);
  
  // 데이터 미리보기 (상위 3줄)
  const getPreviewData = () => {
    if (!text.trim()) return [];
    const lines = text.split(/\r?\n/).filter(l => l.trim()).slice(settings.hasHeaderRow ? 1 : 0, settings.hasHeaderRow ? 4 : 3);
    const delimiter = format === 'custom' ? customDelimiter : (format === 'tsv' ? '\t' : ',');
    if (!delimiter) return [];
    return lines.map(line => line.split(delimiter));
  };

  const previewRows = getPreviewData();
  const maxCols = previewRows.length > 0 ? Math.max(...previewRows.map(r => r.length)) : 0;

  const handleMappingSelect = (colIdx, field) => {
    // 기존에 해당 필드로 매핑된 열이 있다면 -1로 초기화 (중복 방지)
    const newMapping = { ...customMapping };
    Object.keys(newMapping).forEach(key => {
      if (newMapping[key] === colIdx) newMapping[key] = -1;
    });
    
    // 신규 매핑 설정
    if (field !== 'none') {
      newMapping[field] = colIdx;
    }
    
    setCustomMapping(newMapping);
  };

  const getColField = (colIdx) => {
    if (customMapping.description === colIdx) return 'description';
    if (customMapping.answer === colIdx) return 'answer';
    if (customMapping.hint === colIdx) return 'hint';
    if (customMapping.explanation === colIdx) return 'explanation';
    return 'none';
  };

  const fieldNames = {
    description: '문제',
    answer: '정답',
    hint: '힌트',
    explanation: '해설',
    none: '무시'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="paste-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="paste-modal-container"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="paste-modal-header">
              <div className="header-title">
                <span className="icon">📋</span>
                <h3>텍스트 붙여넣기로 추가</h3>
              </div>
              <button className="close-btn" onClick={onClose}>✕</button>
            </header>

            <div className="paste-modal-body">
              <div className="paste-settings-row">
                <div className="setting-item">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={settings.hasHeaderRow} 
                      onChange={(e) => useSettingsStore.getState().updateSetting('hasHeaderRow', e.target.checked)}
                    />
                    <span>첫 행 제외</span>
                  </label>
                </div>
                <div className="setting-item">
                  <label>구분자</label>
                  <select value={format} onChange={(e) => setFormat(e.target.value)}>
                    <option value="tsv">탭 (TSV / 엑셀 복사)</option>
                    <option value="csv">쉼표 (CSV)</option>
                    <option value="custom">직접 입력...</option>
                  </select>
                </div>
                {format === 'custom' && (
                  <div className="setting-item">
                    <label>구분자 문자열</label>
                    <input 
                      type="text" 
                      value={customDelimiter} 
                      onChange={(e) => setCustomDelimiter(e.target.value)}
                      placeholder="예: |"
                    />
                  </div>
                )}
              </div>

              <textarea 
                className="paste-modal-textarea"
                placeholder={`여기에 데이터를 붙여넣으세요...
${settings.hasHeaderRow ? '제목 행(자동제외)\n' : ''}${format === 'tsv' ? '문제[TAB]정답' : format === 'csv' ? '문제,정답' : `문제${customDelimiter || '[구분자]'}정답`} 형식`}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />

              {/* 데이터 미리보기 및 인터랙티브 매핑 */}
              {text.trim() && (
                <div className="paste-preview-section">
                  <h4>💡 컬럼 지정하기 (미리보기)</h4>
                  <div className="preview-table-wrapper">
                    <table className="preview-table">
                      <thead>
                        <tr>
                          {Array.from({ length: maxCols }).map((_, colIdx) => (
                            <th key={colIdx}>
                              <select 
                                value={getColField(colIdx)} 
                                onChange={(e) => handleMappingSelect(colIdx, e.target.value)}
                                className={`col-mapping-select ${getColField(colIdx)}`}
                              >
                                <option value="none">무시</option>
                                <option value="description">문제</option>
                                <option value="answer">정답</option>
                                <option value="hint">힌트</option>
                                <option value="explanation">해설</option>
                              </select>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, rowIdx) => (
                          <tr key={rowIdx}>
                            {Array.from({ length: maxCols }).map((_, colIdx) => (
                              <td key={colIdx} className={getColField(colIdx) !== 'none' ? 'active-col' : ''}>
                                {row[colIdx] || ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="preview-hint">* 상단 파란색 버튼을 눌러 각 열의 역할을 지정하세요.</p>
                </div>
              )}

              <div className="paste-modal-mapping">
                <details>
                  <summary>수동 매핑 설정 (열 번호)</summary>
                  <div className="mapping-grid">
                    {Object.entries(customMapping).map(([key, val]) => (
                      <div className="mapping-field" key={key}>
                        <label>{fieldNames[key]}</label>
                        <input type="number" value={val} onChange={(e) => handleMappingChange(key, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </div>

            <footer className="paste-modal-footer">
              <button className="cancel-btn" onClick={onClose}>취소</button>
              <button className="submit-btn" onClick={handleAdd}>문제 추가하기</button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
