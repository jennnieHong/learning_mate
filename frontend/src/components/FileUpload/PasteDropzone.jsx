/**
 * @file PasteDropzone.jsx
 * @description 텍스트 붙여넣기를 통해 문제집을 업로드하는 컴포넌트입니다.
 * 모바일 사용자나 빠른 입력을 위해 제공됩니다.
 */

import { useState } from 'react';
import { useFileStore } from '../../stores/useFileStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import toast from 'react-hot-toast';
import './PasteDropzone.css';

export const PasteDropzone = () => {
  const { uploadRawText } = useFileStore();
  const { settings } = useSettingsStore();

  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [format, setFormat] = useState('tsv');
  const [customDelimiter, setCustomDelimiter] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // 사용자 지정 매핑 설정 (선택 사항)
  const [customMapping, setCustomMapping] = useState(settings.parserMapping);

  const handleUpload = async () => {
    if (!text.trim()) {
      toast.error('붙여넣을 텍스트가 없습니다.');
      return;
    }

    // 필수 필드 매핑 확인
    if (customMapping.description === -1 || customMapping.answer === -1) {
      toast.error('문제와 정답 컬럼을 지정해주세요.');
      return;
    }

    const delimiter = format === 'custom' ? customDelimiter : format;
    if (format === 'custom' && !delimiter) {
      toast.error('구분자를 입력해주세요.');
      return;
    }

    const loadingToast = toast.loading('텍스트 처리 중...');
    try {
      const name = fileName.trim() || `붙여넣기_${new Date().toLocaleTimeString()}`;
      const result = await uploadRawText(text, name, delimiter, customMapping);

      toast.dismiss(loadingToast);
      if (result.success) {
        toast.success(`"${name}" 업로드 완료! (${result.problemCount}개 문제)`);
        setText('');
        setFileName('');
        setIsExpanded(false);
      } else {
        toast.error(result.error || '업로드에 실패했습니다.');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('오류가 발생했습니다.');
    }
  };

  const handleMappingChange = (key, value) => {
    setCustomMapping(prev => ({
      ...prev,
      [key]: parseInt(value, 10)
    }));
  };

  // 데이터 미리보기 (상위 3줄)
  const getPreviewData = () => {
    if (!text.trim()) return [];
    const lines = text.split(/\r?\n/).filter(l => l.trim()).slice(settings.hasHeaderRow ? 1 : 0, settings.hasHeaderRow ? 4 : 3);
    const del = format === 'custom' ? customDelimiter : (format === 'tsv' ? '\t' : ',');
    if (!del) return [];
    return lines.map(line => line.split(del));
  };

  const previewRows = getPreviewData();
  const maxCols = previewRows.length > 0 ? Math.max(...previewRows.map(r => r.length)) : 0;

  const handleMappingSelect = (colIdx, field) => {
    const newMapping = { ...customMapping };
    Object.keys(newMapping).forEach(key => {
      if (newMapping[key] === colIdx) newMapping[key] = -1;
    });
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

    // 이하는 보기(Choice)로 자동 인식되는 영역 여부 확인
    // 힌트나 설명이 -1인 경우, 데이터가 있는 나머지 컬럼들을 보기로 간주함
    const hasData = previewRows.some(row => row[colIdx] && row[colIdx].trim());
    if (hasData) return 'choice';

    return 'none';
  };

  if (!isExpanded) {
    return (
      <div className="paste-dropzone-collapsed" onClick={() => setIsExpanded(true)}>
        <span className="paste-icon">📋</span>
        <p>또는 텍스트 직접 붙여넣기 (모바일 추천)</p>
      </div>
    );
  }

  return (
    <div className="paste-dropzone-expanded">
      <div className="paste-header">
        <div className="header-left">
          <span className="paste-icon">📋</span>
          <h3>텍스트 붙여넣기</h3>
        </div>
        <button className="close-btn" onClick={() => setIsExpanded(false)}>✕</button>
      </div>

      <div className="paste-input-group">
        <input
          type="text"
          placeholder="저장할 문제집 이름 (선택)"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="paste-filename-input"
        />

        <div className="paste-options">
          <div className="option-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.hasHeaderRow}
                onChange={(e) => useSettingsStore.getState().updateSetting('hasHeaderRow', e.target.checked)}
              />
              <span>첫 행 제외</span>
            </label>
          </div>
          <div className="option-item">
            <label>구분자:</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="tsv">탭 (TSV / 엑셀 복사)</option>
              <option value="csv">쉼표 (CSV)</option>
              <option value="custom">직접 입력...</option>
            </select>
          </div>
          {format === 'custom' && (
            <div className="option-item">
              <input
                type="text"
                placeholder="구분자 입력 (예: |)"
                value={customDelimiter}
                onChange={(e) => setCustomDelimiter(e.target.value)}
                className="custom-delimiter-input"
              />
            </div>
          )}
        </div>
      </div>

      <textarea
        className="paste-textarea"
        placeholder={`여기에 텍스트를 붙여넣으세요...
${settings.hasHeaderRow ? '제목 행(자동제외)\n' : ''}${format === 'tsv' ? '문제[TAB]정답' : format === 'csv' ? '문제,정답' : `문제${customDelimiter || '[구분자]'}정답`} 형식`}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {text.trim() && (
        <div className="paste-preview-section">
          <h4>💡 컬럼 지정하기</h4>
          <div className="preview-table-wrapper">
            <table className="preview-table">
              <thead>
                <tr>
                  {Array.from({ length: maxCols }).map((_, colIdx) => (
                    <th key={colIdx}>
                      <select
                        value={getColField(colIdx)}
                        onChange={(e) => handleMappingSelect(colIdx, e.target.value)}
                        className={`col-selector ${getColField(colIdx)}`}
                      >
                        <option value="none">무시</option>
                        <option value="description">문제(필수)</option>
                        <option value="answer">정답(필수)</option>
                        <option value="hint">힌트</option>
                        <option value="explanation">해설</option>
                        {getColField(colIdx) === 'choice' && <option value="choice" disabled>보기(자동)</option>}
                      </select>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {Array.from({ length: maxCols }).map((_, cIdx) => {
                      const field = getColField(cIdx);
                      const isActive = field !== 'none';
                      return (
                        <td key={cIdx} className={`${isActive ? 'active-col' : ''} ${field}`}>
                          {row[cIdx] || ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="paste-mapping-section">
        <details>
          <summary>파서(컬럼) 수동 설정</summary>
          <div className="mapping-grid">
            <div className="mapping-item">
              <label>문제 내용:</label>
              <input type="number" value={customMapping.description} onChange={(e) => handleMappingChange('description', e.target.value)} />
            </div>
            <div className="mapping-item">
              <label>정답:</label>
              <input type="number" value={customMapping.answer} onChange={(e) => handleMappingChange('answer', e.target.value)} />
            </div>
            <div className="mapping-item">
              <label>힌트:</label>
              <input type="number" value={customMapping.hint} onChange={(e) => handleMappingChange('hint', e.target.value)} />
            </div>
            <div className="mapping-item">
              <label>설명:</label>
              <input type="number" value={customMapping.explanation} onChange={(e) => handleMappingChange('explanation', e.target.value)} />
            </div>
          </div>
        </details>
      </div>

      <div className="paste-actions">
        <button className="paste-cancel-btn" onClick={() => setIsExpanded(false)}>취소</button>
        <button className="paste-submit-btn" onClick={handleUpload}>문제집 저장</button>
      </div>
    </div>
  );
};
