import React, { useEffect, useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, onConfirm, onCancel, title, message, type = 'delete' }) => {
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const handleOpen = (e) => {
      const { title, message, onConfirm, type = 'delete' } = e.detail;
      setModal({ title, message, onConfirm, type });
    };
    window.addEventListener('open-confirm-modal', handleOpen);
    return () => window.removeEventListener('open-confirm-modal', handleOpen);
  }, []);

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
    if (modal) setModal(null);
    else onCancel && onCancel();
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex' }} onClick={handleCancel}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="modal-top">
          <div className="modal-icon-ring" style={{ background: 'var(--danger-soft)' }}>
            <Trash2 size={30} color="var(--danger)" strokeWidth={2.4} />
          </div>
          <div className="modal-title">{currentData.title || 'Are you sure?'}</div>
          <div className="modal-sub">
            {currentData.message || 'This action will permanently remove this item. This cannot be undone.'}
          </div>
        </div>

        <div className="modal-body">
          <div className="warn-box">
            <AlertTriangle size={18} color="var(--warning)" style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--warning)', lineHeight: 1.5, fontWeight: 500 }}>
              This action is <strong>irreversible</strong>. Please double-check before proceeding.
            </span>
          </div>

          <div className="modal-btns">
            <button className="mbtn-cancel" onClick={handleCancel}>Cancel</button>
            <button
              className="mbtn-confirm"
              style={{ background: 'var(--danger)' }}
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
