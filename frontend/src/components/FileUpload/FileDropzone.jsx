/**
 * @file FileDropzone.jsx
 * @description 드래그 앤 드롭 또는 파일 선택을 통해 문제집 파일(.xlsx, .csv, .txt)을 업로드하는 컴포넌트입니다.
 */

import { useDropzone } from 'react-dropzone';
import { useFileStore } from '../../stores/useFileStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import toast from 'react-hot-toast';
import './FileDropzone.css';

export const FileDropzone = () => {
  const { uploadMultipleFiles } = useFileStore();
  const { settings, updateSetting } = useSettingsStore();

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    const loadingToast = toast.loading(`${acceptedFiles.length}개의 파일 처리 중...`);
    
    try {
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt']
    }
  });

  return (
    <div className="file-upload-container">
      <div className="upload-settings">
        <label className="header-toggle">
          <input 
            type="checkbox" 
            checked={settings.hasHeaderRow} 
            onChange={(e) => updateSetting('hasHeaderRow', e.target.checked)}
          />
          <span>첫 번째 행은 제목(헤더)임 (가져올 때 제외)</span>
        </label>
      </div>

      <div 
        {...getRootProps()} 
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-content">
          <span className="upload-icon">📁</span>
          {isDragActive ? (
            <p className="dropzone-text">파일을 여기에 놓아주세요...</p>
          ) : (
            <>
              <p className="dropzone-text">엑셀, CSV, TXT 파일을 드래그하거나 클릭하여 업로드</p>
              <p className="dropzone-hint">여러 파일을 한 번에 올릴 수 있습니다.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
