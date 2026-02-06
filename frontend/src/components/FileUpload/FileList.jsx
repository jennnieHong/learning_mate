/**
 * @file FileList.jsx
 * @description 업로드된 전체 파일 목록을 카드 형태로 보여주고, 학습 시작, 편집, 삭제 등의 기능을 제공하는 컴포넌트입니다.
 */

import { useEffect } from 'react';
import { useFileStore } from '../../stores/useFileStore';
import { useProgressStore } from '../../stores/useProgressStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './FileList.css';

export const FileList = () => {
  const navigate = useNavigate();
  const { 
    files, 
    loadFiles, 
    deleteFile, 
    isLoading, 
    selectedFileIds, 
    toggleFileSelection,
    selectAllFiles 
  } = useFileStore();
  
  const { progressMap, loadAllProgress } = useProgressStore();

  /**
   * 컴포넌트 마운트 시 파일 목록과 전체 진행 상황을 로드합니다.
   */
  useEffect(() => {
    loadFiles();
    loadAllProgress();
  }, [loadFiles, loadAllProgress]);

  /**
   * 특정 파일의 학습(Study) 화면으로 이동합니다.
   * @param {string} fileId - 이동할 파일 ID
   */
  const handleStudy = (fileId) => {
    navigate(`/study/${fileId}`);
  };

  /**
   * 특정 파일을 휴지통으로 이동시킵니다.
   * @param {string} fileId - 삭제할 파일 ID
   * @param {string} filename - 파일 이름 (알림창 표시용)
   */
  const handleDelete = async (e, fileId, filename) => {
    e.stopPropagation(); // 카드 전체 클릭 이벤트 전파 방지
    if (confirm(`"${filename}"을(를) 휴지통으로 보내시겠습니까?`)) {
      const result = await deleteFile(fileId);
      if (result.success) {
        toast.success('파일이 휴지통으로 이동되었습니다.');
      }
    }
  };

  /**
   * 파일 편집(Editor) 화면으로 이동합니다.
   * @param {string} fileId - 편집할 파일 ID
   */
  const handleEdit = (e, fileId) => {
    e.stopPropagation();
    navigate(`/editor/${fileId}`);
  };

  /**
   * 특정 파일의 진행률(완료된 문제 / 전체 문제)을 계산합니다.
   * @param {string} fileId - 파일 ID
   * @param {number} total - 전체 문제 수
   */
  const getProgress = (fileId, total) => {
    const completedCount = Object.values(progressMap).filter(
      p => p.fileSetId === fileId && p.isCompleted
    ).length;
    return {
      count: completedCount,
      percent: Math.round((completedCount / total) * 100) || 0
    };
  };

  // 모든 파일이 선택되었는지 여부
  const isAllSelected = files.length > 0 && selectedFileIds.length === files.length;

  if (isLoading && files.length === 0) return <div className="loading">파일 목록 로딩 중...</div>;

  return (
    <div className="file-list-container">
      {/* 목록 헤더 및 전체 선택 컨트롤 */}
      <div className="list-header">
        <h2>📑 문제집 목록 ({files.length})</h2>
        {files.length > 0 && (
          <div className="list-controls">
            <label className="select-all">
              <input 
                type="checkbox" 
                checked={isAllSelected}
                onChange={(e) => selectAllFiles(e.target.checked)}
              />
              전체 선택
            </label>
          </div>
        )}
      </div>

      {files.length === 0 ? (
        <div className="empty-list">
          <p>아직 업로드된 파일이 없습니다. 위 영역에 파일을 드래그해 보세요!</p>
        </div>
      ) : (
        <div className="file-grid">
          {files.map((file) => {
            const { count, percent } = getProgress(file.id, file.totalProblems);
            const isSelected = selectedFileIds.includes(file.id);

            return (
              <div 
                key={file.id} 
                className={`file-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleStudy(file.id)}
              >
                {/* 체크박스 영역 */}
                <div className="card-selection" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => toggleFileSelection(file.id)}
                  />
                </div>

                <div className="file-info">
                  <div className="file-type-icon">
                    {file.fileType === 'xlsx' || file.fileType === 'xls' ? '📊' : '📄'}
                  </div>
                  <h3 className="file-name" title={file.originalFilename}>
                    {file.originalFilename}
                  </h3>
                  <div className="file-meta">
                    문제 {file.totalProblems}개 • 
                    {new Date(file.createdAt).toLocaleDateString('ko-KR')}
                  </div>
                </div>

                {/* 진행률 바 */}
                <div className="progress-container">
                  <div className="progress-text">
                    <span>학습 완료: {count}/{file.totalProblems}</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>

                {/* 카드 하단 액션 버튼 */}
                <div className="file-card-actions">
                  <button 
                    className="action-btn edit-btn"
                    onClick={(e) => handleEdit(e, file.id)}
                    title="편집"
                  >
                    ✏️ 편집
                  </button>
                  <button 
                    className="action-btn delete-btn"
                    onClick={(e) => handleDelete(e, file.id, file.originalFilename)}
                    title="삭제"
                  >
                    🗑️ 삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
