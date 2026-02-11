import { motion, AnimatePresence } from 'framer-motion';
import './StudyModal.css';

/**
 * @file StudyModal.jsx
 * @description 학습 중 힌트나 해설을 띄워주는 공통 모달 컴포넌트입니다.
 */
export default function StudyModal({ isOpen, onClose, title, content, type }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="study-modal-overlay"
          className="study-modal-overlay" 
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <div 
            className="study-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <header className={`study-modal-header ${type}`}>
              <span className="modal-icon">{type === 'hint' ? '💡' : '📖'}</span>
              <h3>{title}</h3>
              <button className="modal-close-btn" onClick={onClose} aria-label="닫기">×</button>
            </header>
            <div className="study-modal-content">
              <p>{content}</p>
            </div>
            <footer className="study-modal-footer">
              <button className="modal-confirm-btn" onClick={onClose}>확인</button>
            </footer>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
