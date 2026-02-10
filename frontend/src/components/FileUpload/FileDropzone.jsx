/**
 * @file FileDropzone.jsx
 * @description 드래그 앤 드롭 또는 파일 선택을 통해 문제집 파일(.xlsx, .csv, .txt)을 업로드하는 컴포넌트입니다.
 */

import { useDropzone } from 'react-dropzone';
import { useFileStore } from '../../stores/useFileStore';
import toast from 'react-hot-toast';
import './FileList.css'; // 공유 스타일 사용

export const FileDropzone = () => {
  const { uploadMultipleFiles } = useFileStore();

  /**
   * 파일이 드롭되거나 선택되었을 때 실행되는 콜백 함수입니다.
   * @param {Array} acceptedFiles - 수락된 파일 객체 배열
   */
  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    // 로딩 토스트 시작
    const loadingToast = toast.loading(`${acceptedFiles.length}개의 파일 처리 중...`);
    
    try {
      // 스토어의 uploadMultipleFiles 액션을 호출하여 병렬 처리를 수행합니다.
      const result = await uploadMultipleFiles(acceptedFiles);
      
      toast.dismiss(loadingToast);

      if (result.successCount > 0) {
        if (result.failCount === 0) {
          toast.success(`${result.successCount}개의 파일 업로드 완료!`);
        } else {
          toast.success(`${result.successCount}개 성공, ${result.failCount}개 실패`);
        }
      } else if (result.failCount > 0) {
        toast.error('파일 업로드에 실패했습니다.');
      }

      // 실패한 파일이 있다면 에러 내용 출력
      result.details?.forEach(detail => {
        if (!detail.success) {
          toast.error(`"${detail.fileName}": ${detail.error}`, { duration: 4000 });
        }
      });

    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('파일 처리 중 예상치 못한 오류가 발생했습니다.');
      console.error('Upload error:', error);
    }
  };

  // react-dropzone 설정
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true, // 여러 파일 허용
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt']
    }
  });

  return (
    <div 
      {...getRootProps()} 
      className={`file-dropzone ${isDragActive ? 'active' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="dropzone-content">
        <span className="upload-icon">📁</span>
        {isDragActive ? (
          <p>파일을 여기에 놓아주세요...</p>
        ) : (
          <p>엑셀, CSV, TXT 파일을 드래그하거나 클릭하여 업로드</p>
        )}
      </div>
    </div>
  );
};
