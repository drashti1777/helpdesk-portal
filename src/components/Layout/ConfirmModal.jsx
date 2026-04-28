import React, { useEffect, useState } from 'react';
import { Trash2, TriangleAlert, X, AlertCircle } from 'lucide-react';

const ConfirmModal = () => {
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const handleOpen = (e) => {
      const { title, message, onConfirm, type = 'delete' } = e.detail;
      setModal({ title, message, onConfirm, type });
    };

    window.addEventListener('open-confirm-modal', handleOpen);
    return () => window.removeEventListener('open-confirm-modal', handleOpen);
  }, []);

  if (!modal) return null;

  const handleConfirm = () => {
    modal.onConfirm && modal.onConfirm();
    setModal(null);
  };

  return (
    <div className="modal-overlay" onClick={() => setModal(null)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-top">
          <div className="modal-icon-ring" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
            <Trash2 size={32} color="#ef4444" strokeWidth={2.5} />
          </div>
          <div className="modal-title">{modal.title || 'Are you sure?'}</div>
          <div className="modal-sub">
            {modal.message || 'This action will permanently remove this item. This cannot be undone.'}
          </div>
        </div>
        
        <div className="modal-body">
          <div className="warn-box">
            <TriangleAlert size={18} color="#f59e0b" style={{ marginTop: '2px' }} />
            <span style={{ fontSize: '0.8rem', color: '#f59e0b', lineHeight: 1.5 }}>
              This action is <strong>irreversible</strong>. Please double-check before proceeding.
            </span>
          </div>
          
          <div className="modal-btns">
            <button className="mbtn-cancel" onClick={() => setModal(null)}>
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
