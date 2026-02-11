/**
 * @file EditorPage.jsx
 * @description 문제집의 내용을 직접 편집하거나 새로운 문제를 추가/삭제할 수 있는 에디터 페이지입니다.
 * 그리드 형태의 UI를 통해 대량의 데이터를 효율적으로 수정할 수 있습니다.
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFileStore } from '../stores/useFileStore';
import { useProgressStore } from '../stores/useProgressStore';
import { saveFile, saveProblems, getProblemsByFileId } from '../utils/storage';
import { chosungIncludes } from '../utils/chosungUtils';
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
    { id: crypto.randomUUID(), description: '', answer: '', hint: '', explanation: '', choices: ['', '', ''] }
  ]);
  const [selectedIds, setSelectedIds] = useState(new Set()); // 다중 선택된 문제 ID들
  const [searchQuery, setSearchQuery] = useState(''); // 검색어
  const [isSearchOpen, setIsSearchOpen] = useState(false); // 검색창 열림 상태
  const scrollEndRef = useRef(null); // 추가 시 스크롤할 위치
  
  /**
   * 경로 파라미터(fileId)에 따라 모드를 결정합니다.
   * - 'new': 빈 문제집 생성 모드
   * - 그 외: 기존 파일 로드 모드
   */
  useEffect(() => {
    if (fileId === 'new') {
      setFilename('새로운 문제집');
      setProblems([
        { id: crypto.randomUUID(), description: '', answer: '', hint: '', explanation: '', choices: ['', '', ''] }
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
        hint: p.hint || '',
        explanation: p.explanation || '',
        choices: p.choices || ['', '', '']
      })));
    }
  };
  
  // --- 문제 관리 액션 ---

  /** 새로운 빈 문제 행을 추가합니다. */
  const addProblem = () => {
    setProblems(prev => [
      ...prev,
      { id: crypto.randomUUID(), description: '', answer: '', hint: '', explanation: '', choices: ['', '', ''] }
    ]);
    
    // 상태 변경 후 레이아웃이 업데이트될 때까지 대기 후 스크롤
    setTimeout(() => {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
  };
  
  /** 특정 ID의 문제를 삭제합니다. */
  const removeProblem = (id) => {
    if (problems.length === 1) {
      toast.error('최소 1개의 문제가 필요합니다');
      return;
    }
    setProblems(problems.filter(p => p.id !== id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };
  
  /** 문제의 설명(질문) 또는 정답 필드를 업데이트합니다. (ID 기준) */
  const updateProblem = (id, field, value) => {
    setProblems(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };
  
  /** 특정 문제의 선택지 내용을 업데이트합니다. (ID 기준) */
  const updateChoice = (problemId, choiceIndex, value) => {
    setProblems(prev => prev.map(p => {
      if (p.id === problemId) {
        const newChoices = [...p.choices];
        newChoices[choiceIndex] = value;
        return { ...p, choices: newChoices };
      }
      return p;
    }));
  };
  
  /** 특정 문제에 새로운 빈 선택지 칸을 추가합니다. (ID 기준) */
  const addChoice = (problemId) => {
    setProblems(prev => prev.map(p => 
      p.id === problemId ? { ...p, choices: [...p.choices, ''] } : p
    ));
  };
  
  /** 특정 문제의 선택지를 삭제합니다. (ID 기준) */
  const removeChoice = (problemId, choiceIndex) => {
    setProblems(prev => prev.map(p => {
      if (p.id === problemId && p.choices.length > 1) {
        const newChoices = [...p.choices];
        newChoices.splice(choiceIndex, 1);
        return { ...p, choices: newChoices };
      }
      return p;
    }));
  };
  
  /** 현재까지의 편집 내용을 로컬 스토리지에 저장합니다. */
  const handleSave = async () => {
    if (!filename.trim()) {
      toast.error('파일명을 입력해주세요');
      return;
    }
    
    // 1. 완전히 비어있는 행(질문과 정답이 모두 공백)은 자동으로 제외
    const validProblems = problems.filter(p => p.description.trim() || p.answer.trim());
    
    if (validProblems.length === 0) {
      toast.error('최소 1개 이상의 유효한 문제를 입력해주세요');
      return;
    }

    // 2. 남은 행들 중 정답이나 설명이 하나라도 비어있는지 확인 (필수값 검증)
    const incompleteProblems = validProblems.filter(p => !p.description.trim() || !p.answer.trim());
    if (incompleteProblems.length > 0) {
      toast.error('모든 문제의 설명과 정답(필수)을 입력해주세요');
      return;
    }
    
    try {
      const newFileId = fileId === 'new' ? crypto.randomUUID() : fileId;
      
      const fileData = {
        id: newFileId,
        originalFilename: filename.endsWith('.custom') ? filename : `${filename}.custom`,
        fileType: 'custom',
        totalProblems: validProblems.length,
        createdAt: fileId === 'new' ? new Date().toISOString() : currentFile?.createdAt,
        updatedAt: new Date().toISOString(),
        deletedAt: null
      };
      
      await saveFile(fileData);
      
      const problemsWithFileId = validProblems.map((p, index) => ({
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
  
  // 검색 필터링된 문제 목록
  const filteredProblems = problems.filter(problem => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const desc = problem.description.toLowerCase();
    const ans = problem.answer.toLowerCase();
    const choices = problem.choices.map(c => c.toLowerCase()).join(' ');
    
    // 일반 검색
    const exactMatch = desc.includes(query) || ans.includes(query) || choices.includes(query);
    
    // 초성 검색
    const chosungMatch = chosungIncludes(problem.description, query) ||
                        chosungIncludes(problem.answer, query) ||
                        problem.choices.some(c => chosungIncludes(c, query));
    
    return exactMatch || chosungMatch;
  });
  
  // 현재 에디터에 표시되는 가장 많은 선택지 개수 (그리드 열 생성 기준)
  const maxChoices = Math.max(...problems.map(p => p.choices.length));
  
  return (
    <div className="editor-page">
      <div className="editor-container">
        <header className="editor-compact-header">
          <div className="compact-header-container">
            <button className="compact-back-btn" onClick={() => navigate('/')} title="취소 및 돌아가기">
              ←
            </button>
            
            <input
              type="text"
              className="compact-filename-input"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="파일명 입력"
            />

            <div className="compact-tools">
              <button 
                className={`compact-tool-btn search ${isSearchOpen ? 'active' : ''}`} 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                title="검색"
              >
                🔍
              </button>
              <button className="compact-tool-btn add" onClick={addProblem} title="문제 추가">
                ➕
              </button>
              {fileId !== 'new' && (
                <button className="compact-tool-btn reset" onClick={handleResetAllProgress} title="진행 상황 초기화">
                  🔄
                </button>
              )}
            </div>

            <div className="compact-actions">
              {selectedIds.size > 0 && (
                <button className="compact-delete-btn" onClick={removeSelected} title="선택 삭제">
                  🗑️ {selectedIds.size}
                </button>
              )}
              <button className="compact-save-btn" onClick={handleSave}>
                💾 <span className="desktop-only-text">저장</span>
              </button>
            </div>
          </div>
          
          {isSearchOpen && (
            <div className="compact-search-drawer">
              <input
                type="text"
                className="compact-search-input"
                placeholder="검색어 입력... (초성 가능)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <span className="compact-stats">
                {searchQuery ? `${filteredProblems.length} / ` : ''}{problems.length}
              </span>
            </div>
          )}
        </header>
        
        <main className="editor-content-grid">
          <div className="grid-wrapper">
            {/* 데스크탑: 테이블 그리드 뷰 */}
            <table className="problems-grid desktop-only">
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
                  <th className="col-description">설명/문제 <span className="req-star">(필수)</span></th>
                  <th className="col-answer">정답 <span className="req-star">(필수)</span></th>
                  <th className="col-hint">힌트</th>
                  <th className="col-explanation">해설</th>
                  {/* 동적 선택지 헤더 생성 */}
                  {Array.from({ length: maxChoices + 1 }).map((_, i) => (
                    <th key={i} className="col-choice">선택지 {i + 1}</th>
                  ))}
                  <th className="col-actions">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredProblems.map((problem, index) => {
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
                          {isCompleted ? '✅' : '⏳'}
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
                          onChange={(e) => updateProblem(problem.id, 'description', e.target.value)}
                          placeholder="문제 입력..."
                          rows={2}
                        />
                      </td>
                      <td className="col-answer">
                        <input
                          type="text"
                          value={problem.answer}
                          onChange={(e) => updateProblem(problem.id, 'answer', e.target.value)}
                          placeholder="정답 입력..."
                        />
                      </td>
                      <td className="col-hint">
                        <textarea
                          value={problem.hint || ''}
                          onChange={(e) => updateProblem(problem.id, 'hint', e.target.value)}
                          placeholder="힌트(선택)..."
                          rows={2}
                        />
                      </td>
                      <td className="col-explanation">
                        <textarea
                          value={problem.explanation || ''}
                          onChange={(e) => updateProblem(problem.id, 'explanation', e.target.value)}
                          placeholder="해설(선택)..."
                          rows={2}
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
                                onChange={(e) => updateChoice(problem.id, choiceIdx, e.target.value)}
                                placeholder={`선택지 ${choiceIdx + 1}`}
                              />
                              <button
                                className="remove-choice-icon"
                                onClick={() => removeChoice(problem.id, choiceIdx)}
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
                                onClick={() => addChoice(problem.id)}
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
                          onClick={() => removeProblem(problem.id)}
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

            {/* 모바일: 카드 리스트 뷰 */}
            <div className="mobile-card-list mobile-only">
              {filteredProblems.map((problem, index) => {
                const progress = progressMap[problem.id];
                const isCompleted = progress?.isCompleted;
                const wrongCount = progress?.wrongCount || 0;
                const isSelected = selectedIds.has(problem.id);

                return (
                  <div key={problem.id} className={`mobile-problem-card ${isSelected ? 'selected' : ''}`}>
                    <div className="card-header">
                      <div className="card-header-left">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelect(problem.id)}
                        />
                        <span className="card-number">#{index + 1}</span>
                        <span className={`status-badge mini ${isCompleted ? 'completed' : 'pending'}`}>
                          {isCompleted ? '✅' : '⏳'}
                        </span>
                        {wrongCount > 0 && <span className="wrong-badge mini">{wrongCount}회 틀림</span>}
                      </div>
                      <button
                        className="card-delete-btn"
                        onClick={() => removeProblem(problem.id)}
                        disabled={problems.length === 1}
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="card-body">
                      <div className="input-group required">
                        <label>질문/설명 <span className="req-star">(필수)</span></label>
                        <textarea
                          value={problem.description}
                          onChange={(e) => updateProblem(problem.id, 'description', e.target.value)}
                          placeholder="문제를 입력하세요"
                          rows={2}
                        />
                      </div>
                      <div className="input-group required">
                        <label>정답 <span className="req-star">(필수)</span></label>
                        <input
                          type="text"
                          value={problem.answer}
                          onChange={(e) => updateProblem(problem.id, 'answer', e.target.value)}
                          placeholder="정답을 입력하세요"
                        />
                      </div>
                      <div className="input-row">
                        <div className="input-group">
                          <label>💡 힌트</label>
                          <textarea
                            value={problem.hint || ''}
                            onChange={(e) => updateProblem(problem.id, 'hint', e.target.value)}
                            placeholder="힌트(선택)"
                            rows={1}
                          />
                        </div>
                        <div className="input-group">
                          <label>📖 해설</label>
                          <textarea
                            value={problem.explanation || ''}
                            onChange={(e) => updateProblem(problem.id, 'explanation', e.target.value)}
                            placeholder="해설(선택)"
                            rows={1}
                          />
                        </div>
                      </div>

                      <div className="card-choices-section">
                        <label>선택지 목록</label>
                        <div className="mobile-choices-grid">
                          {problem.choices.map((choice, cIdx) => (
                            <div key={cIdx} className="choice-item">
                              <input
                                type="text"
                                value={choice}
                                onChange={(e) => updateChoice(problem.id, cIdx, e.target.value)}
                                placeholder={`선택지 ${cIdx + 1}`}
                              />
                              <button 
                                className="choice-remove-btn"
                                onClick={() => removeChoice(problem.id, cIdx)}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <button 
                            className="mobile-add-choice-btn"
                            onClick={() => addChoice(problem.id)}
                          >
                            + 추가
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollEndRef} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
