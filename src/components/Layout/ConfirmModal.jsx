import React, { useEffect, useState } from 'react';
import { Trash2, AlertTriangle, X, AlertCircle } from 'lucide-react';


const ConfirmModal = ({ isOpen, onConfirm, onCancel, title, message, type = 'delete' }) => {
  const [modal, setModal] = useState(null);

  useEffect(() => {
    // If used as a global singleton (via events)
    const handleOpen = (e) => {
      const { title, message, onConfirm, type = 'delete' } = e.detail;
      setModal({ title, message, onConfirm, type });
    };

    window.addEventListener('open-confirm-modal', handleOpen);
    return () => window.removeEventListener('open-confirm-modal', handleOpen);
  }, []);

  // Determine if we should show the modal (either from props or internal state)
  const isVisible = isOpen || !!modal;
  const currentData = modal || { title, message, onConfirm, onCancel, type };

  if (!isVisible) return null;

  const handleConfirm = () => {
    if (modal) {
      modal.onConfirm && modal.onConfirm();
      setModal(null);
    } else {
      onConfirm && onConfirm();
    }
  };

  const handleCancel = () => {
    if (modal) {
      setModal(null);
    } else {
      onCancel && onCancel();
    }
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex' }} onClick={handleCancel}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="modal-top">
          <div className="modal-icon-ring" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
            <Trash2 size={32} color="#ef4444" strokeWidth={2.5} />
          </div>
          <div className="modal-title">{currentData.title || 'Are you sure?'}</div>
          <div className="modal-sub">
            {currentData.message || 'This action will permanently remove this item. This cannot be undone.'}
          </div>
        </div>
        
        <div className="modal-body">
          <div className="warn-box">
            <AlertTriangle size={18} color="#f59e0b" style={{ marginTop: '2px' }} />
            <span style={{ fontSize: '0.8rem', color: '#f59e0b', lineHeight: 1.5 }}>
              This action is <strong>irreversible</strong>. Please double-check before proceeding.
            </span>
          </div>

          
          <div className="modal-btns">
            <button className="mbtn-cancel" onClick={handleCancel}>
              Cancel
            </button>
            <button 
              className="mbtn-confirm" 
              style={{ background: '#ef4444' }} 
              onClick={handleConfirm}
            >
              <Trash2 size={16} />
              Yes, Delete It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default ConfirmModal;
