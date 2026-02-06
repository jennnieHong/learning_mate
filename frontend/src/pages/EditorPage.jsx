/**
 * @file EditorPage.jsx
 * @description 문제집의 내용을 직접 편집하거나 새로운 문제를 추가/삭제할 수 있는 에디터 페이지입니다.
 * 그리드 형태의 UI를 통해 대량의 데이터를 효율적으로 수정할 수 있습니다.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFileStore } from '../stores/useFileStore';
import { useProgressStore } from '../stores/useProgressStore';
import { saveFile, saveProblems, getProblemsByFileId } from '../utils/storage';
import toast from 'react-hot-toast';
import './EditorPage.css';

export default function EditorPage() {
  const { fileId } = useParams();
  const navigate = useNavigate();
  
  // 스토어 상태 및 액션
  const { selectFile, currentFile } = useFileStore();
  const { progressMap, loadProgress, resetProgress, resetProblemProgress } = useProgressStore();
  
  // --- 로컬 상태 (Local State) ---
  const [filename, setFilename] = useState('새로운 문제집');
  const [problems, setProblems] = useState([
    { id: crypto.randomUUID(), description: '', answer: '', choices: ['', '', ''] }
  ]);
  const [selectedIds, setSelectedIds] = useState(new Set()); // 다중 선택된 문제 ID들
  
  /**
   * 경로 파라미터(fileId)에 따라 모드를 결정합니다.
   * - 'new': 빈 문제집 생성 모드
   * - 그 외: 기존 파일 로드 모드
   */
  useEffect(() => {
    if (fileId === 'new') {
      setFilename('새로운 문제집');
      setProblems([
        { id: crypto.randomUUID(), description: '', answer: '', choices: ['', '', ''] }
      ]);
    } else if (fileId) {
      loadExistingFile(fileId);
      loadProgress(fileId);
    }
  }, [fileId]);
  
  /**
   * 기존 파일의 정보를 로컬 스토리지에서 불러와 상태에 설정합니다.
   */
  const loadExistingFile = async (id) => {
    await selectFile(id);
    const loadedProblems = await getProblemsByFileId(id);
    const file = useFileStore.getState().files.find(f => f.id === id);
    
    if (file) {
      setFilename(file.originalFilename);
      setProblems(loadedProblems.map(p => ({
        ...p,
        choices: p.choices || ['', '', '']
      })));
    }
  };
  
  // --- 문제 관리 액션 ---

  /** 새로운 빈 문제 행을 추가합니다. */
  const addProblem = () => {
    setProblems([
      ...problems,
      { id: crypto.randomUUID(), description: '', answer: '', choices: ['', '', ''] }
    ]);
  };
  
  /** 특정 인덱스의 문제를 삭제합니다. */
  const removeProblem = (index) => {
    if (problems.length === 1) {
      toast.error('최소 1개의 문제가 필요합니다');
      return;
    }
    setProblems(problems.filter((_, i) => i !== index));
  };
  
  /** 문제의 설명(질문) 또는 정답 필드를 업데이트합니다. */
  const updateProblem = (index, field, value) => {
    const updated = [...problems];
    updated[index] = { ...updated[index], [field]: value };
    setProblems(updated);
  };
  
  /** 특정 순서의 선택지 내용을 업데이트합니다. */
  const updateChoice = (problemIndex, choiceIndex, value) => {
    const updated = [...problems];
    updated[problemIndex].choices[choiceIndex] = value;
    setProblems(updated);
  };
  
  /** 특정 문제에 새로운 빈 선택지 칸을 추가합니다. */
  const addChoice = (problemIndex) => {
    const updated = [...problems];
    updated[problemIndex].choices.push('');
    setProblems(updated);
  };
  
  /** 특정 선택지를 삭제합니다. */
  const removeChoice = (problemIndex, choiceIndex) => {
    const updated = [...problems];
    if (updated[problemIndex].choices.length > 1) {
      updated[problemIndex].choices.splice(choiceIndex, 1);
      setProblems(updated);
    }
  };
  
  /** 현재까지의 편집 내용을 로컬 스토리지에 저장합니다. */
  const handleSave = async () => {
    if (!filename.trim()) {
      toast.error('파일명을 입력해주세요');
      return;
    }
    
    const emptyProblems = problems.filter(p => !p.description || !p.answer);
    if (emptyProblems.length > 0) {
      toast.error('모든 문제의 설명과 정답을 입력해주세요');
      return;
    }
    
    try {
      const newFileId = fileId === 'new' ? crypto.randomUUID() : fileId;
      
      const fileData = {
        id: newFileId,
        originalFilename: filename.endsWith('.custom') ? filename : `${filename}.custom`,
        fileType: 'custom',
        totalProblems: problems.length,
        createdAt: fileId === 'new' ? new Date().toISOString() : currentFile?.createdAt,
        updatedAt: new Date().toISOString(),
        deletedAt: null
      };
      
      await saveFile(fileData);
      
      const problemsWithFileId = problems.map((p, index) => ({
        ...p,
        fileSetId: newFileId,
        sequenceNumber: index + 1,
        choices: p.choices.filter(c => c.trim())
      }));
      
      // DB 동기화(삭제된 문제 처리 포함)를 위해 fileId와 함께 전달
      await saveProblems(newFileId, problemsWithFileId);
      
      toast.success(fileId === 'new' ? '문제집이 생성되었습니다!' : '문제집이 수정되었습니다!');
      navigate('/');
    } catch (error) {
      toast.error('저장 중 오류가 발생했습니다');
      console.error(error);
    }
  };

  /** 파일 전체의 학습 진척도를 초기화합니다. */
  const handleResetAllProgress = async () => {
    if (window.confirm('이 파일의 모든 학습 진행 상황을 초기화하시겠습니까?')) {
      await resetProgress(fileId);
      toast.success('진행 상황이 초기화되었습니다');
    }
  };

  /** 한 줄(문제)의 오답 횟수 등을 초기화합니다. */
  const handleResetProblemProgress = async (problemId) => {
    await resetProblemProgress(problemId);
    toast.success('문제 진행 상황이 초기화되었습니다');
  };

  // --- 다중 선택 및 일괄 삭제 로직 ---

  /** 헤더의 체크박스 클릭 시 전체 요소를 선택/해제합니다. */
  const toggleSelectAll = () => {
    if (selectedIds.size === problems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(problems.map(p => p.id)));
    }
  };

  /** 특정 행의 체크박스 상태를 반전시킵니다. */
  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  /** 선택된 모든 문제들을 일괄 삭제합니다. */
  const removeSelected = () => {
    if (selectedIds.size === 0) return;
    if (problems.length <= selectedIds.size) {
      toast.error('최소 1개의 문제는 남겨두어야 합니다');
      return;
    }
    
    const count = selectedIds.size;
    if (window.confirm(`${count}개의 문제를 삭제하시겠습니까?`)) {
      setProblems(prev => prev.filter(p => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
      toast.success(`${count}개의 문제가 삭제되었습니다`);
    }
  };
  
  // 현재 에디터에 표시되는 가장 많은 선택지 개수 (그리드 열 생성 기준)
  const maxChoices = Math.max(...problems.map(p => p.choices.length));
  
  return (
    <div className="editor-page">
      <div className="editor-container">
        <header className="editor-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← 취소
          </button>
          <input
            type="text"
            className="filename-input"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="파일명 입력"
          />
          <button className="save-btn" onClick={handleSave}>
            💾 저장
          </button>
        </header>
        
        <main className="editor-content-grid">
          <div className="toolbar">
            <div className="toolbar-left">
              <button className="add-problem-btn" onClick={addProblem}>
                ➕ 문제 추가
              </button>
              {fileId !== 'new' && (
                <button className="reset-all-btn" onClick={handleResetAllProgress}>
                  🔄 전체 진행 상황 초기화
                </button>
              )}
              {selectedIds.size > 0 && (
                <button className="delete-selected-btn" onClick={removeSelected}>
                  🗑️ {selectedIds.size}개 삭제
                </button>
              )}
            </div>
            <div className="problem-count">
              총 {problems.length}개 문제
            </div>
          </div>
          
          <div className="grid-wrapper">
            <table className="problems-grid">
              <thead>
                <tr>
                  <th className="col-select">
                    <input 
                      type="checkbox" 
                      checked={problems.length > 0 && selectedIds.size === problems.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="col-number">#</th>
                  <th className="col-status">상태</th>
                  <th className="col-wrong">오답</th>
                  <th className="col-description">설명/문제</th>
                  <th className="col-answer">정답</th>
                  {/* 동적 선택지 헤더 생성 */}
                  {Array.from({ length: maxChoices + 1 }).map((_, i) => (
                    <th key={i} className="col-choice">선택지 {i + 1}</th>
                  ))}
                  <th className="col-actions">작업</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((problem, index) => {
                  const progress = progressMap[problem.id];
                  const isCompleted = progress?.isCompleted;
                  const wrongCount = progress?.wrongCount || 0;
                  const isSelected = selectedIds.has(problem.id);

                  return (
                    <tr key={problem.id} className={`problem-row ${isSelected ? 'selected' : ''}`}>
                      <td className="col-select">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelect(problem.id)}
                        />
                      </td>
                      <td className="col-number">{index + 1}</td>
                      <td className="col-status">
                        <span className={`status-badge ${isCompleted ? 'completed' : 'pending'}`}>
                          {isCompleted ? '✅ 완료' : '⏳ 미완료'}
                        </span>
                      </td>
                      <td className="col-wrong">
                        {wrongCount > 0 ? (
                          <div className="wrong-count-container">
                            <span className="wrong-count-badge">{wrongCount}회</span>
                            <button 
                              className="reset-mini-btn" 
                              onClick={() => handleResetProblemProgress(problem.id)}
                              title="오답 횟수 초기화"
                            >
                              🔄
                            </button>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="col-description">
                        <textarea
                          value={problem.description}
                          onChange={(e) => updateProblem(index, 'description', e.target.value)}
                          placeholder="문제 입력..."
                          rows={2}
                        />
                      </td>
                      <td className="col-answer">
                        <input
                          type="text"
                          value={problem.answer}
                          onChange={(e) => updateProblem(index, 'answer', e.target.value)}
                          placeholder="정답 입력..."
                        />
                      </td>
                      {/* 선택지 편집 영역: 항상 하나 이상의 여유 열(+추가 버튼) 노출 */}
                      {Array.from({ length: maxChoices + 1 }).map((_, choiceIdx) => (
                        <td key={choiceIdx} className="col-choice">
                          {choiceIdx < problem.choices.length ? (
                            <div className="choice-cell">
                              <input
                                type="text"
                                value={problem.choices[choiceIdx]}
                                onChange={(e) => updateChoice(index, choiceIdx, e.target.value)}
                                placeholder={`선택지 ${choiceIdx + 1}`}
                              />
                              <button
                                className="remove-choice-icon"
                                onClick={() => removeChoice(index, choiceIdx)}
                                title="삭제"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            /* 마지막 열 다음에만 추가 버튼 보이기 */
                            choiceIdx === problem.choices.length && (
                              <button
                                className="add-choice-cell"
                                onClick={() => addChoice(index)}
                              >
                                + 추가
                              </button>
                            )
                          )}
                        </td>
                      ))}
                      <td className="col-actions">
                        <button
                          className="delete-row-btn"
                          onClick={() => removeProblem(index)}
                          disabled={problems.length === 1}
                          title="이 행 삭제"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
