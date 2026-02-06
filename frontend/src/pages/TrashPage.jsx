/**
 * @file TrashPage.jsx
 * @description 삭제된 파일들을 모아보고 복원하거나 영구 삭제할 수 있는 휴지통 페이지입니다.
 */

import { useEffect } from 'react';
import { useFileStore } from '../stores/useFileStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './TrashPage.css';

export default function TrashPage() {
  // 스토어 상태 및 액션 추출
  const { trashedFiles, loadTrash, restoreFileFromTrash, deletePermanently, isLoading } = useFileStore();
  const navigate = useNavigate();
  
  /**
   * 페이지 진입 시 휴지통 목록을 새로 고칩니다.
   */
  useEffect(() => {
    loadTrash();
  }, [loadTrash]);
  
  /**
   * 파일을 원래 목록으로 복원합니다.
   * @param {string} fileId - 복원할 파일 ID
   * @param {string} filename - 파일 이름 (토스트 알림용)
   */
  const handleRestore = async (fileId, filename) => {
    const result = await restoreFileFromTrash(fileId);
    if (result.success) {
      toast.success(`"${filename}"이(가) 복원되었습니다`);
    } else {
      toast.error('복원 중 오류가 발생했습니다');
    }
  };
  
  /**
   * 파일을 시스템에서 영구히 삭제합니다.
   * @param {string} fileId - 삭제할 파일 ID
   * @param {string} filename - 파일 이름 (알람창 및 토스트용)
   */
  const handlePermanentDelete = async (fileId, filename) => {
    // 중요한 작업이므로 다시 한번 확인합니다.
    const isConfirmed = window.confirm(
      `"${filename}"을(를) 영구 삭제하시겠습니까?\n\n` +
      '⚠️ 다음 데이터가 모두 삭제되며 복구할 수 없습니다:\n' +
      '• 모든 문제\n' +
      '• 학습 진행 상황\n' +
      '• 완료/미완료 기록'
    );

    if (isConfirmed) {
      const result = await deletePermanently(fileId);
      if (result.success) {
        toast.success('파일이 영구 삭제되었습니다');
      } else {
        toast.error('삭제 중 오류가 발생했습니다');
      }
    }
  };
  
  /**
   * 삭제된 후 휴지통에 머문 기간(일수)을 계산합니다.
   * @param {string} deletedAt - 삭제 일자 문자열
   */
  const getDaysInTrash = (deletedAt) => {
    const deleted = new Date(deletedAt);
    const now = new Date();
    // 밀리초 차이를 하루 단위로 환산
    const days = Math.floor((now - deleted) / (1000 * 60 * 60 * 24));
    return days;
  };
  
  return (
    <div className="trash-page">
      <div className="trash-container">
        <header className="trash-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← 돌아가기
          </button>
          <h1>🗑️ 휴지통</h1>
          <div className="header-spacer"></div>
        </header>
        
        {isLoading ? (
          <div className="loading">로딩 중...</div>
        ) : trashedFiles.length === 0 ? (
          /* 휴지통이 비어있는 상태 */
          <div className="empty-trash">
            <p>휴지통이 비어있습니다</p>
          </div>
        ) : (
          /* 삭제된 파일 카드 목록 */
          <div className="trash-list">
            {trashedFiles.map((file) => (
              <div key={file.id} className="trash-item">
                <div className="trash-icon">🗑️</div>
                
                <div className="trash-info">
                  <h3>{file.originalFilename}</h3>
                  <p className="trash-stats">
                    문제 {file.totalProblems}개 • 
                    휴지통 기간 {getDaysInTrash(file.deletedAt)}일째
                  </p>
                  <p className="trash-date">
                    삭제일: {new Date(file.deletedAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                
                <div className="trash-actions">
                  <button 
                    className="btn btn-restore"
                    onClick={() => handleRestore(file.id, file.originalFilename)}
                    title="기존 목록으로 복원"
                  >
                    🔄 복원
                  </button>
                  <button 
                    className="btn btn-delete"
                    onClick={() => handlePermanentDelete(file.id, file.originalFilename)}
                    title="영구 삭제"
                  >
                    🔥 삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
