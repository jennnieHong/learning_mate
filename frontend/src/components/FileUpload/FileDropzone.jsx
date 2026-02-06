/**
 * @file FileDropzone.jsx
 * @description 드래그 앤 드롭 또는 파일 선택을 통해 문제집 파일(.xlsx, .csv, .txt)을 업로드하는 컴포넌트입니다.
 */

import { useDropzone } from 'react-dropzone';
import { useFileStore } from '../../stores/useFileStore';
import toast from 'react-hot-toast';
import './FileList.css'; // 공유 스타일 사용

export const FileDropzone = () => {
  const { uploadFile } = useFileStore();

  /**
   * 파일이 드롭되거나 선택되었을 때 실행되는 콜백 함수입니다.
   * @param {Array} acceptedFiles - 수락된 파일 객체 배열
   */
  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    try {
      // 스토어의 uploadFile 액션을 호출하여 파싱 및 저장을 수행합니다.
      const result = await uploadFile(file);
      
      if (result.success) {
        toast.success(`"${file.name}" 업로드 완료! (${result.problemCount}개 문제)`);
      } else {
        toast.error(result.error || '파일 업로드에 실패했습니다.');
      }
    } catch (error) {
      toast.error('파일 처리 중 예상치 못한 오류가 발생했습니다.');
      console.error('Upload error:', error);
    }
  };

  // react-dropzone 설정
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false, // 한 번에 하나의 파일만 허용
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
