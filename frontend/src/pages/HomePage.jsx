/**
 * @file HomePage.jsx
 * @description 애플리케이션의 메인 진입 페이지입니다.
 * 파일 업로드 UI와 업로드된 문제집 목록을 보여주며, 오답 노트 학습을 시작할 수 있는 대시보드를 제공합니다.
 */

import { useEffect, useState } from 'react';
import { FileDropzone } from '../components/FileUpload/FileDropzone';
import { FileList } from '../components/FileUpload/FileList';
import { FileFormatGuide } from '../components/FileUpload/FileFormatGuide';
import { FontScaleWidget } from '../components/Common/FontScaleWidget';
import { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useFileStore } from '../stores/useFileStore';
import { useProgressStore } from '../stores/useProgressStore';
import toast from 'react-hot-toast';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  
  // 스토어 상태 및 액션 추출
  const { selectedFileIds, loadAggregatedReview } = useFileStore();
  const { progressMap, loadAllProgress } = useProgressStore();
  
  // 현재 선택된 파일들의 전체 오답 수
  const [wrongCount, setWrongCount] = useState(0);

  /**
   * 컴포넌트 마운트 시 모든 문제의 진행 상황을 불러옵니다 (오답 뱃지용).
   */
  useEffect(() => {
    loadAllProgress();
  }, [loadAllProgress]);

  /**
   * 선택된 파일 ID 목록이나 진행 데이터가 변경될 때마다 오답 개수를 다시 계산합니다.
   */
  useEffect(() => {
    let count = 0;
    Object.values(progressMap).forEach(progress => {
      // 1. 선택된 파일이 없으면 '전체'를 대상으로 함
      // 2. 선택된 파일이 있으면 해당 파일들에 속한 데이터만 필터링
      const isTarget = selectedFileIds.length === 0 || selectedFileIds.includes(progress.fileSetId);
      if (isTarget && progress.isCorrect === false) {
        count++;
      }
    });
    setWrongCount(count);
  }, [selectedFileIds, progressMap]);

  /**
   * 오답 학습 모드(Aggregated Review)로 진입합니다.
   */
  const handleStartReview = async () => {
    const result = await loadAggregatedReview();
    if (result.success) {
      // 가상의 파일 아이디 'aggregated-review' 경로로 이동
      navigate('/study/aggregated-review');
    } else {
      toast.error(result.message || '오답 학습을 시작할 수 없습니다.');
    }
  };
  
  return (
    <div className="home-page">
      {/* 알림 메시지용 토스터 컨테이너 */}
      <Toaster position="top-center" />
      
      <header className="home-header">
        <h1>🎓 LearningMate</h1>
        <p>파일 업로드로 쉽게 시작하는 학습 관리</p>
        <div className="header-actions">
          <button className="header-btn" onClick={() => navigate('/settings')}>
            ⚙️ 설정
          </button>
          <button className="header-btn" onClick={() => navigate('/trash')}>
            🗑️ 휴지통
          </button>
          <button className="header-btn primary" onClick={() => navigate('/editor/new')}>
            ➕ 새로 만들기
          </button>
        </div>
      </header>
      
      <main className="home-content">
        {/* 파일 업로드 영역 */}
        <section className="upload-section">
          <FileDropzone />
          <FileFormatGuide />
        </section>

        {/* 오답 노트 대시보드 - 오답이 존재할 때만 표시 */}
        {wrongCount > 0 && (
          <section className="review-dashboard">
            <div className="review-card">
              <div className="review-info">
                <h3>✍️ 오답 노트 모아보기</h3>
                <p>
                  {selectedFileIds.length === 0 
                    ? '전체 문제집' 
                    : `선택된 ${selectedFileIds.length}개 문제집`}에서 
                  <strong> {wrongCount}개</strong>의 오답이 발견되었습니다.
                </p>
              </div>
              <button className="start-review-btn" onClick={handleStartReview}>
                🔥 오답 학습 바로 시작
              </button>
            </div>
          </section>
        )}
        
        {/* 업로드된 파일 그리드 목록 */}
        <section className="files-section">
          <FileList />
        </section>
      </main>
      <FontScaleWidget />
    </div>
  );
}
